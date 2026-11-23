import Link from "next/link"
import { CheckCircle2, Circle } from "lucide-react"
import { formatDate, STATUS_LABEL } from "@/lib/format"
import { money } from "@/lib/currency"
import type { Order } from "@/lib/types"
import { cn } from "@/lib/utils"
import { StoreImage } from "@/components/store/store-image"

const STEPS = ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] as const

export function OrderView({ order }: { order: Order }) {
  const stopped = order.status === "CANCELLED" || order.status === "REFUNDED"
  const reached = STEPS.indexOf(order.status as (typeof STEPS)[number])
  const shipment = order.shipments.find((s) => s.trackingNumber || s.carrier)
  const address = order.shippingAddress

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Order</p>
          <h1 className="text-2xl font-semibold sm:text-3xl">
            {order.orderNumber}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Placed {formatDate(order.placedAt, true)}
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="rounded-full bg-muted px-3 py-1">
            {STATUS_LABEL[order.status]}
          </span>
          <span className="rounded-full bg-muted px-3 py-1">
            {STATUS_LABEL[order.paymentStatus]}
          </span>
        </div>
      </div>

      {!stopped && order.status !== "PENDING" && (
        <ol className="grid grid-cols-4 gap-2">
          {STEPS.map((step, i) => (
            <li key={step} className="space-y-2">
              <div
                className={cn(
                  "h-1 rounded-full",
                  i <= reached ? "bg-primary" : "bg-muted"
                )}
              />
              <p
                className={cn(
                  "flex items-center gap-1 text-xs",
                  i <= reached ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {i <= reached ? (
                  <CheckCircle2 className="size-3.5" />
                ) : (
                  <Circle className="size-3.5" />
                )}
                {STATUS_LABEL[step]}
              </p>
            </li>
          ))}
        </ol>
      )}

      {order.status === "PENDING" && order.paymentStatus === "UNPAID" && (
        <p className="rounded-md bg-muted p-4 text-sm">
          We haven&apos;t received payment for this order yet. If you paid, it
          can take a minute to confirm.
        </p>
      )}

      {shipment && (
        <div className="rounded-lg border p-4 text-sm">
          <p className="font-medium">Shipping</p>
          <p className="text-muted-foreground">
            {[shipment.carrier, shipment.trackingNumber]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {shipment.trackingUrl && (
            <a
              href={shipment.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block underline"
            >
              Track parcel
            </a>
          )}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="divide-y rounded-lg border">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-3 p-4">
              <div className="aspect-[3/4] w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                {item.image && (
                  <StoreImage
                    src={item.image}
                    alt=""
                    className="object-cover"
                    sizes="64px"
                  />
                )}
              </div>
              <div className="flex-1 text-sm">
                <p className="font-medium">{item.productTitle}</p>
                <p className="text-muted-foreground">{item.variantTitle}</p>
                <p className="text-muted-foreground">Qty {item.quantity}</p>
              </div>
              <p className="text-sm">{money(item.totalKobo, order.currency)}</p>
            </div>
          ))}
        </div>
        <div className="space-y-6">
          <div className="space-y-2 rounded-lg border p-4 text-sm">
            <Line
              label="Subtotal"
              value={money(order.subtotalKobo, order.currency)}
            />
            {order.discountKobo > 0 && (
              <Line
                label={`Discount${order.discountCode ? ` (${order.discountCode})` : ""}`}
                value={`−${money(order.discountKobo, order.currency)}`}
              />
            )}
            <Line
              label="Delivery"
              value={
                order.deliveryKobo
                  ? money(order.deliveryKobo, order.currency)
                  : "Free"
              }
            />
            <div className="flex justify-between border-t pt-2 font-medium">
              <span>Total</span>
              <span>{money(order.totalKobo, order.currency)}</span>
            </div>
          </div>
          <div className="rounded-lg border p-4 text-sm">
            <p className="mb-1 font-medium">Delivering to</p>
            <p>{address.fullName}</p>
            <p className="text-muted-foreground">{address.phoneNumber}</p>
            <p className="text-muted-foreground">
              {[address.line1, address.line2, address.city, address.state]
                .filter(Boolean)
                .join(", ")}
            </p>
            {address.landmark && (
              <p className="text-muted-foreground">Near {address.landmark}</p>
            )}
          </div>
        </div>
      </div>

      <Link href="/shop" className="inline-block text-sm underline">
        Continue shopping
      </Link>
    </div>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  )
}
