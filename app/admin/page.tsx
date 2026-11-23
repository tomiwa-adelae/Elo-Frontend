"use client"

import Link from "next/link"
import { AlertTriangle, ArrowRight } from "lucide-react"
import { SalesChart } from "@/components/admin/sales-chart"
import { ErrorState, Loading, PageHeader, Panel, StatusBadge, useAdminQuery } from "@/components/admin/ui"
import type { Dashboard } from "@/lib/admin-types"
import { formatDate, naira } from "@/lib/format"
import { money } from "@/lib/currency"

export default function AdminDashboardPage() {
  const { data, error, loading, reload } = useAdminQuery<Dashboard>("/admin/dashboard")

  if (loading && !data) return <Loading />
  if (error || !data) return <ErrorState message={error ?? "Could not load"} onRetry={reload} />

  const stats = [
    { label: "Sales today", value: naira(data.revenue.today.kobo), sub: `${data.revenue.today.orders} orders, all in ₦` },
    { label: "Last 7 days", value: naira(data.revenue.week.kobo), sub: `${data.revenue.week.orders} orders, all in ₦` },
    { label: "Last 30 days", value: naira(data.revenue.month.kobo), sub: `${data.revenue.month.orders} orders, all in ₦` },
    { label: "Customers", value: data.customers.toLocaleString(), sub: "with accounts" },
  ]

  return (
    <>
      <PageHeader title="Dashboard" description="Paid sales, Lagos time." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border bg-background p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums sm:text-2xl">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </div>

      {(data.toFulfil > 0 || data.awaitingPayment > 0) && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {data.toFulfil > 0 && (
            <Link href="/admin/orders?status=CONFIRMED" className="flex items-center justify-between rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950">
              <span><strong>{data.toFulfil}</strong> {data.toFulfil === 1 ? "order" : "orders"} to pack and send</span>
              <ArrowRight className="size-4" />
            </Link>
          )}
          {data.awaitingPayment > 0 && (
            <Link href="/admin/orders?status=PENDING" className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <span><strong>{data.awaitingPayment}</strong> awaiting payment</span>
              <ArrowRight className="size-4" />
            </Link>
          )}
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Panel title="Sales, last 14 days">
          <SalesChart data={data.salesChart} />
        </Panel>
        <Panel title="Low stock" actions={<Link href="/admin/products?lowStock=true" className="text-xs underline">All</Link>}>
          {data.lowStock.length === 0 ? (
            <p className="text-sm text-muted-foreground">Everything is well stocked.</p>
          ) : (
            <ul className="space-y-3">
              {data.lowStock.map((v) => (
                <li key={v.variantId}>
                  <Link href={`/admin/products/${v.productId}`} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0">
                      <span className="block truncate">{v.title}</span>
                      <span className="block text-xs text-muted-foreground">{v.variant}</span>
                    </span>
                    <span className={v.stock === 0 ? "flex items-center gap-1 text-destructive" : "text-amber-700"}>
                      {v.stock === 0 && <AlertTriangle className="size-3.5" />}
                      {v.stock} left
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Recent orders" className="mt-4" actions={<Link href="/admin/orders" className="text-xs underline">All orders</Link>}>
        {data.recentOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet. Share your store link to get the first one.</p>
        ) : (
          <div className="-mx-4 divide-y">
            {data.recentOrders.map((o) => (
              <Link key={o.orderNumber} href={`/admin/orders/${o.orderNumber}`} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-accent">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{o.orderNumber}</p>
                  <p className="truncate text-xs text-muted-foreground">{o.customerName ?? o.email} · {formatDate(o.placedAt, true)}</p>
                </div>
                <div className="hidden gap-1 sm:flex">
                  <StatusBadge status={o.status} />
                  <StatusBadge status={o.paymentStatus} />
                </div>
                <span className="tabular-nums">{money(o.totalKobo, o.currency)}</span>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </>
  )
}
