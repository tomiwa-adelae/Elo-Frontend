"use client"

import * as React from "react"
import { api } from "@/lib/api"
import { money, type Currency } from "@/lib/currency"
import { cn } from "@/lib/utils"

type Estimate = {
  currency: Currency
  zoneName: string
  feeKobo: number
  freeAboveKobo: number | null
} | null

/**
 * Where the shopper's bag is going: their last checkout address if they've
 * given one, else the country we detected, else Lagos.
 */
function destination() {
  try {
    const saved = localStorage.getItem("checkout:address")
    const a = saved
      ? (
          JSON.parse(saved) as {
            address?: { countryCode?: string; state?: string; city?: string }
          }
        ).address
      : null
    if (a?.countryCode && (a.countryCode !== "NG" || a.state)) {
      return {
        countryCode: a.countryCode,
        state: a.state ?? "",
        city: a.city ?? "",
      }
    }
  } catch {
    // storage unavailable
  }
  const geo = document.cookie.match(/(?:^|;\s*)geo_country=([A-Z]{2})/)?.[1]
  if (geo && geo !== "NG") return { countryCode: geo, state: "", city: "" }
  return { countryCode: "NG", state: "Lagos", city: "" }
}

const cache = new Map<string, Promise<Estimate>>()

function fetchEstimate(currency: Currency) {
  const d = destination()
  const qs = new URLSearchParams({ ...d, currency })
  const key = qs.toString()
  if (!cache.has(key)) {
    cache.set(
      key,
      api.get<Estimate>(`/delivery/estimate?${key}`).catch(() => {
        cache.delete(key)
        return null
      })
    )
  }
  return cache.get(key)!
}

/** "You're ₦X away from free delivery to Lagos", with a slim progress bar. */
export function FreeDeliveryProgress({
  subtotal,
  currency,
  freeDelivery,
  className,
}: {
  /** Bag total after discounts, in the bag's currency. */
  subtotal: number
  currency: Currency
  /** A discount code already makes delivery free. */
  freeDelivery?: boolean
  className?: string
}) {
  const [estimate, setEstimate] = React.useState<Estimate>(null)

  React.useEffect(() => {
    let live = true
    void fetchEstimate(currency).then((e) => {
      if (live) setEstimate(e?.currency === currency ? e : null)
    })
    return () => {
      live = false
    }
  }, [currency])

  if (freeDelivery) {
    return (
      <p className={cn("text-sm", className)}>
        Your delivery is free with your code.
      </p>
    )
  }
  if (!estimate) return null
  const { freeAboveKobo: threshold, feeKobo, zoneName } = estimate
  if (!threshold) {
    return feeKobo ? (
      <p className={cn("text-xs text-muted-foreground", className)}>
        Delivery to {zoneName}: {money(feeKobo, currency)}
      </p>
    ) : null
  }

  const remaining = Math.max(0, threshold - subtotal)
  const pct = Math.min(100, Math.round((subtotal / threshold) * 100))

  return (
    <div className={cn("space-y-2", className)} aria-live="polite">
      <p className="text-sm">
        {remaining > 0 ? (
          <>
            You&apos;re{" "}
            <strong className="font-medium">
              {money(remaining, currency)}
            </strong>{" "}
            away from free delivery to {zoneName}.
          </>
        ) : (
          <>You&apos;ve unlocked free delivery to {zoneName}.</>
        )}
      </p>
      <div className="h-1 overflow-hidden rounded-full bg-stone">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500",
            remaining > 0 ? "bg-lilac-deep" : "bg-lime"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
