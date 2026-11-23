import Link from "next/link"
import type { StoreSettings } from "@/lib/types"
import { whatsappLink } from "@/lib/format"

function socialUrl(network: string, handle: string) {
  if (/^https?:\/\//.test(handle)) return handle
  const clean = handle.replace(/^@/, "")
  const base: Record<string, string> = {
    instagram: "https://www.instagram.com/",
    tiktok: "https://www.tiktok.com/@",
    facebook: "https://facebook.com/",
    twitter: "https://x.com/",
  }
  return base[network] + clean
}

interface FooterLink {
  label: string
  href: string
  external?: boolean
}

function Column({ title, links }: { title: string; links: FooterLink[] }) {
  if (!links.length) return null
  return (
    <div>
      <h6 className="mb-[18px] text-[11px] font-normal tracking-[0.24em] text-background uppercase">
        {title}
      </h6>
      <ul className="grid gap-2.5 text-sm">
        {links.map((link) => (
          <li key={link.label}>
            {link.external ? (
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-background"
              >
                {link.label}
              </a>
            ) : (
              <Link href={link.href} className="transition hover:text-background">
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function SiteFooter({ store }: { store: StoreSettings }) {
  const follow: FooterLink[] = [
    ...(["instagram", "tiktok", "facebook", "twitter"] as const)
      .filter((n) => store[n])
      .map((n) => ({
        label: n === "twitter" ? "X" : n[0].toUpperCase() + n.slice(1),
        href: socialUrl(n, store[n]!),
        external: true,
      })),
    ...(store.whatsappNumber
      ? [
          {
            label: "WhatsApp",
            href: whatsappLink(store.whatsappNumber, `Hi ${store.name}!`),
            external: true,
          },
        ]
      : []),
  ]

  const help: FooterLink[] = [
    { label: "Track an order", href: "/orders/lookup" },
    { label: "Size guide", href: "/size-guide" },
    ...(store.shippingPolicy ? [{ label: "Shipping", href: "/policies/shipping" }] : []),
    ...(store.returnsPolicy ? [{ label: "Returns & exchanges", href: "/policies/returns" }] : []),
    { label: "FAQ", href: "/faq" },
  ]

  const legal: FooterLink[] = [
    ...(store.privacyPolicy ? [{ label: "Privacy", href: "/policies/privacy" }] : []),
    ...(store.termsOfService ? [{ label: "Terms", href: "/policies/terms" }] : []),
  ]

  return (
    <footer className="bg-foreground pt-20 pb-10 text-[#cfcabf]">
      <div className="container-page">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <p className="font-heading text-[34px] leading-none font-medium tracking-[0.14em] text-background">
              {store.name}
            </p>
            <p className="mt-5 max-w-[280px] text-sm">
              {store.tagline ? `${store.tagline}. ` : ""}Everyday ease. Elevated essentials for
              effortless living, hand-wrapped in Lagos.
            </p>
            {(store.contactEmail || store.contactPhone) && (
              <div className="mt-5 grid gap-1 text-sm">
                {store.contactEmail && (
                  <a href={`mailto:${store.contactEmail}`} className="hover:text-background">
                    {store.contactEmail}
                  </a>
                )}
                {store.contactPhone && (
                  <a
                    href={`tel:${store.contactPhone.replace(/\s/g, "")}`}
                    className="hover:text-background"
                  >
                    {store.contactPhone}
                  </a>
                )}
              </div>
            )}
          </div>
          <Column
            title="Shop"
            links={[
              { label: "Shop all", href: "/shop" },
              { label: "Dresses", href: "/shop?category=dresses" },
              { label: "Robes", href: "/shop?category=robes" },
              { label: "Sets", href: "/shop?category=sets" },
              { label: "Gifts", href: "/collections/gifts" },
            ]}
          />
          <Column title="Help" links={help} />
          <Column title="Follow" links={follow} />
        </div>
        <div className="mt-16 flex flex-wrap justify-between gap-2.5 border-t border-white/15 pt-6 text-xs tracking-[0.08em]">
          <span>
            © {new Date().getFullYear()} {store.name} · Lagos
          </span>
          <span className="flex flex-wrap gap-4">
            {legal.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-background">
                {l.label}
              </Link>
            ))}
            <span>Payments secured by Paystack</span>
          </span>
        </div>
      </div>
    </footer>
  )
}
