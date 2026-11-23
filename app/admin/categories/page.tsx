"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { CrudDialog } from "@/components/admin/crud-dialog"
import { useTwoStep } from "@/components/admin/use-two-step"
import { SingleImageField } from "@/components/admin/image-upload"
import { Empty, ErrorState, FormField, Loading, PageHeader, Panel, Toggle, btnOutline, inputCls, runAction, useAdminQuery } from "@/components/admin/ui"
import { api } from "@/lib/api"
import type { AdminCategory, AdminCollection } from "@/lib/admin-types"

type CategoryForm = { id?: string; name: string; parentId: string | null; image: string | null; position: number }
type CollectionForm = { id?: string; name: string; description: string | null; image: string | null; isActive: boolean; position: number }

export default function CategoriesPage() {
  const categories = useAdminQuery<AdminCategory[]>("/admin/categories")
  const collections = useAdminQuery<AdminCollection[]>("/admin/collections")
  const [category, setCategory] = React.useState<CategoryForm | null>(null)
  const [collection, setCollection] = React.useState<CollectionForm | null>(null)
  const [busy, setBusy] = React.useState(false)
  const confirm = useTwoStep()

  if ((categories.loading && !categories.data) || (collections.loading && !collections.data)) return <Loading />
  if (categories.error) return <ErrorState message={categories.error} onRetry={categories.reload} />

  const roots = (categories.data ?? []).filter((c) => !c.parentId)
  const childrenOf = (id: string) => (categories.data ?? []).filter((c) => c.parentId === id)

  const saveCategory = async () => {
    if (!category) return
    setBusy(true)
    const body = { name: category.name, parentId: category.parentId || undefined, image: category.image, position: category.position }
    const ok = await runAction(
      () => (category.id ? api.patch(`/admin/categories/${category.id}`, body) : api.post("/admin/categories", body)),
      "Category saved"
    )
    setBusy(false)
    if (ok) {
      setCategory(null)
      void categories.reload()
    }
  }

  const saveCollection = async () => {
    if (!collection) return
    setBusy(true)
    const body = { name: collection.name, description: collection.description, image: collection.image, isActive: collection.isActive, position: collection.position }
    const ok = await runAction(
      () => (collection.id ? api.patch(`/admin/collections/${collection.id}`, body) : api.post("/admin/collections", body)),
      "Collection saved"
    )
    setBusy(false)
    if (ok) {
      setCollection(null)
      void collections.reload()
    }
  }

  const del = async (path: string, done: () => void) => {
    if (!confirm()) return
    setBusy(true)
    const ok = await runAction(() => api.delete(path), "Deleted")
    setBusy(false)
    if (ok) done()
  }

  return (
    <>
      <PageHeader title="Categories & collections" description="Categories are the shop's menu (Dresses, Tops). Collections are curated edits (New in, Owambe season)." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Categories"
          actions={
            <button className={`${btnOutline} h-8 px-3`} onClick={() => setCategory({ name: "", parentId: null, image: null, position: 0 })}>
              <Plus className="size-4" /> Add
            </button>
          }
        >
          {roots.length === 0 ? (
            <Empty>No categories yet.</Empty>
          ) : (
            <ul className="-my-1 divide-y">
              {roots.map((c) => (
                <li key={c.id} className="py-1">
                  <CategoryRow c={c} onEdit={() => setCategory({ ...c })} />
                  {childrenOf(c.id).map((child) => (
                    <div key={child.id} className="pl-5">
                      <CategoryRow c={child} onEdit={() => setCategory({ ...child })} />
                    </div>
                  ))}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Collections"
          actions={
            <button className={`${btnOutline} h-8 px-3`} onClick={() => setCollection({ name: "", description: null, image: null, isActive: true, position: 0 })}>
              <Plus className="size-4" /> Add
            </button>
          }
        >
          {(collections.data ?? []).length === 0 ? (
            <Empty>No collections yet.</Empty>
          ) : (
            <ul className="-my-1 divide-y">
              {(collections.data ?? []).map((c) => (
                <li key={c.id}>
                  <button onClick={() => setCollection({ ...c })} className="flex w-full items-center gap-3 py-2 text-left text-sm hover:opacity-80">
                    <span className="size-10 shrink-0 overflow-hidden rounded bg-muted">
                      {c.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.image} alt="" className="size-full object-cover" />
                      )}
                    </span>
                    <span className="flex-1">
                      {c.name}
                      {!c.isActive && <span className="ml-2 text-xs text-muted-foreground">(hidden)</span>}
                    </span>
                    <span className="text-xs text-muted-foreground">{c.productCount} products</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {category && (
        <CrudDialog
          title={category.id ? "Edit category" : "New category"}
          busy={busy}
          onClose={() => setCategory(null)}
          onSubmit={saveCategory}
          onDelete={category.id ? () => del(`/admin/categories/${category.id}`, () => { setCategory(null); void categories.reload() }) : undefined}
        >
          <FormField label="Name">
            <input required value={category.name} onChange={(e) => setCategory({ ...category, name: e.target.value })} className={inputCls} />
          </FormField>
          <FormField label="Inside (optional)">
            <select value={category.parentId ?? ""} onChange={(e) => setCategory({ ...category, parentId: e.target.value || null })} className={inputCls}>
              <option value="">Top level</option>
              {roots.filter((r) => r.id !== category.id).map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Order" hint="Lower numbers show first.">
            <input type="number" min={0} value={category.position} onChange={(e) => setCategory({ ...category, position: Number(e.target.value) })} className={inputCls} />
          </FormField>
          <FormField label="Image (optional)">
            <SingleImageField folder="categories" value={category.image} onChange={(image) => setCategory({ ...category, image })} aspect="aspect-square" />
          </FormField>
        </CrudDialog>
      )}

      {collection && (
        <CrudDialog
          title={collection.id ? "Edit collection" : "New collection"}
          busy={busy}
          onClose={() => setCollection(null)}
          onSubmit={saveCollection}
          onDelete={collection.id ? () => del(`/admin/collections/${collection.id}`, () => { setCollection(null); void collections.reload() }) : undefined}
        >
          <FormField label="Name">
            <input required value={collection.name} onChange={(e) => setCollection({ ...collection, name: e.target.value })} className={inputCls} />
          </FormField>
          <FormField label="Description (optional)">
            <textarea value={collection.description ?? ""} onChange={(e) => setCollection({ ...collection, description: e.target.value })} rows={3} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-foreground" />
          </FormField>
          <FormField label="Cover image (optional)">
            <SingleImageField folder="collections" value={collection.image} onChange={(image) => setCollection({ ...collection, image })} />
          </FormField>
          <FormField label="Order" hint="Lower numbers show first on the home page.">
            <input type="number" min={0} value={collection.position} onChange={(e) => setCollection({ ...collection, position: Number(e.target.value) })} className={inputCls} />
          </FormField>
          <Toggle checked={collection.isActive} onChange={(isActive) => setCollection({ ...collection, isActive })} label="Show in store" />
        </CrudDialog>
      )}
    </>
  )
}

function CategoryRow({ c, onEdit }: { c: AdminCategory; onEdit: () => void }) {
  return (
    <button onClick={onEdit} className="flex w-full items-center justify-between py-2 text-left text-sm hover:opacity-80">
      <span>{c.name}</span>
      <span className="text-xs text-muted-foreground">{c.productCount} products</span>
    </button>
  )
}
