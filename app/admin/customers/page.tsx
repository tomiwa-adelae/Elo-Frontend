"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { Empty, ErrorState, Loading, PageHeader, Pager, inputCls, useAdminQuery } from "@/components/admin/ui"
import type { AdminCustomer, Paged } from "@/lib/admin-types"
import { formatDate, naira } from "@/lib/format"
import { cn } from "@/lib/utils"

export default function CustomersPage() {
  const [search, setSearch] = React.useState("")
  const [query, setQuery] = React.useState("")
  const [page, setPage] = React.useState(1)
  const qs = new URLSearchParams({ page: String(page), limit: "25" })
  if (search) qs.set("search", search)
  const { data, error, loading, reload } = useAdminQuery<Paged<AdminCustomer>>(`/admin/customers?${qs}`)

  return (
    <>
      <PageHeader title="Customers" description="People with accounts. Guest buyers appear on their orders." />
      <form
        className="relative mb-4"
        onSubmit={(e) => {
          e.preventDefault()
          setPage(1)
          setSearch(query.trim())
        }}
      >
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, email or phone" className={cn(inputCls, "pl-9")} />
      </form>
      {loading && !data ? (
        <Loading />
      ) : error || !data ? (
        <ErrorState message={error ?? "Could not load"} onRetry={reload} />
      ) : data.items.length === 0 ? (
        <Empty>No customers yet.</Empty>
      ) : (
        <>
          <div className="divide-y overflow-hidden rounded-lg border bg-background">
            {data.items.map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-4 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{[c.firstName, c.lastName].filter(Boolean).join(" ") || "—"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    <a href={`mailto:${c.email}`} className="hover:underline">{c.email}</a>
                    {c.phoneNumber && ` · ${c.phoneNumber}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Joined {formatDate(c.createdAt)}
                    {c.acceptsMarketing && " · subscribed to emails"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="tabular-nums">{naira(c.totalSpentKobo)}</p>
                  <p className="text-xs text-muted-foreground">{c.paidOrders} {c.paidOrders === 1 ? "order" : "orders"}</p>
                </div>
              </div>
            ))}
          </div>
          <Pager page={data.pagination.page} totalPages={data.pagination.totalPages} onPage={setPage} />
        </>
      )}
    </>
  )
}
