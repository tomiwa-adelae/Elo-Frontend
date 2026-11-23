"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import { ArrowLeft, ArrowRight, ExternalLink, Plus, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { UploadButton } from "@/components/admin/image-upload"
import { useTwoStep } from "@/components/admin/use-two-step"
import { refreshStorefront } from "@/app/admin/actions"
import {
  ErrorState,
  FormField,
  Loading,
  NairaInput,
  Panel,
  btnDanger,
  btnOutline,
  btnPrimary,
  inputCls,
  runAction,
  useAdminQuery,
} from "@/components/admin/ui"
import { api, errorMessage } from "@/lib/api"
import type {
  AdminCategory,
  AdminCollection,
  EditorOption,
  EditorProduct,
  EditorVariant,
} from "@/lib/admin-types"
import { naira } from "@/lib/format"
import { cn } from "@/lib/utils"

const BLANK: EditorProduct = {
  title: "",
  description: null,
  categoryId: null,
  status: "DRAFT",
  brand: null,
  material: null,
  careNotes: null,
  fitNotes: null,
  tags: [],
  collectionIds: [],
  images: [],
  options: [],
  variants: [],
}

const PRESETS: Record<string, string[]> = {
  Size: ["XS", "S", "M", "L", "XL"],
  Colour: [],
}

/** Stable key for a combination, in option order. */
const signature = (options: EditorOption[], picked: Record<string, string>) =>
  options.map((o) => `${o.name}=${picked[o.name] ?? ""}`).join("|")

function combinations(options: EditorOption[]): Record<string, string>[] {
  const usable = options.filter((o) => o.name.trim() && o.values.length)
  if (!usable.length) return [{}]
  return usable.reduce<Record<string, string>[]>(
    (acc, option) => acc.flatMap((combo) => option.values.map((v) => ({ ...combo, [option.name]: v.value }))),
    [{}]
  )
}

function newVariant(options: Record<string, string>, template?: EditorVariant): EditorVariant {
  return {
    options,
    priceKobo: template?.priceKobo ?? 0,
    compareAtPriceKobo: template?.compareAtPriceKobo ?? null,
    priceUsdCents: template?.priceUsdCents ?? null,
    compareAtUsdCents: template?.compareAtUsdCents ?? null,
    costKobo: template?.costKobo ?? null,
    stock: 0,
    allowBackorder: false,
    lowStockAt: template?.lowStockAt ?? 3,
    isActive: true,
    image: null,
  }
}

