"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import { Plus, Search } from "lucide-react"
import { Empty, ErrorState, Loading, PageHeader, Pager, StatusBadge, btnPrimary, inputCls, useAdminQuery } from "@/components/admin/ui"
import type { AdminProductRow, Paged } from "@/lib/admin-types"
import { priceRange } from "@/lib/format"
import { cn } from "@/lib/utils"

export function ProductsList({ search, status, lowStock, page }: { search?: string; status?: string; lowStock?: boolean; page: number }) {
  const router = useRouter()
  const [query, setQuery] = React.useState(search ?? "")
  const qs = new URLSearchParams({ page: String(page), limit: "25" })
  if (search) qs.set("search", search)
  if (status) qs.set("status", status)
  if (lowStock) qs.set("lowStock", "true")
  const { data, error, loading, reload } = useAdminQuery<Paged<AdminProductRow>>(`/admin/products?${qs}`)

  const go = (next: { search?: string; status?: string; lowStock?: boolean; page?: number }) => {
    const p = new URLSearchParams()
    const s = next.search ?? search
    const st = next.status ?? status
    const low = next.lowStock ?? lowStock
    if (s) p.set("search", s)
    if (st) p.set("status", st)
    if (low) p.set("lowStock", "true")
    if (next.page && next.page > 1) p.set("page", String(next.page))
    router.push(`/admin/products${p.size ? `?${p}` : ""}`)
  }

  const chips = [
    { label: "All", active: !status && !lowStock, onClick: () => go({ status: "", lowStock: false, page: 1 }) },
    { label: "Live", active: status === "ACTIVE", onClick: () => go({ status: "ACTIVE", lowStock: false, page: 1 }) },
    { label: "Drafts", active: status === "DRAFT", onClick: () => go({ status: "DRAFT", lowStock: false, page: 1 }) },
    { label: "Archived", active: status === "ARCHIVED", onClick: () => go({ status: "ARCHIVED", lowStock: false, page: 1 }) },
    { label: "Low stock", active: !!lowStock, onClick: () => go({ status: "", lowStock: true, page: 1 }) },
  ]

  return (
    <>
      <PageHeader
        title="Products"
        actions={
          <Link href="/admin/products/new" className={btnPrimary}>
            <Plus className="size-4" /> Add product
          </Link>
        }
      />
      <div className="mb-4 space-y-3">
        <form onSubmit={(e) => { e.preventDefault(); go({ search: query.trim(), page: 1 }) }} className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products" className={cn(inputCls, "pl-9")} />
        </form>
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {chips.map((c) => (
            <button key={c.label} onClick={c.onClick} className={cn("shrink-0 rounded-full border px-3 py-1.5 text-xs", c.active ? "border-foreground bg-foreground text-background" : "bg-background hover:border-foreground")}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <Loading />
      ) : error || !data ? (
        <ErrorState message={error ?? "Could not load"} onRetry={reload} />
      ) : data.items.length === 0 ? (
        <Empty>
          No products here. <Link href="/admin/products/new" className="underline">Add your first product</Link>
        </Empty>
      ) : (
        <>
          <div className="divide-y overflow-hidden rounded-lg border bg-background">
            {data.items.map((p) => (
              <Link key={p.id} href={`/admin/products/${p.id}`} className="flex items-center gap-3 p-3 hover:bg-accent">
                <div className="size-14 shrink-0 overflow-hidden rounded-md bg-muted">
                  {p.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image} alt="" className="size-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.category?.name ?? "No category"} · {p.variantCount} {p.variantCount === 1 ? "variant" : "variants"}
                  </p>
                  <div className="mt-1 flex items-center gap-2 sm:hidden">
                    <StatusBadge status={p.status} label={p.status === "ACTIVE" ? "Live" : undefined} />
                  </div>
                </div>
                <div className="hidden w-24 sm:block">
                  <StatusBadge status={p.status} label={p.status === "ACTIVE" ? "Live" : undefined} />
                </div>
                <div className="text-right text-sm">
                  <p className="tabular-nums">{priceRange(p.minPriceKobo, p.maxPriceKobo)}</p>
                  <p className={cn("text-xs", p.totalStock === 0 ? "text-destructive" : p.lowStockVariants ? "text-amber-700" : "text-muted-foreground")}>
                    {p.totalStock} in stock{p.lowStockVariants ? ` · ${p.lowStockVariants} low` : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          <Pager page={data.pagination.page} totalPages={data.pagination.totalPages} onPage={(n) => go({ page: n })} />
        </>
      )}
    </>
  )
}
