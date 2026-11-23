"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/components/providers/auth-provider"
import { authButton, authInput } from "@/components/auth/auth-shell"
import { api, errorMessage } from "@/lib/api"
import { formatDate, STATUS_LABEL } from "@/lib/format"
import { money } from "@/lib/currency"
import type { OrderSummary, Pagination } from "@/lib/types"
import { StoreImage } from "@/components/store/store-image"

export function useRequireUser() {
  const { user, loading } = useAuth()
  const router = useRouter()
  React.useEffect(() => {
    if (!loading && !user)
      router.replace(
        `/login?next=${encodeURIComponent(window.location.pathname)}`
      )
  }, [loading, user, router])
  return { user, loading }
}

export function AccountView() {
  const { user, loading } = useRequireUser()
  const { logout, reload } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = React.useState<OrderSummary[] | null>(null)
  const [profile, setProfile] = React.useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
  })
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (!user) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- seed form from the loaded user
    setProfile({
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      phoneNumber: user.phoneNumber ?? "",
    })
    api
      .get<{ items: OrderSummary[]; pagination: Pagination }>("/orders")
      .then((r) => setOrders(r.items))
      .catch(() => setOrders([]))
  }, [user])

  if (loading || !user) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container-page py-10">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">
            Hi{user.firstName ? `, ${user.firstName}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex gap-4 text-sm">
          {user.role === "ADMIN" && (
            <Link href="/admin" className="underline">
              Store admin
            </Link>
          )}
          <button
            className="underline"
            onClick={async () => {
              await logout()
              router.replace("/")
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="grid gap-12 lg:grid-cols-[1fr_340px]">
        <section className="space-y-4">
          <h2 className="font-sans text-lg font-medium">Orders</h2>
          {orders === null ? (
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          ) : orders.length === 0 ? (
            <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No orders yet.{" "}
              <Link href="/shop" className="underline">
                Start shopping
              </Link>
            </p>
          ) : (
            <div className="divide-y rounded-lg border">
              {orders.map((order) => (
                <Link
                  key={order.orderNumber}
                  href={`/account/orders/${order.orderNumber}`}
                  className="flex items-center gap-4 p-4 transition hover:bg-muted/50"
                >
                  <div className="flex -space-x-3">
                    {order.items.slice(0, 3).map((item, i) => (
                      <div
                        key={i}
                        className="size-12 overflow-hidden rounded-md border-2 border-background bg-muted"
                      >
                        {item.image && (
                          <StoreImage
                            src={item.image}
                            alt=""
                            className="object-cover"
                            sizes="48px"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-muted-foreground">
                      {formatDate(order.placedAt)} · {order.itemCount}{" "}
                      {order.itemCount === 1 ? "item" : "items"}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p>{money(order.totalKobo, order.currency)}</p>
                    <p className="text-xs text-muted-foreground">
                      {STATUS_LABEL[order.status]}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="font-sans text-lg font-medium">Details</h2>
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault()
              setSaving(true)
              try {
                await api.patch("/auth/profile", {
                  firstName: profile.firstName.trim(),
                  lastName: profile.lastName.trim(),
                  phoneNumber: profile.phoneNumber.trim() || undefined,
                })
                await reload()
                toast.success("Saved")
              } catch (error) {
                toast.error(errorMessage(error))
              } finally {
                setSaving(false)
              }
            }}
          >
            <input
              aria-label="First name"
              placeholder="First name"
              className={authInput}
              value={profile.firstName}
              onChange={(e) =>
                setProfile({ ...profile, firstName: e.target.value })
              }
            />
            <input
              aria-label="Last name"
              placeholder="Last name"
              className={authInput}
              value={profile.lastName}
              onChange={(e) =>
                setProfile({ ...profile, lastName: e.target.value })
              }
            />
            <input
              aria-label="Phone"
              placeholder="Phone"
              type="tel"
              className={authInput}
              value={profile.phoneNumber}
              onChange={(e) =>
                setProfile({ ...profile, phoneNumber: e.target.value })
              }
            />
            <button disabled={saving} className={authButton}>
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Save details"
              )}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
