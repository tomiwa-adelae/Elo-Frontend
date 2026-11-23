import { NextResponse, type NextRequest } from "next/server"
import { CURRENCY_COOKIE } from "@/lib/currency"

/** Readable by the browser so the bag can estimate delivery before checkout. */
export const COUNTRY_COOKIE = "geo_country"

const YEAR = 60 * 60 * 24 * 365

/**
 * First visit only: shoppers outside Nigeria start in dollars. The country
 * comes from the host's geo header (Vercel or Cloudflare); with neither, the
 * store stays in naira. Once the shopper picks a currency, their choice wins.
 */
export function proxy(request: NextRequest) {
  const country = (
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("cf-ipcountry")
  )?.toUpperCase()
  const needsCurrency = !request.cookies.has(CURRENCY_COOKIE)
  const needsCountry =
    !!country && /^[A-Z]{2}$/.test(country) && request.cookies.get(COUNTRY_COOKIE)?.value !== country

  if (!country || (!needsCurrency && !needsCountry)) return NextResponse.next()

  const currency = country === "NG" ? "NGN" : "USD"

  // Set on the request too, so this very render already uses it.
  if (needsCurrency) request.cookies.set(CURRENCY_COOKIE, currency)
  const response = NextResponse.next({ request })
  if (needsCurrency) {
    response.cookies.set(CURRENCY_COOKIE, currency, { path: "/", maxAge: YEAR, sameSite: "lax" })
  }
  if (needsCountry) {
    response.cookies.set(COUNTRY_COOKIE, country, { path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax" })
  }
  return response
}

export const config = {
  // Pages only: skip the API proxy, Next internals and static files.
  matcher: ["/((?!api|admin|_next|images|.*\\..*).*)"],
}
