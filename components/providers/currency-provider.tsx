"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { CURRENCY_COOKIE, type Currency } from "@/lib/currency"

interface CurrencyContextValue {
  currency: Currency
  /** False when the store has dollar checkout switched off. */
  enabled: boolean
  setCurrency: (currency: Currency) => void
}

const CurrencyContext = React.createContext<CurrencyContextValue | null>(null)

/**
 * The shopper's currency lives in a cookie so the server renders the right
 * prices on the first paint and the API prices the bag to match.
 */
export function CurrencyProvider({
  initial,
  enabled,
  children,
}: {
  initial: Currency
  enabled: boolean
  children: React.ReactNode
}) {
  const router = useRouter()
  const [currency, setState] = React.useState<Currency>(
    enabled ? initial : "NGN"
  )

  const setCurrency = React.useCallback(
    (next: Currency) => {
      setState(next)
      document.cookie = `${CURRENCY_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
      // Re-price the bag and any server-rendered prices.
      window.dispatchEvent(new Event("cart:refresh"))
      router.refresh()
    },
    [router]
  )

  const value = React.useMemo(
    () => ({ currency, enabled, setCurrency }),
    [currency, enabled, setCurrency]
  )

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = React.useContext(CurrencyContext)
  if (!context) throw new Error("useCurrency must be used inside CurrencyProvider")
  return context
}
