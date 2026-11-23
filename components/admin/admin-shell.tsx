"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import * as React from "react"
import {
  BadgePercent,
  ExternalLink,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  Truck,
  Users,
} from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { Loading } from "@/components/admin/ui"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories & collections", icon: FolderTree },
  { href: "/admin/discounts", label: "Discounts", icon: BadgePercent },
  { href: "/admin/delivery", label: "Delivery zones", icon: Truck },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/subscribers", label: "Subscribers", icon: Mail },
  { href: "/admin/settings", label: "Store settings", icon: Settings },
]

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

export function AdminShell({ storeName, children }: { storeName: string; children: React.ReactNode }) {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    if (loading) return
    if (!user) router.replace(`/login?next=${encodeURIComponent(pathname)}`)
  }, [loading, user, router, pathname])

  if (loading || !user) return <Loading />

  if (user.role !== "ADMIN") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="font-sans text-xl font-semibold">No access</h1>
        <p className="text-sm text-muted-foreground">This account can&apos;t manage the store.</p>
        <Link href="/" className="text-sm underline">Back to the shop</Link>
      </div>
    )
  }

  const footer = (
    <div className="space-y-1 border-t pt-3">
      <Link href="/" target="_blank" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
        <ExternalLink className="size-4" /> View store
      </Link>
      <button
        onClick={async () => {
          await logout()
          router.replace("/login")
        }}
        className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <LogOut className="size-4" /> Sign out
      </button>
      <p className="truncate px-3 pt-1 text-xs text-muted-foreground">{user.email}</p>
    </div>
  )

  return (
    <div className="min-h-svh bg-sidebar lg:flex">
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col gap-6 border-r bg-background p-4 lg:flex">
        <Link href="/admin" className="truncate px-3 font-sans text-lg font-semibold">{storeName}</Link>
        <div className="flex-1 overflow-y-auto">
          <NavLinks />
        </div>
        {footer}
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background px-4 lg:hidden">
        <button aria-label="Open menu" onClick={() => setOpen(true)} className="-ml-2 p-2">
          <Menu className="size-5" />
        </button>
        <span className="truncate font-sans font-semibold">{storeName}</span>
      </header>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="flex w-72 flex-col gap-6 p-4">
          <SheetTitle className="px-3 pt-2 font-sans text-lg">{storeName}</SheetTitle>
          <SheetDescription className="sr-only">Admin navigation</SheetDescription>
          <div className="flex-1 overflow-y-auto">
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
          {footer}
        </SheetContent>
      </Sheet>

      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  )
}
