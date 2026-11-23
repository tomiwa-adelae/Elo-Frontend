"use client"

import { useRouter } from "next/navigation"
import * as React from "react"
import { GuestOrder } from "@/components/store/guest-order"

export function OrderLookup({ order, email }: { order?: string; email?: string }) {
  const router = useRouter()
  const [number, setNumber] = React.useState(order ?? "")
  const [mail, setMail] = React.useState(email ?? "")

  if (order && email) {
    return <GuestOrder orderNumber={order} email={email} />
  }

  return (
    <form
      className="mx-auto max-w-md space-y-4 py-10"
      onSubmit={(e) => {
        e.preventDefault()
        router.push(`/orders/lookup?order=${encodeURIComponent(number.trim().toUpperCase())}&email=${encodeURIComponent(mail.trim())}`)
      }}
    >
      <h1 className="text-3xl font-semibold">Track your order</h1>
      <p className="text-sm text-muted-foreground">
        Enter the order number from your confirmation email and the email you ordered with.
      </p>
      <input required placeholder="Order number" value={number} onChange={(e) => setNumber(e.target.value)} className="h-11 w-full rounded-md border bg-background px-3 text-sm uppercase outline-none focus:border-foreground" />
      <input required type="email" placeholder="Email" value={mail} onChange={(e) => setMail(e.target.value)} className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none focus:border-foreground" />
      <button className="h-11 w-full rounded-md bg-primary text-sm font-medium text-primary-foreground">Find order</button>
    </form>
  )
}