export function ProductEditor({ id }: { id?: string }) {
  const router = useRouter()
  const existing = useAdminQuery<EditorProduct>(id ? `/admin/products/${id}` : null)
  const categories = useAdminQuery<AdminCategory[]>("/admin/categories")
  const collections = useAdminQuery<AdminCollection[]>("/admin/collections")

  const [product, setProduct] = React.useState<EditorProduct | null>(id ? null : BLANK)
  // Every variant we know about, keyed by signature — includes rows that are
  // currently hidden because their option value was removed, so re-adding a
  // value restores its price and stock.
  const [variants, setVariants] = React.useState<Record<string, EditorVariant>>({})
  const [saving, setSaving] = React.useState(false)
  const [dirty, setDirty] = React.useState(false)
  const confirmDelete = useTwoStep()

  React.useEffect(() => {
    if (!existing.data) return
    const p = existing.data
    // eslint-disable-next-line react-hooks/set-state-in-effect -- seed editor from fetched product
    setProduct(p)
    const map: Record<string, EditorVariant> = {}
    for (const v of p.variants) map[signature(p.options, v.options)] = v
    setVariants(map)
  }, [existing.data])

  React.useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  if (id && existing.error) return <ErrorState message={existing.error} onRetry={existing.reload} />
  if (!product) return <Loading />

  const update = (patch: Partial<EditorProduct>) => {
    setProduct((p) => (p ? { ...p, ...patch } : p))
    setDirty(true)
  }

  const combos = combinations(product.options)
  const colourValues =
    product.options.find((o) => /colou?r/i.test(o.name))?.values.map((v) => v.value).filter(Boolean) ?? []
  const rows = combos.map((combo) => {
    const sig = signature(product.options, combo)
    return { sig, variant: variants[sig] ?? newVariant(combo, Object.values(variants)[0]) }
  })

  const setVariant = (sig: string, base: EditorVariant, patch: Partial<EditorVariant>) => {
    setVariants((m) => ({ ...m, [sig]: { ...(m[sig] ?? base), ...patch } }))
    setDirty(true)
  }

  // Options can be renamed; carry the variant data across to the new key.
  const setOptions = (next: EditorOption[], rename?: { from: string; to: string }) => {
    if (rename && rename.from !== rename.to) {
      setVariants((m) => {
        const remapped: Record<string, EditorVariant> = {}
        for (const v of Object.values(m)) {
          const options = { ...v.options }
          if (rename.from in options) {
            options[rename.to] = options[rename.from]
            delete options[rename.from]
          }
          remapped[signature(next, options)] = { ...v, options }
        }
        return remapped
      })
    } else {
      // Re-key so signatures follow the (possibly reordered) option list.
      setVariants((m) => {
        const rekeyed: Record<string, EditorVariant> = {}
        for (const v of Object.values(m)) rekeyed[signature(next, v.options)] = v
        return rekeyed
      })
    }
    update({ options: next })
  }

  const applyToAll = (patch: Partial<EditorVariant>) => {
    setVariants((m) => {
      const next = { ...m }
      for (const row of rows) next[row.sig] = { ...(m[row.sig] ?? row.variant), ...patch }
      return next
    })
    setDirty(true)
  }

  const save = async (statusOverride?: EditorProduct["status"]) => {
    const payloadOptions = product.options
      .filter((o) => o.name.trim())
      .map((o) => ({
        name: o.name.trim(),
        values: o.values.map((v) => ({ value: v.value, ...(v.swatch && { swatch: v.swatch }) })),
      }))
    const emptyOption = payloadOptions.find((o) => !o.values.length)
    if (emptyOption) return toast.error(`Add at least one value to “${emptyOption.name}”`)
    if (!product.title.trim()) return toast.error("Give the product a title")
    if (rows.some((r) => r.variant.isActive && r.variant.priceKobo <= 0)) {
      return toast.error("Every active variant needs a price")
    }

    const body = {
      title: product.title.trim(),
      ...(product.slug && { slug: product.slug }),
      description: product.description || null,
      categoryId: product.categoryId || null,
      status: statusOverride ?? product.status,
      brand: product.brand || null,
      material: product.material || null,
      careNotes: product.careNotes || null,
      fitNotes: product.fitNotes || null,
      tags: product.tags,
      collectionIds: product.collectionIds,
      images: product.images.map((i) => ({ url: i.url, alt: i.alt || null, colour: i.colour || null })),
      options: payloadOptions,
      // `reserved` is read-only; the API rejects unknown fields.
      variants: rows.map(({ variant: v }) => ({
        ...(v.id && { id: v.id }),
        options: v.options,
        ...(v.sku && { sku: v.sku }),
        priceKobo: v.priceKobo,
        compareAtPriceKobo: v.compareAtPriceKobo || null,
        priceUsdCents: v.priceUsdCents || null,
        compareAtUsdCents: v.compareAtUsdCents || null,
        costKobo: v.costKobo || null,
        stock: v.stock,
        allowBackorder: v.allowBackorder,
        lowStockAt: v.lowStockAt,
        isActive: v.isActive,
        image: v.image || null,
      })),
    }

    setSaving(true)
    try {
      const saved = id
        ? await api.patch<EditorProduct>(`/admin/products/${id}`, body)
        : await api.post<EditorProduct>("/admin/products", body)
      setDirty(false)
      toast.success(id ? "Saved" : "Product created")
      void refreshStorefront()
      if (!id) {
        router.replace(`/admin/products/${saved.id}`)
      } else {
        setProduct(saved)
        const map: Record<string, EditorVariant> = {}
        for (const v of saved.variants) map[signature(saved.options, v.options)] = v
        setVariants(map)
      }
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!id || !confirmDelete("Press Delete again. It leaves the store; past orders keep their copy.")) return
    if (await runAction(() => api.delete(`/admin/products/${id}`), "Product deleted")) {
      setDirty(false)
      router.replace("/admin/products")
    }
  }

  const moveImage = (index: number, by: number) => {
    const images = [...product.images]
    const [img] = images.splice(index, 1)
    images.splice(index + by, 0, img)
    update({ images })
  }

  const isLive = product.status === "ACTIVE"
  const flatCategories = (categories.data ?? []).slice().sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="pb-24">
      <Link href="/admin/products" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Products
      </Link>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-sans text-2xl font-semibold">{id ? product.title || "Untitled" : "New product"}</h1>
        {id && product.slug && isLive && (
          <Link href={`/products/${product.slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm underline">
            View in store <ExternalLink className="size-3.5" />
          </Link>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          <Panel title="Details">
            <div className="space-y-4">
              <FormField label="Title">
                <input value={product.title} onChange={(e) => update({ title: e.target.value })} className={inputCls} placeholder="e.g. Adire Wrap Dress" />
              </FormField>
              <FormField label="Description">
                <textarea
                  value={product.description ?? ""}
                  onChange={(e) => update({ description: e.target.value })}
                  rows={5}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Material (optional)">
                  <input value={product.material ?? ""} onChange={(e) => update({ material: e.target.value })} className={inputCls} />
                </FormField>
                <FormField label="Brand (optional)">
                  <input value={product.brand ?? ""} onChange={(e) => update({ brand: e.target.value })} className={inputCls} />
                </FormField>
              </div>
              <FormField label="Fit notes (optional)">
                <input value={product.fitNotes ?? ""} onChange={(e) => update({ fitNotes: e.target.value })} className={inputCls} placeholder="Runs small; size up for a relaxed fit" />
              </FormField>
              <FormField label="Care (optional)">
                <input value={product.careNotes ?? ""} onChange={(e) => update({ careNotes: e.target.value })} className={inputCls} placeholder="Hand wash cold" />
              </FormField>
            </div>
          </Panel>

          <Panel
            title="Photos"
            actions={
              <span className="text-xs text-muted-foreground">
                First photo is the cover{colourValues.length > 0 && ". Tag each with its colour so the gallery follows the shopper's pick"}
              </span>
            }
          >
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {product.images.map((image, i) => (
                <div key={`${i}-${image.url}`} className="group relative aspect-[3/4] overflow-hidden rounded-md border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.url} alt="" className="size-full object-cover" />
                  {i === 0 && <span className="absolute top-1 left-1 rounded bg-background/90 px-1.5 py-0.5 text-[10px] font-medium">Cover</span>}
                  {colourValues.length > 0 && (
                    <select
                      aria-label="Colour shown in this photo"
                      value={image.colour ?? ""}
                      onChange={(e) =>
                        update({
                          images: product.images.map((img, j) =>
                            j === i ? { ...img, colour: e.target.value || null } : img
                          ),
                        })
                      }
                      className="absolute top-1 right-1 max-w-[70%] rounded bg-background/90 px-1 py-0.5 text-[10px]"
                    >
                      <option value="">All colours</option>
                      {colourValues.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  )}
                  <div className="absolute inset-x-1 bottom-1 flex justify-between">
                    <div className="flex gap-1">
                      {i > 0 && (
                        <button type="button" aria-label="Move left" onClick={() => moveImage(i, -1)} className="rounded bg-background/90 p-1"><ArrowLeft className="size-3.5" /></button>
                      )}
                      {i < product.images.length - 1 && (
                        <button type="button" aria-label="Move right" onClick={() => moveImage(i, 1)} className="rounded bg-background/90 p-1"><ArrowRight className="size-3.5" /></button>
                      )}
                    </div>
                    <button type="button" aria-label="Remove photo" onClick={() => update({ images: product.images.filter((_, j) => j !== i) })} className="rounded bg-background/90 p-1 text-destructive">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {product.images.length < 20 && (
                <UploadButton
                  folder="products"
                  multiple
                  className="aspect-[3/4] flex-col"
                  onUploaded={(urls) => update({ images: [...product.images, ...urls.map((url) => ({ url, alt: null, colour: null }))].slice(0, 20) })}
                >
                  Add photos
                </UploadButton>
              )}
            </div>
          </Panel>

          <OptionsPanel options={product.options} onChange={setOptions} />

          <Panel title={product.options.length ? `Variants (${rows.length})` : "Price & stock"}>
            {product.options.length > 0 && rows.length > 1 && (
              <BulkApply onApply={applyToAll} />
            )}
            <div className="space-y-3">
              {rows.map(({ sig, variant }) => (
                <VariantRow
                  key={sig}
                  variant={variant}
                  label={Object.values(variant.options).join(" / ")}
                  images={product.images}
                  onChange={(patch) => setVariant(sig, variant, patch)}
                />
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Visibility">
            <div className="space-y-2">
              {(["ACTIVE", "DRAFT", "ARCHIVED"] as const).map((s) => (
                <label key={s} className="flex cursor-pointer items-start gap-2 text-sm">
                  <input type="radio" name="status" checked={product.status === s} onChange={() => update({ status: s })} className="mt-0.5 size-4 accent-[var(--primary)]" />
                  <span>
                    <span className="block font-medium">{s === "ACTIVE" ? "Live" : s === "DRAFT" ? "Draft" : "Archived"}</span>
                    <span className="block text-xs text-muted-foreground">
                      {s === "ACTIVE" ? "Visible and for sale" : s === "DRAFT" ? "Hidden while you finish it" : "Hidden, kept for records"}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </Panel>

          <Panel title="Organise">
            <div className="space-y-4">
              <FormField label="Category">
                <select value={product.categoryId ?? ""} onChange={(e) => update({ categoryId: e.target.value || null })} className={inputCls}>
                  <option value="">None</option>
                  {flatCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.parentId ? `— ${c.name}` : c.name}</option>
                  ))}
                </select>
              </FormField>
              <div className="space-y-1.5">
                <span className="text-sm font-medium">Collections</span>
                <div className="flex flex-wrap gap-2">
                  {(collections.data ?? []).map((c) => {
                    const on = product.collectionIds.includes(c.id)
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => update({ collectionIds: on ? product.collectionIds.filter((x) => x !== c.id) : [...product.collectionIds, c.id] })}
                        className={cn("rounded-full border px-3 py-1 text-xs", on ? "border-foreground bg-foreground text-background" : "hover:border-foreground")}
                      >
                        {c.name}
                      </button>
                    )
                  })}
                  {collections.data?.length === 0 && (
                    <Link href="/admin/categories" className="text-xs text-muted-foreground underline">Create a collection</Link>
                  )}
                </div>
              </div>
              <FormField label="Tags" hint="Comma separated. Used for search and filters.">
                <input
                  defaultValue={product.tags.join(", ")}
                  onBlur={(e) => update({ tags: [...new Set(e.target.value.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean))] })}
                  className={inputCls}
                  placeholder="adire, owambe, cotton"
                />
              </FormField>
            </div>
          </Panel>

          {id && (
            <button type="button" onClick={remove} className={cn(btnDanger, "w-full")}>
              <Trash2 className="size-4" /> Delete product
            </button>
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 px-4 py-3 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-6xl items-center justify-end gap-2">
          {dirty && <span className="mr-auto text-xs text-muted-foreground">Unsaved changes</span>}
          {!isLive && (
            <button type="button" disabled={saving} onClick={() => save("ACTIVE")} className={btnOutline}>
              Save & publish
            </button>
          )}
          <button type="button" disabled={saving} onClick={() => save()} className={btnPrimary}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  )
}

function OptionsPanel({
  options,
  onChange,
}: {
  options: EditorOption[]
  onChange: (next: EditorOption[], rename?: { from: string; to: string }) => void
}) {
  const [drafts, setDrafts] = React.useState<Record<number, string>>({})

  const addValue = (index: number) => {
    const raw = (drafts[index] ?? "").trim()
    if (!raw) return
    const option = options[index]
    const additions = raw
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v && !option.values.some((x) => x.value.toLowerCase() === v.toLowerCase()))
    if (!additions.length) return
    const next = [...options]
    next[index] = { ...option, values: [...option.values, ...additions.map((value) => ({ value, swatch: null }))] }
    onChange(next)
    setDrafts((d) => ({ ...d, [index]: "" }))
  }

  const isColour = (name: string) => /colou?r/i.test(name)

  return (
    <Panel title="Options" actions={<span className="text-xs text-muted-foreground">Size, colour… up to 3</span>}>
      {options.length === 0 && (
        <p className="mb-3 text-sm text-muted-foreground">One price and stock level? Skip this. Sells in sizes or colours? Add an option.</p>
      )}
      <div className="space-y-4">
        {options.map((option, index) => (
          <div key={index} className="space-y-3 rounded-md border p-3">
            <div className="flex gap-2">
              <input
                value={option.name}
                onChange={(e) => {
                  const next = [...options]
                  next[index] = { ...option, name: e.target.value }
                  onChange(next, { from: option.name, to: e.target.value })
                }}
                placeholder="Option name"
                className={inputCls}
              />
              <button
                type="button"
                aria-label="Remove option"
                onClick={() => onChange(options.filter((_, i) => i !== index))}
                className="shrink-0 px-2 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {option.values.map((v, vi) => (
                <span key={v.value} className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 py-1 pr-1.5 pl-2 text-xs">
                  {isColour(option.name) && (
                    <input
                      type="color"
                      aria-label={`${v.value} swatch`}
                      value={v.swatch ?? "#cccccc"}
                      onChange={(e) => {
                        const next = [...options]
                        const values = [...option.values]
                        values[vi] = { ...v, swatch: e.target.value }
                        next[index] = { ...option, values }
                        onChange(next)
                      }}
                      className="size-4 cursor-pointer rounded-full border-0 bg-transparent p-0"
                    />
                  )}
                  {v.value}
                  <button
                    type="button"
                    aria-label={`Remove ${v.value}`}
                    onClick={() => {
                      const next = [...options]
                      next[index] = { ...option, values: option.values.filter((_, j) => j !== vi) }
                      onChange(next)
                    }}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={drafts[index] ?? ""}
                onChange={(e) => setDrafts((d) => ({ ...d, [index]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addValue(index)
                  }
                }}
                placeholder={isColour(option.name) ? "Add colour, e.g. Black" : "Add value, e.g. M (or S, M, L)"}
                className={inputCls}
              />
              <button type="button" onClick={() => addValue(index)} className={btnOutline}>Add</button>
            </div>
          </div>
        ))}
      </div>
      {options.length < 3 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(PRESETS)
            .filter(([name]) => !options.some((o) => o.name.toLowerCase() === name.toLowerCase()))
            .map(([name, values]) => (
              <button
                key={name}
                type="button"
                onClick={() => onChange([...options, { name, values: values.map((value) => ({ value, swatch: null })) }])}
                className={cn(btnOutline, "h-9 px-3")}
              >
                <Plus className="size-4" /> {name}
              </button>
            ))}
          <button type="button" onClick={() => onChange([...options, { name: "", values: [] }])} className={cn(btnOutline, "h-9 px-3")}>
            <Plus className="size-4" /> Other option
          </button>
        </div>
      )}
    </Panel>
  )
}

function BulkApply({ onApply }: { onApply: (patch: Partial<EditorVariant>) => void }) {
  const [price, setPrice] = React.useState<number | null>(null)
  const [stock, setStock] = React.useState("")
  return (
    <div className="mb-4 flex flex-wrap items-end gap-2 rounded-md bg-muted/60 p-3">
      <div className="w-36">
        <span className="mb-1 block text-xs text-muted-foreground">Price for all</span>
        <NairaInput value={price} onChange={setPrice} />
      </div>
      <div className="w-24">
        <span className="mb-1 block text-xs text-muted-foreground">Stock for all</span>
        <input inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))} className={inputCls} />
      </div>
      <button
        type="button"
        className={btnOutline}
        onClick={() => {
          const patch: Partial<EditorVariant> = {}
          if (price) patch.priceKobo = price
          if (stock !== "") patch.stock = Number(stock)
          if (Object.keys(patch).length) onApply(patch)
        }}
      >
        Apply
      </button>
    </div>
  )
}

function VariantRow({
  variant,
  label,
  images,
  onChange,
}: {
  variant: EditorVariant
  label: string
  images: { url: string }[]
  onChange: (patch: Partial<EditorVariant>) => void
}) {
  const [open, setOpen] = React.useState(false)
  const reserved = variant.reserved ?? 0

  return (
    <div className={cn("rounded-md border p-3", !variant.isActive && "opacity-60")}>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-24 flex-1">
          <p className="text-sm font-medium">{label || "Default"}</p>
          <p className="text-xs text-muted-foreground">
            {variant.sku ?? "SKU on save"}
            {reserved > 0 && ` · ${reserved} held in checkouts`}
            {!!variant.waiting && (
              <span className="text-brand">
                {` · ${variant.waiting} waiting for a restock email`}
              </span>
            )}
          </p>
        </div>
        <div className="w-32">
          <span className="mb-1 block text-xs text-muted-foreground">Price</span>
          <NairaInput value={variant.priceKobo || null} onChange={(k) => onChange({ priceKobo: k ?? 0 })} required={variant.isActive} />
        </div>
        <div className="w-28">
          <span className="mb-1 block text-xs text-muted-foreground">USD price</span>
          <NairaInput symbol="$" placeholder="Auto" value={variant.priceUsdCents} onChange={(c) => onChange({ priceUsdCents: c })} />
        </div>
        <div className="w-20">
          <span className="mb-1 block text-xs text-muted-foreground">Stock</span>
          <input
            inputMode="numeric"
            value={String(variant.stock)}
            onChange={(e) => onChange({ stock: Number(e.target.value.replace(/\D/g, "") || 0) })}
            className={inputCls}
          />
        </div>
        <button type="button" onClick={() => setOpen((o) => !o)} className="h-10 text-xs text-muted-foreground underline">
          {open ? "Less" : "More"}
        </button>
      </div>
      {open && (
        <div className="mt-3 grid gap-3 border-t pt-3 sm:grid-cols-2">
          <FormField label="Compare-at price" hint="Shows as a sale: the old price, struck through.">
            <NairaInput value={variant.compareAtPriceKobo} onChange={(k) => onChange({ compareAtPriceKobo: k })} />
          </FormField>
          <FormField label="Compare-at price (USD)" hint="Leave blank to convert from naira.">
            <NairaInput symbol="$" placeholder="Auto" value={variant.compareAtUsdCents} onChange={(c) => onChange({ compareAtUsdCents: c })} />
          </FormField>
          <FormField label="Cost price (private)" hint={variant.costKobo && variant.priceKobo ? `Margin ${naira(variant.priceKobo - variant.costKobo)}` : "For your margin only."}>
            <NairaInput value={variant.costKobo} onChange={(k) => onChange({ costKobo: k })} />
          </FormField>
          <FormField label="SKU">
            <input value={variant.sku ?? ""} onChange={(e) => onChange({ sku: e.target.value || undefined })} placeholder="Auto-generated" className={inputCls} />
          </FormField>
          <FormField label="Low-stock alert at">
            <input inputMode="numeric" value={String(variant.lowStockAt)} onChange={(e) => onChange({ lowStockAt: Number(e.target.value.replace(/\D/g, "") || 0) })} className={inputCls} />
          </FormField>
          {images.length > 0 && (
            <FormField label="Photo for this variant" className="sm:col-span-2">
              <div className="flex flex-wrap gap-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onChange({ image: variant.image === img.url ? null : img.url })}
                    className={cn("size-12 overflow-hidden rounded border-2", variant.image === img.url ? "border-foreground" : "border-transparent")}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="" className="size-full object-cover" />
                  </button>
                ))}
              </div>
            </FormField>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={variant.allowBackorder} onChange={(e) => onChange({ allowBackorder: e.target.checked })} className="size-4 accent-[var(--primary)]" />
            Keep selling when out of stock (made to order)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={variant.isActive} onChange={(e) => onChange({ isActive: e.target.checked })} className="size-4 accent-[var(--primary)]" />
            Available for sale
          </label>
        </div>
      )}
    </div>
  )
}
