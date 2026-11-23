"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import { Search } from "lucide-react"
import { Empty, ErrorState, Loading, PageHeader, Pager, StatusBadge, inputCls, useAdminQuery } from "@/components/admin/ui"
import type { AdminOrderRow, Paged } from "@/lib/admin-types"
import { formatDate } from "@/lib/format"
import { money } from "@/lib/currency"
import { cn } from "@/lib/utils"

const FILTERS = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Awaiting payment" },
  { value: "CONFIRMED", label: "To fulfil" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
]

export function OrdersList({ status, search, page }: { status?: string; search?: string; page: number }) {
  const router = useRouter()
  const [query, setQuery] = React.useState(search ?? "")

  const qs = new URLSearchParams({ page: String(page), limit: "25" })
  if (status) qs.set("status", status)
  if (search) qs.set("search", search)
  const { data, error, loading, reload } = useAdminQuery<Paged<AdminOrderRow>>(`/admin/orders?${qs}`)

  const go = (next: { status?: string; search?: string; page?: number }) => {
    const p = new URLSearchParams()
    const s = next.status ?? status
    const q = next.search ?? search
    if (s) p.set("status", s)
    if (q) p.set("search", q)
    if (next.page && next.page > 1) p.set("page", String(next.page))
    router.push(`/admin/orders${p.size ? `?${p}` : ""}`)
  }

  return (
    <>
      <PageHeader title="Orders" />
      <div className="mb-4 space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            go({ search: query.trim(), page: 1 })
          }}
          className="relative"
        >
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Order number, email, name or phone" className={cn(inputCls, "pl-9")} />
        </form>
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => go({ status: f.value, page: 1 })}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs transition",
                (status ?? "") === f.value ? "border-foreground bg-foreground text-background" : "bg-background hover:border-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <Loading />
      ) : error || !data ? (
        <ErrorState message={error ?? "Could not load"} onRetry={reload} />
      ) : data.items.length === 0 ? (
        <Empty>No orders found.</Empty>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border bg-background">
            <table className="w-full text-sm">
              <thead className="hidden border-b bg-muted/50 text-left text-xs text-muted-foreground md:table-header-group">
                <tr>
                  <th className="px-4 py-2 font-medium">Order</th>
                  <th className="px-4 py-2 font-medium">Customer</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.items.map((o) => (
                  <tr key={o.id} className="cursor-pointer hover:bg-accent" onClick={() => router.push(`/admin/orders/${o.orderNumber}`)}>
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${o.orderNumber}`} className="font-medium" onClick={(e) => e.stopPropagation()}>
                        {o.orderNumber}
                      </Link>
                      <p className="text-xs text-muted-foreground">{formatDate(o.placedAt, true)}</p>
                      <p className="mt-1 text-xs text-muted-foreground md:hidden">{o.customerName ?? o.email}</p>
                      <div className="mt-1 flex gap-1 md:hidden">
                        <StatusBadge status={o.status} />
                        <StatusBadge status={o.paymentStatus} />
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <p>{o.customerName ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{o.city || o.email}</p>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        <StatusBadge status={o.status} />
                        <StatusBadge status={o.paymentStatus} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {money(o.totalKobo, o.currency)}
                      <p className="text-xs text-muted-foreground">{o.itemCount} {o.itemCount === 1 ? "item" : "items"}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={data.pagination.page} totalPages={data.pagination.totalPages} onPage={(p) => go({ page: p })} />
        </>
      )}
    </>
  )
}
