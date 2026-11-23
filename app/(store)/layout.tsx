import { SiteHeader } from "@/components/store/site-header"
import { SiteFooter } from "@/components/store/site-footer"
import { CartDrawer } from "@/components/store/cart-drawer"
import { WhatsAppButton } from "@/components/store/whatsapp-button"
import { getStoreSettings, serverGet } from "@/lib/api-server"
import type { CategoryNode } from "@/lib/types"

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [store, categories] = await Promise.all([
    getStoreSettings(),
    serverGet<CategoryNode[]>("/catalog/categories").catch(() => []),
  ])

  return (
    <div className="flex min-h-svh flex-col">
      {store.announcement && (
        <div className="bg-foreground px-4 py-2.5 text-center text-[11.5px] tracking-[0.2em] text-background uppercase max-sm:text-[10px] max-sm:tracking-[0.14em]">
          {store.announcement}
        </div>
      )}
      <SiteHeader
        storeName={store.name}
        tagline={store.tagline}
        logoUrl={store.logoUrl}
        categories={categories}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter store={store} />
      <CartDrawer />
      {store.whatsappNumber && (
        <WhatsAppButton number={store.whatsappNumber} storeName={store.name} />
      )}
    </div>
  )
}
