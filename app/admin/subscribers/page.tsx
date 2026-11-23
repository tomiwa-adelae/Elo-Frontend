"use client"

import * as React from "react"
import { Copy, Search } from "lucide-react"
import { toast } from "sonner"
import { Empty, ErrorState, Loading, PageHeader, Pager, btnOutline, inputCls, useAdminQuery } from "@/components/admin/ui"
import { api, errorMessage } from "@/lib/api"
import type { Paged, Subscriber } from "@/lib/admin-types"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

export default function SubscribersPage() {
  const [search, setSearch] = React.useState("")
  const [query, setQuery] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [copying, setCopying] = React.useState(false)
  const qs = new URLSearchParams({ page: String(page), limit: "50" })
  if (search) qs.set("search", search)
  const { data, error, loading, reload } = useAdminQuery<Paged<Subscriber>>(`/newsletter/subscribers?${qs}`)

  // Gathers every page so the list can be pasted into Mailjet or a spreadsheet.
  const copyAll = async () => {
    setCopying(true)
    try {
      const emails: string[] = []
      for (let p = 1; ; p++) {
        const res = await api.get<Paged<Subscriber>>(`/newsletter/subscribers?page=${p}&limit=100`)
        emails.push(...res.items.map((s) => s.email))
        if (!res.pagination.hasNext) break
      }
      await navigator.clipboard.writeText(emails.join("\n"))
      toast.success(`Copied ${emails.length} ${emails.length === 1 ? "email" : "emails"}`)
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setCopying(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Subscribers"
        description="People who joined the Softies list from the store. They get a welcome email when they sign up."
        actions={
          <button className={btnOutline} disabled={copying || !data?.pagination.total} onClick={copyAll}>
            <Copy className="size-4" /> {copying ? "Copying…" : "Copy all emails"}
          </button>
        }
      />
      <form
        className="relative mb-4"
        onSubmit={(e) => {
          e.preventDefault()
          setPage(1)
          setSearch(query.trim())
        }}
      >
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by email" className={cn(inputCls, "pl-9")} />
      </form>
      {loading && !data ? (
        <Loading />
      ) : error || !data ? (
        <ErrorState message={error ?? "Could not load"} onRetry={reload} />
      ) : data.items.length === 0 ? (
        <Empty>{search ? "No subscribers match that search." : "No subscribers yet. The sign-up form is on the home page and in the footer."}</Empty>
      ) : (
        <>
          <p className="mb-2 text-xs text-muted-foreground">{data.pagination.total.toLocaleString()} subscribed</p>
          <div className="divide-y overflow-hidden rounded-lg border bg-background">
            {data.items.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-4 text-sm">
                <a href={`mailto:${s.email}`} className="min-w-0 flex-1 truncate hover:underline">{s.email}</a>
                <span className="hidden text-xs text-muted-foreground capitalize sm:inline">{s.source ?? "store"}</span>
                <span className="text-xs text-muted-foreground">{formatDate(s.createdAt)}</span>
              </div>
            ))}
          </div>
          <Pager page={data.pagination.page} totalPages={data.pagination.totalPages} onPage={setPage} />
        </>
      )}
    </>
  )
}
