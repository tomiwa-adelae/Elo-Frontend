"use client"

import { useCurrency } from "@/components/providers/currency-provider"
import { money, type Currency } from "@/lib/currency"
import { cn } from "@/lib/utils"

/**
 * A catalogue price shown in the shopper's currency. Pass both the naira
 * (kobo) and dollar (cents) amounts; the switcher picks.
 */
export function Price({
  kobo,
  usdCents,
  compareAtKobo,
  compareAtUsdCents,
  from,
  className,
}: {
  kobo: number
  usdCents: number
  compareAtKobo?: number | null
  compareAtUsdCents?: number | null
  /** Prefix "From" when a product's variants differ in price. */
  from?: boolean
  className?: string
}) {
  const { currency } = useCurrency()
  const usd = currency === "USD"
  const price = usd ? usdCents : kobo
  const compareAt = usd ? compareAtUsdCents : compareAtKobo
  const onSale = !!compareAt && compareAt > price

  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2", className)}>
      <span className={cn(onSale && "text-brand")}>
        {from && <span className="text-muted-foreground">From </span>}
        {money(price, currency)}
      </span>
      {onSale && (
        <span className="text-[0.85em] text-muted-foreground line-through">
          {money(compareAt, currency)}
        </span>
      )}
    </span>
  )
}

/** An amount already in a known currency (cart lines, order totals). */
export function Money({
  minor,
  currency,
  className,
}: {
  minor: number
  currency: Currency
  className?: string
}) {
  return <span className={className}>{money(minor, currency)}</span>
}

/** ₦ / $ toggle, as in the concept. Hidden when dollar checkout is off. */
export function CurrencySwitch({ className }: { className?: string }) {
  const { currency, enabled, setCurrency } = useCurrency()
  if (!enabled) return null
  return (
    <div
      role="group"
      aria-label="Currency"
      className={cn("flex rounded-full border border-stone p-[3px]", className)}
    >
      {(["NGN", "USD"] as const).map((c) => (
        <button
          key={c}
          type="button"
          aria-pressed={currency === c}
          onClick={() => currency !== c && setCurrency(c)}
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] tracking-[0.12em] transition",
            currency === c
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {c === "NGN" ? "₦ NGN" : "$ USD"}
        </button>
      ))}
    </div>
  )
}
