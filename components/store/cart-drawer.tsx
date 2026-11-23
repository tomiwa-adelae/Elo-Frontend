"use client"

import Link from "next/link"
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react"
import { useCart } from "@/components/providers/cart-provider"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { variantLabel } from "@/lib/format"
import { money } from "@/lib/currency"
import { FreeDeliveryProgress } from "@/components/store/free-delivery-progress"
import type { CartItem } from "@/lib/types"
import { StoreImage } from "@/components/store/store-image"

export function QuantityStepper({
  value,
  max,
  onChange,
  disabled,
}: {
  value: number
  max?: number
  onChange: (next: number) => void
  disabled?: boolean
}) {
  return (
    <div className="inline-flex h-11 items-center border border-stone">
      <button
        type="button"
        aria-label="Decrease quantity"
        className="flex h-full w-9 items-center justify-center disabled:opacity-40"
        disabled={disabled || value <= 1}
        onClick={() => onChange(value - 1)}
      >
        <Minus className="size-3.5" />
      </button>
      <span className="w-8 text-center text-sm tabular-nums">{value}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        className="flex h-full w-9 items-center justify-center disabled:opacity-40"
        disabled={
          disabled || (max !== undefined && value >= max) || value >= 20
        }
        onClick={() => onChange(value + 1)}
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  )
}

export function CartLine({
  item,
  compact,
}: {
  item: CartItem
  compact?: boolean
}) {
  const { cart, updateItem, removeItem } = useCart()
  const label = variantLabel(item.options)
  const currency = cart?.currency ?? "NGN"
  const pending = item.id.startsWith("pending-")

  return (
    <div className="flex gap-3">
      <Link
        href={`/products/${item.product.slug}`}
        className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden bg-stone"
      >
        {item.product.image && (
          <StoreImage
            src={item.product.image}
            alt=""
            className="object-cover"
            sizes="80px"
          />
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex justify-between gap-2">
          <Link
            href={`/products/${item.product.slug}`}
            className="font-heading text-lg leading-snug font-medium"
          >
            {item.product.title}
          </Link>
          <span className="text-sm whitespace-nowrap">
            {money(item.totalKobo, currency)}
          </span>
        </div>
        {label && <p className="text-xs text-muted-foreground">{label}</p>}
        {!item.inStock ? (
          <p className="text-xs text-destructive">
            Sold out. Remove to continue.
          </p>
        ) : item.quantityAdjusted ? (
          <p className="text-xs text-destructive">
            Only {item.purchasableQuantity} left. Quantity reduced.
          </p>
        ) : null}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <QuantityStepper
            value={item.quantity}
            max={Math.max(item.available, 1)}
            onChange={(q) => updateItem(item.id, q)}
            disabled={pending}
          />
          <button
            type="button"
            onClick={() => removeItem(item.id)}
            disabled={pending}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="size-3.5" />
            {!compact && "Remove"}
          </button>
        </div>
      </div>
    </div>
  )
}

export function CartDrawer() {
  const { cart, open, setOpen } = useCart()
  const items = cart?.items ?? []

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="flex w-full flex-col gap-0 border-stone bg-background p-0 sm:max-w-md">
        <SheetHeader className="border-b border-stone px-6 py-5">
          <SheetTitle className="font-heading text-3xl font-normal">
            Your bag{" "}
            {cart?.itemCount ? (
              <span className="font-sans text-sm text-muted-foreground">
                ({cart.itemCount})
              </span>
            ) : null}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Items in your shopping bag
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <ShoppingBag className="size-9 stroke-1 text-muted-foreground" />
            <p className="font-heading text-2xl italic">Your bag is waiting.</p>
            <Link
              href="/shop"
              className="btn-elo btn-solid"
              onClick={() => setOpen(false)}
            >
              Shop the Softies
            </Link>
          </div>
        ) : (
          <>
            <FreeDeliveryProgress
              className="border-b border-stone bg-paper px-6 py-4"
              subtotal={cart!.totals.totalKobo}
              currency={cart!.currency}
              freeDelivery={cart!.discount?.freeDelivery}
            />
            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
              {items.map((item) => (
                <CartLine key={item.id} item={item} />
              ))}
            </div>
            <div className="space-y-3 border-t border-stone px-6 py-6">
              {cart!.totals.discountKobo > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Discount ({cart!.discount?.code})</span>
                  <span>
                    −{money(cart!.totals.discountKobo, cart!.currency)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-base">
                <span className="text-[12px] tracking-[0.2em] uppercase">
                  Subtotal
                </span>
                <span>{money(cart!.totals.totalKobo, cart!.currency)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Complimentary gift wrapping. Delivery is calculated at checkout.
              </p>
              {cart!.hasUnavailableItems ? (
                <span className="btn-elo w-full btn-solid opacity-50">
                  Review your bag
                </span>
              ) : (
                <Link
                  href="/checkout"
                  className="btn-elo w-full btn-solid"
                  onClick={() => setOpen(false)}
                >
                  Checkout →
                </Link>
              )}
              <Link
                href="/cart"
                className="btn-elo w-full btn-ghost"
                onClick={() => setOpen(false)}
              >
                View bag
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
