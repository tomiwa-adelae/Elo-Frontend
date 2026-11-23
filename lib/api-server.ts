import "server-only"
import { cookies } from "next/headers"
import type { StoreSettings } from "./types"
import { CURRENCY_COOKIE, parseCurrency, type Currency } from "./currency"

const API_ORIGIN = (process.env.API_URL ?? "http://localhost:8010").replace(
  /\/$/,
  ""
)

export class ServerApiError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message)
  }
}

/**
 * Public, cacheable reads for server components (catalog, settings).
 * Anything personal — cart, account, admin — is fetched from the browser so
 * the user's cookies never pass through the Next server.
 */
export async function serverGet<T>(
  path: string,
  { revalidate = 60 }: { revalidate?: number | false } = {}
): Promise<T> {
  const res = await fetch(`${API_ORIGIN}/api${path}`, {
    next: { revalidate },
  })
  if (!res.ok) {
    throw new ServerApiError(res.status, `GET ${path} failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

/** Like serverGet, but a 404 becomes null instead of an error. */
export async function serverGetOrNull<T>(
  path: string,
  options?: { revalidate?: number | false }
): Promise<T | null> {
  try {
    return await serverGet<T>(path, options)
  } catch (error) {
    if (error instanceof ServerApiError && error.status === 404) return null
    throw error
  }
}

const FALLBACK_SETTINGS: StoreSettings = {
  id: "store",
  name: "ELO",
  tagline: null,
  logoUrl: null,
  faviconUrl: null,
  ogImageUrl: null,
  theme: {
    primary: "#2B2A26",
    primaryForeground: "#F7F4EF",
    background: "#F7F4EF",
    foreground: "#2B2A26",
    muted: "#ECE7DF",
    accent: "#8C8A3A",
    fontHeading: "Cormorant Garamond",
    fontBody: "Outfit",
    radius: "0.75rem",
  },
  announcement: null,
  heroEyebrow: null,
  heroTitle: null,
  heroSubtitle: null,
  heroImageUrl: null,
  heroCtaLabel: null,
  heroCtaHref: null,
  contactEmail: null,
  contactPhone: null,
  whatsappNumber: null,
  address: null,
  instagram: null,
  tiktok: null,
  facebook: null,
  twitter: null,
  enablePayOnDelivery: false,
  enableUsd: true,
  ngnPerUsd: 1400,
  shippingPolicy: null,
  returnsPolicy: null,
  privacyPolicy: null,
  termsOfService: null,
  metaTitle: null,
  metaDescription: null,
}

/** Store settings, cached briefly. Never throws: a down API still renders. */
export async function getStoreSettings(): Promise<StoreSettings> {
  try {
    return await serverGet<StoreSettings>("/store", { revalidate: 30 })
  } catch {
    return FALLBACK_SETTINGS
  }
}

/** The shopper's display currency, from the cookie the switcher sets. */
export async function getCurrency(enableUsd = true): Promise<Currency> {
  if (!enableUsd) return "NGN"
  const jar = await cookies()
  return parseCurrency(jar.get(CURRENCY_COOKIE)?.value)
}
