"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { OrderView } from "@/components/store/order-view"
import { api, errorMessage } from "@/lib/api"
import type { Order } from "@/lib/types"

/** Loads an order by number + email (works for guests and members). */
export function GuestOrder({
  orderNumber,
  email,
  banner,
}: {
  orderNumber: string
  email: string
  banner?: React.ReactNode
}) {
  const [order, setOrder] = React.useState<Order | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    api
      .get<Order>(`/orders/lookup/${encodeURIComponent(orderNumber)}?email=${encodeURIComponent(email)}`)
      .then((o) => !cancelled && setOrder(o))
      .catch((e) => !cancelled && setError(errorMessage(e)))
    return () => {
      cancelled = true
    }
  }, [orderNumber, email])

  if (error) return <p className="py-20 text-center text-muted-foreground">{error}</p>
  if (!order) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  return (
    <>
      {banner}
      <OrderView order={order} />
    </>
  )
}
