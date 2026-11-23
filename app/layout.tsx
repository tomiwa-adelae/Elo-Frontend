import type { Metadata, Viewport } from "next"
import { Cormorant_Garamond, Outfit } from "next/font/google"

import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { StoreThemeStyle } from "@/components/store-theme"
import { AuthProvider } from "@/components/providers/auth-provider"
import { CartProvider } from "@/components/providers/cart-provider"
import { CurrencyProvider } from "@/components/providers/currency-provider"
import { getCurrency, getStoreSettings } from "@/lib/api-server"

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
})

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-outfit",
  display: "swap",
})

export async function generateMetadata(): Promise<Metadata> {
  const store = await getStoreSettings()
  const title = store.metaTitle || store.name
  const description =
    store.metaDescription || store.tagline || `Shop online at ${store.name}`

  return {
    metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3010"),
    title: { default: title, template: `%s · ${store.name}` },
    description,
    icons: store.faviconUrl ? { icon: store.faviconUrl } : undefined,
    openGraph: {
      title,
      description,
      siteName: store.name,
      type: "website",
      images: store.ogImageUrl || store.heroImageUrl || undefined,
    },
  }
}

export async function generateViewport(): Promise<Viewport> {
  const store = await getStoreSettings()
  return { themeColor: store.theme.background }
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const store = await getStoreSettings()
  const currency = await getCurrency(store.enableUsd)

  return (
    <html lang="en" className={`${cormorant.variable} ${outfit.variable} antialiased`}>
      <head>
        <StoreThemeStyle theme={store.theme} />
      </head>
      <body className="min-h-svh" suppressHydrationWarning>
        <CurrencyProvider initial={currency} enabled={store.enableUsd}>
          <AuthProvider>
            <CartProvider>
              {children}
              <Toaster theme="light" position="top-center" />
            </CartProvider>
          </AuthProvider>
        </CurrencyProvider>
      </body>
    </html>
  )
}
