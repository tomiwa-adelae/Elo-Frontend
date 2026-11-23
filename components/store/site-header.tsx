"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import * as React from "react"
import { Menu, Search, X } from "lucide-react"
import { useCart } from "@/components/providers/cart-provider"
import { useAuth } from "@/components/providers/auth-provider"
import { CurrencySwitch } from "@/components/store/price"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { CategoryNode } from "@/lib/types"
import { cn } from "@/lib/utils"

const PRIMARY_LINKS = [
  { label: "Shop", href: "/shop" },
  { label: "Colours", href: "/#colours" },
  { label: "Fabric", href: "/#fabric" },
  { label: "Diaries", href: "/#diaries" },
]

export function Wordmark({
  name,
  tagline,
  className,
}: {
  name: string
  tagline?: string | null
  className?: string
}) {
  return (
    <span className={cn("block text-center leading-none", className)}>
      <span className="block font-heading text-[34px] font-medium tracking-[0.14em] max-md:text-[28px]">
        {name}
      </span>
      {tagline && (
        <span className="mt-1 block text-[9px] font-light tracking-[0.32em] text-muted-foreground lowercase">
          {tagline}
        </span>
      )}
    </span>
  )
}

export function SiteHeader({
  storeName,
  tagline,
  logoUrl,
  categories,
}: {
  storeName: string
  tagline: string | null
  logoUrl: string | null
  categories: CategoryNode[]
}) {
  const { cart, setOpen } = useCart()
  const { user } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")

  // Close menus on navigation (state adjusted during render, not in an effect).
  const [lastPath, setLastPath] = React.useState(pathname)
  if (pathname !== lastPath) {
    setLastPath(pathname)
    setMenuOpen(false)
    setSearchOpen(false)
  }

  const count = cart?.itemCount ?? 0
  const accountHref = user ? (user.role === "ADMIN" ? "/admin" : "/account") : "/login"

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault()
    const q = query.trim()
    router.push(q ? `/shop?search=${encodeURIComponent(q)}` : "/shop")
  }

  const navText = "text-[12.5px] tracking-[0.16em] uppercase"

  return (
    <header className="sticky top-0 z-40 border-b border-stone bg-background/90 backdrop-blur-md">
      <div className="container-page grid h-[72px] grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex items-center gap-7">
          <button
            type="button"
            className="-ml-2 p-2 md:hidden"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="size-5 stroke-[1.5]" />
          </button>
          <nav className={cn("hidden items-center gap-7 md:flex", navText)}>
            {PRIMARY_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="transition hover:text-brand">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <Link href="/" aria-label={`${storeName} home`}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={storeName} className="h-10 w-auto max-w-[160px] object-contain" />
          ) : (
            <Wordmark name={storeName} tagline={tagline} />
          )}
        </Link>

        <div className={cn("flex items-center justify-end gap-5 max-md:gap-2", navText)}>
          <CurrencySwitch className="max-sm:hidden" />
          <button
            type="button"
            aria-label="Search"
            className="p-1 max-md:hidden"
            onClick={() => setSearchOpen((v) => !v)}
          >
            {searchOpen ? (
              <X className="size-[18px] stroke-[1.5]" />
            ) : (
              <Search className="size-[18px] stroke-[1.5]" />
            )}
          </button>
          <Link href={accountHref} className="transition hover:text-brand max-md:hidden">
            {user ? "Account" : "Sign in"}
          </Link>
          <button
            type="button"
            aria-label={`Bag, ${count} items`}
            className="flex items-center gap-1.5 uppercase transition hover:text-brand"
            onClick={() => setOpen(true)}
          >
            Bag
            <span className="inline-grid size-5 place-items-center rounded-full bg-story text-[11px] tracking-normal">
              {count > 9 ? "9+" : count}
            </span>
          </button>
        </div>
      </div>

      <div className={cn("border-t border-stone", !searchOpen && "hidden")}>
        <form onSubmit={submitSearch} className="container-page flex gap-3 py-3">
          <input
            autoFocus={searchOpen}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search dresses, robes, sets…"
            aria-label="Search"
            className="h-11 flex-1 border-b border-foreground bg-transparent px-1 text-[15px] outline-none"
          />
          <button className="text-[12px] tracking-[0.22em] uppercase">Search →</button>
        </form>
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-[85vw] max-w-sm border-stone bg-background p-0">
          <SheetHeader className="border-b border-stone px-6 py-5">
            <SheetTitle className="text-left font-heading text-3xl font-medium tracking-[0.14em]">
              {storeName}
            </SheetTitle>
            <SheetDescription className="sr-only">Site navigation</SheetDescription>
          </SheetHeader>
          <form onSubmit={submitSearch} className="border-b border-stone px-6 py-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              aria-label="Search"
              className="h-10 w-full border-b border-foreground/40 bg-transparent text-[15px] outline-none focus:border-foreground"
            />
          </form>
          <nav className="flex flex-col py-3">
            {[
              { label: "Shop all", href: "/shop" },
              ...categories.map((c) => ({ label: c.name, href: `/shop?category=${c.slug}` })),
              ...PRIMARY_LINKS.slice(1),
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="px-6 py-2.5 font-heading text-2xl"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto space-y-4 border-t border-stone px-6 py-5 text-[12px] tracking-[0.16em] uppercase">
            <CurrencySwitch className="w-fit" />
            <Link href={accountHref} className="block">
              {user ? "My account" : "Sign in"}
            </Link>
            <Link href="/orders/lookup" className="block">
              Track an order
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}
