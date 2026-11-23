"use client"

import Link from "next/link"
import { Loader2 } from "lucide-react"
import { useCart } from "@/components/providers/cart-provider"
import { CartLine } from "@/components/store/cart-drawer"
import { DiscountForm } from "@/components/store/discount-form"
import { money } from "@/lib/currency"
import { FreeDeliveryProgress } from "@/components/store/free-delivery-progress"

export default function CartPage() {
  const { cart, loading } = useCart()

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!cart?.items.length) {
    return (
      <div className="container-page py-24 text-center">
        <span className="eyebrow">Your bag</span>
        <h1 className="mt-3 text-5xl">Waiting to be filled.</h1>
        <p className="mt-3 text-muted-foreground">Slip into something soft.</p>
        <Link href="/shop" className="btn-elo mt-9 btn-solid">
          Shop the Softies →
        </Link>
      </div>
    )
  }

  return (
    <div className="container-page py-10">
      <h1 className="mb-10 text-5xl">Your bag</h1>
      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {cart.items.map((item) => (
            <div
              key={item.id}
              className="border-b border-stone pb-6 last:border-0"
            >
              <CartLine item={item} />
            </div>
          ))}
        </div>
        <aside className="h-fit space-y-4 bg-paper p-6">
          <FreeDeliveryProgress
            className="border-b border-stone pb-4"
            subtotal={cart.totals.totalKobo}
            currency={cart.currency}
            freeDelivery={cart.discount?.freeDelivery}
          />
          <DiscountForm />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{money(cart.totals.subtotalKobo, cart.currency)}</span>
            </div>
            {cart.totals.discountKobo > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span>−{money(cart.totals.discountKobo, cart.currency)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery</span>
              <span className="text-muted-foreground">
                {cart.discount?.freeDelivery ? "Free" : "At checkout"}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Every order is gift-wrapped in ELO tissue and ribbon.
          </p>
          <div className="flex justify-between border-t border-stone pt-4 text-base">
            <span>Total</span>
            <span>{money(cart.totals.totalKobo, cart.currency)}</span>
          </div>
          {cart.hasUnavailableItems && (
            <p className="text-xs text-destructive">
              Some items have changed. Review your bag before checking out.
            </p>
          )}
          <Link
            href="/checkout"
            aria-disabled={cart.hasUnavailableItems}
            className="btn-elo w-full btn-solid aria-disabled:pointer-events-none aria-disabled:opacity-50"
          >
            Checkout →
          </Link>
        </aside>
      </div>
    </div>
  )
}
