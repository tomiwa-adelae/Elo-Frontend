export type Currency = "NGN" | "USD"

/** Read by the API to price the bag, and by the storefront to show prices. */
export const CURRENCY_COOKIE = "currency"

export function parseCurrency(value: string | null | undefined): Currency {
  return value === "USD" ? "USD" : "NGN"
}

const whole = {
  NGN: new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }),
  USD: new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }),
}

/** Minor units (kobo or cents) → "₦58,000" / "$42" / "$13.60". */
export function money(
  minor: number | null | undefined,
  currency: Currency = "NGN"
): string {
  if (minor === null || minor === undefined) return "—"
  const symbol = currency === "USD" ? "$" : "₦"
  const value = minor / 100
  if (Number.isInteger(value)) return `${symbol}${whole[currency].format(value)}`
  return `${symbol}${value.toLocaleString(currency === "USD" ? "en-US" : "en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/** A catalogue price in both currencies; pick one with `pick`. */
export interface DualPrice {
  ngn: number
  usd: number
}

export function pick(price: DualPrice, currency: Currency) {
  return currency === "USD" ? price.usd : price.ngn
}
