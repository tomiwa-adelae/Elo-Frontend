"use client"

import * as React from "react"
import { Loader2, X } from "lucide-react"
import { useCart } from "@/components/providers/cart-provider"

export function DiscountForm() {
  const { cart, applyDiscount, removeDiscount } = useCart()
  const [code, setCode] = React.useState("")
  const [busy, setBusy] = React.useState(false)

  if (cart?.discount) {
    return (
      <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
        <span>
          Code <strong>{cart.discount.code}</strong>
          {cart.discount.reason && (
            <span className="block text-xs text-destructive">{cart.discount.reason}</span>
          )}
        </span>
        <button type="button" aria-label="Remove code" onClick={() => removeDiscount()}>
          <X className="size-4" />
        </button>
      </div>
    )
  }

  return (
    <form
      className="flex gap-2"
      onSubmit={async (e) => {
        e.preventDefault()
        if (!code.trim()) return
        setBusy(true)
        if (await applyDiscount(code.trim())) setCode("")
        setBusy(false)
      }}
    >
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="Discount code"
        className="h-10 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm uppercase outline-none focus:border-foreground"
      />
      <button
        disabled={busy}
        className="h-10 rounded-md border px-4 text-sm transition hover:border-foreground disabled:opacity-50"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : "Apply"}
      </button>
    </form>
  )
}
