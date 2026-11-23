"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import * as React from "react"
import { SlidersHorizontal, X } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { CategoryNode, Filters } from "@/lib/types"
import { cn } from "@/lib/utils"

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "name_asc", label: "Name" },
]

// Only these option names map onto API filter params.
const OPTION_PARAM: Record<string, "size" | "colour"> = {
  size: "size",
  colour: "colour",
  color: "colour",
}

function useParamsEditor() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const update = React.useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(params.toString())
      mutate(next)
      next.delete("page")
      const qs = next.toString()
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [params, pathname, router]
  )

  return { params, update }
}

export function SortSelect() {
  const { params, update } = useParamsEditor()
  return (
    <select
      aria-label="Sort products"
      value={params.get("sort") ?? "newest"}
      onChange={(e) => update((p) => p.set("sort", e.target.value))}
      className="h-10 border border-stone bg-paper px-3 text-sm outline-none"
    >
      {SORTS.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  )
}

function FilterBody({
  filters,
  categories,
  showCategories,
}: {
  filters: Filters
  categories: CategoryNode[]
  showCategories: boolean
}) {
  const { params, update } = useParamsEditor()

  const toggle = (key: string, value: string) =>
    update((p) => {
      const current = p.getAll(key)
      p.delete(key)
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
      next.forEach((v) => p.append(key, v))
    })

  const flag = (key: string) =>
    update((p) => (p.get(key) === "true" ? p.delete(key) : p.set(key, "true")))

  const flatCategories = categories.flatMap((c) => [
    { ...c, depth: 0 },
    ...c.children.map((child) => ({ ...child, depth: 1 })),
  ])

  return (
    <div className="space-y-8 text-sm">
      {showCategories && flatCategories.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">Category</p>
          <div className="flex flex-col items-start gap-1.5">
            <button
              type="button"
              onClick={() => update((p) => p.delete("category"))}
              className={cn(
                "text-muted-foreground hover:text-foreground",
                !params.get("category") && "font-medium text-foreground"
              )}
            >
              All
            </button>
            {flatCategories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => update((p) => p.set("category", c.slug))}
                className={cn(
                  "text-muted-foreground hover:text-foreground",
                  c.depth && "pl-3",
                  params.get("category") === c.slug && "font-medium text-foreground"
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {filters.options
        .filter((o) => OPTION_PARAM[o.name.toLowerCase()])
        .map((option) => {
          const key = OPTION_PARAM[option.name.toLowerCase()]
          const selected = params.getAll(key)
          const isColour = key === "colour"
          return (
            <div key={option.name} className="space-y-2">
              <p className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">{option.name}</p>
              <div className="flex flex-wrap gap-2">
                {option.values.map((v) => {
                  const active = selected.includes(v.value)
                  return (
                    <button
                      key={v.value}
                      type="button"
                      onClick={() => toggle(key, v.value)}
                      className={cn(
                        "inline-flex h-9 items-center gap-2 rounded-md border px-3 transition",
                        active
                          ? "border-foreground bg-foreground text-background"
                          : "hover:border-foreground"
                      )}
                    >
                      {isColour && v.swatch && (
                        <span
                          className="size-3.5 rounded-full border border-black/10"
                          style={{ background: v.swatch }}
                        />
                      )}
                      {v.value}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}

      <div className="space-y-3">
        <p className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">Availability</p>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="size-4 accent-[var(--primary)]"
            checked={params.get("inStockOnly") === "true"}
            onChange={() => flag("inStockOnly")}
          />
          In stock only
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="size-4 accent-[var(--primary)]"
            checked={params.get("onSale") === "true"}
            onChange={() => flag("onSale")}
          />
          On sale
        </label>
      </div>
    </div>
  )
}

export function FilterSidebar(props: {
  filters: Filters
  categories: CategoryNode[]
  showCategories: boolean
}) {
  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <FilterBody {...props} />
    </aside>
  )
}

export function MobileFilterButton(props: {
  filters: Filters
  categories: CategoryNode[]
  showCategories: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const params = useSearchParams().toString()
  const [lastParams, setLastParams] = React.useState(params)
  if (params !== lastParams) {
    setLastParams(params)
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 border border-stone px-3 text-sm lg:hidden"
      >
        <SlidersHorizontal className="size-4" /> Filter
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[85vw] max-w-sm overflow-y-auto border-stone bg-background p-0">
          <SheetHeader className="border-b px-5 py-4">
            <SheetTitle className="font-heading text-2xl font-normal">Filter</SheetTitle>
            <SheetDescription className="sr-only">Filter products</SheetDescription>
          </SheetHeader>
          <div className="p-5">
            <FilterBody {...props} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

export function ActiveFilters() {
  const { params, update } = useParamsEditor()
  const chips: { key: string; value: string; label: string }[] = []
  for (const key of ["size", "colour"]) {
    for (const value of params.getAll(key)) chips.push({ key, value, label: value })
  }
  if (params.get("search")) {
    chips.push({ key: "search", value: params.get("search")!, label: `“${params.get("search")}”` })
  }
  if (params.get("onSale") === "true") chips.push({ key: "onSale", value: "true", label: "On sale" })
  if (params.get("inStockOnly") === "true") chips.push({ key: "inStockOnly", value: "true", label: "In stock" })

  if (!chips.length) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={`${chip.key}-${chip.value}`}
          type="button"
          onClick={() =>
            update((p) => {
              const rest = p.getAll(chip.key).filter((v) => v !== chip.value)
              p.delete(chip.key)
              rest.forEach((v) => p.append(chip.key, v))
            })
          }
          className="inline-flex items-center gap-1 rounded-full bg-story px-3 py-1 text-xs"
        >
          {chip.label} <X className="size-3" />
        </button>
      ))}
      <button
        type="button"
        onClick={() =>
          update((p) => {
            for (const key of ["size", "colour", "search", "onSale", "inStockOnly"]) p.delete(key)
          })
        }
        className="text-xs text-muted-foreground underline"
      >
        Clear all
      </button>
    </div>
  )
}
