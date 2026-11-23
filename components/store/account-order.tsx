"use client"

import Link from "next/link"
import * as React from "react"
import { Loader2 } from "lucide-react"
import { useRequireUser } from "@/components/store/account-view"
import { OrderView } from "@/components/store/order-view"
import { api, errorMessage } from "@/lib/api"
import type { Order } from "@/lib/types"

export function AccountOrder({ orderNumber }: { orderNumber: string }) {
  const { user } = useRequireUser()
  const [order, setOrder] = React.useState<Order | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!user) return
    api
      .get<Order>(`/orders/${encodeURIComponent(orderNumber)}`)
      .then(setOrder)
      .catch((e) => setError(errorMessage(e)))
  }, [user, orderNumber])

  return (
    <div className="container-page max-w-5xl py-10">
      <Link href="/account" className="mb-6 inline-block text-sm text-muted-foreground underline">
        ← All orders
      </Link>
      {error ? (
        <p className="py-20 text-center text-muted-foreground">{error}</p>
      ) : order ? (
        <OrderView order={order} />
      ) : (
        <div className="flex justify-center py-24">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  )
}
