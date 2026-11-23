"use client"

import Link from "next/link"
import * as React from "react"
import { ArrowLeft, Copy, MessageCircle, Phone } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ErrorState,
  FormField,
  Loading,
  Panel,
  StatusBadge,
  Toggle,
  btnDanger,
  btnOutline,
  btnPrimary,
  inputCls,
  runAction,
  useAdminQuery,
} from "@/components/admin/ui"
import { api } from "@/lib/api"
import type { AdminOrder } from "@/lib/admin-types"
import { formatDate, STATUS_LABEL, whatsappLink } from "@/lib/format"
import { money } from "@/lib/currency"
import type { OrderStatus } from "@/lib/types"

const ACTION_LABEL: Record<OrderStatus, string> = {
  PENDING: "Mark pending",
  CONFIRMED: "Confirm order",
  PROCESSING: "Start processing",
  SHIPPED: "Mark shipped",
  DELIVERED: "Mark delivered",
  CANCELLED: "Cancel order",
  REFUNDED: "Mark refunded",
}

/** Nigerian numbers → international digits for wa.me. */
function toInternational(phone: string) {
  const digits = phone.replace(/\D/g, "")
  if (digits.startsWith("234")) return digits
  if (digits.startsWith("0")) return `234${digits.slice(1)}`
  return digits
}

export function OrderDetail({ orderNumber }: { orderNumber: string }) {
  const { data: order, error, loading, reload } = useAdminQuery<AdminOrder>(`/admin/orders/${encodeURIComponent(orderNumber)}`)
  const [target, setTarget] = React.useState<OrderStatus | null>(null)
  const [markPaidOpen, setMarkPaidOpen] = React.useState(false)
  const [note, setNote] = React.useState("")
  const [savingNote, setSavingNote] = React.useState(false)

  if (loading && !order) return <Loading />
  if (error || !order) return <ErrorState message={error ?? "Could not load"} onRetry={reload} />

  const address = order.shippingAddress
  const phone = address.phoneNumber
  const fullAddress = [address.line1, address.line2, address.city, address.state, address.postalCode, address.countryCode && address.countryCode !== "NG" ? (address.country ?? address.countryCode) : null].filter(Boolean).join(", ")

  return (
    <>
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Orders
      </Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-sans text-2xl font-semibold">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">{formatDate(order.placedAt, true)}</p>
          <div className="mt-2 flex gap-1">
            <StatusBadge status={order.status} />
            <StatusBadge status={order.paymentStatus} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {order.canMarkPaid && (
            <button className={btnOutline} onClick={() => setMarkPaidOpen(true)}>
              Mark as paid
            </button>
          )}
          {order.allowedTransitions.map((status) => (
            <button
              key={status}
              className={status === "CANCELLED" ? btnDanger : btnPrimary}
              onClick={() => setTarget(status)}
            >
              {ACTION_LABEL[status]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <Panel title={`Items (${order.items.reduce((s, i) => s + i.quantity, 0)})`}>
            <div className="-my-2 divide-y">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-3 py-3">
                  <div className="aspect-[3/4] w-12 shrink-0 overflow-hidden rounded bg-muted">
                    {item.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt="" className="size-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-medium">{item.productTitle}</p>
                    <p className="text-xs text-muted-foreground">{item.variantTitle} · {item.sku}</p>
                    <p className="text-xs text-muted-foreground">{money(item.unitPriceKobo, order.currency)} × {item.quantity}</p>
                  </div>
                  <p className="text-sm tabular-nums">{money(item.totalKobo, order.currency)}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1.5 border-t pt-3 text-sm">
              <Row label="Subtotal" value={money(order.subtotalKobo, order.currency)} />
              {order.discountKobo > 0 && <Row label={`Discount (${order.discountCode})`} value={`−${money(order.discountKobo, order.currency)}`} />}
              <Row label="Delivery" value={order.deliveryKobo ? money(order.deliveryKobo, order.currency) : "Free"} />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{money(order.totalKobo, order.currency)}</span>
              </div>
              {order.currency === "USD" && (
                <p className="text-right text-xs text-muted-foreground">
                  ≈ {money(order.totalNgnKobo, "NGN")}
                  {order.ngnPerUsd ? ` at ₦${order.ngnPerUsd.toLocaleString()}/$` : ""}
                </p>
              )}
            </div>
          </Panel>

          <Panel title="Timeline">
            <ol className="space-y-3">
              {[...order.events].reverse().map((event) => (
                <li key={event.id} className="flex gap-3 text-sm">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                  <div>
                    <p>{event.message}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(event.createdAt, true)}</p>
                  </div>
                </li>
              ))}
            </ol>
            <form
              className="mt-4 flex gap-2 border-t pt-4"
              onSubmit={async (e) => {
                e.preventDefault()
                if (!note.trim()) return
                setSavingNote(true)
                const ok = await runAction(() => api.post(`/admin/orders/${order.orderNumber}/notes`, { note: note.trim() }))
                setSavingNote(false)
                if (ok) {
                  setNote("")
                  void reload()
                }
              }}
            >
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add an internal note" className={inputCls} />
              <button disabled={savingNote} className={btnOutline}>Add</button>
            </form>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Customer">
            <div className="space-y-1 text-sm">
              <p className="font-medium">{address.fullName}</p>
              <p className="text-muted-foreground">{order.email}</p>
              <p className="text-muted-foreground">{phone}</p>
              {order.user ? <p className="text-xs text-muted-foreground">Has an account</p> : <p className="text-xs text-muted-foreground">Guest checkout</p>}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={`tel:${phone.replace(/\s/g, "")}`} className={`${btnOutline} h-9 px-3`}>
                <Phone className="size-4" /> Call
              </a>
              <a
                href={whatsappLink(toInternational(phone), `Hi ${address.fullName.split(" ")[0]}, this is about your order ${order.orderNumber}.`)}
                target="_blank"
                rel="noopener noreferrer"
                className={`${btnOutline} h-9 px-3`}
              >
                <MessageCircle className="size-4" /> WhatsApp
              </a>
            </div>
          </Panel>

          <Panel
            title="Delivery address"
            actions={
              <button
                aria-label="Copy address"
                onClick={() => {
                  void navigator.clipboard.writeText(`${address.fullName}\n${phone}\n${fullAddress}${address.landmark ? `\nNear ${address.landmark}` : ""}`)
                  toast.success("Address copied")
                }}
              >
                <Copy className="size-4 text-muted-foreground" />
              </button>
            }
          >
            <p className="text-sm">{fullAddress}</p>
            {address.landmark && <p className="mt-1 text-sm text-muted-foreground">Landmark: {address.landmark}</p>}
            {order.shipments[0]?.zone && <p className="mt-2 text-xs text-muted-foreground">Zone: {order.shipments[0].zone.name}</p>}
            {order.shipments
              .filter((s) => s.carrier || s.trackingNumber)
              .map((s) => (
                <div key={s.id} className="mt-3 rounded-md bg-muted p-3 text-xs">
                  <p className="font-medium">{[s.carrier, s.trackingNumber].filter(Boolean).join(" · ")}</p>
                  {s.trackingUrl && <a href={s.trackingUrl} target="_blank" rel="noopener noreferrer" className="underline">Tracking link</a>}
                </div>
              ))}
          </Panel>

          {order.customerNote && (
            <Panel title="Customer note">
              <p className="text-sm whitespace-pre-line">{order.customerNote}</p>
            </Panel>
          )}

          <Panel title="Payments">
            {order.payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payment yet.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {order.payments.map((p) => (
                  <li key={p.id} className="flex justify-between gap-2">
                    <span>
                      <span className="block">{p.method.replace(/_/g, " ").toLowerCase()}{p.channel ? ` · ${p.channel}` : ""}</span>
                      <span className="block text-xs break-all text-muted-foreground">{p.reference}</span>
                    </span>
                    <span className="text-right">
                      <span className="block tabular-nums">{money(p.amountKobo, p.currency)}</span>
                      <StatusBadge status={p.status === "SUCCESS" ? "PAID" : p.status} label={p.status.charAt(0) + p.status.slice(1).toLowerCase()} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      {target && (
        <StatusDialog
          order={order}
          status={target}
          onClose={() => setTarget(null)}
          onDone={() => {
            setTarget(null)
            void reload()
          }}
        />
      )}
      {markPaidOpen && (
        <MarkPaidDialog
          order={order}
          onClose={() => setMarkPaidOpen(false)}
          onDone={() => {
            setMarkPaidOpen(false)
            void reload()
          }}
        />
      )}
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  )
}

function StatusDialog({
  order,
  status,
  onClose,
  onDone,
}: {
  order: AdminOrder
  status: OrderStatus
  onClose: () => void
  onDone: () => void
}) {
  const [note, setNote] = React.useState("")
  const [carrier, setCarrier] = React.useState("")
  const [trackingNumber, setTrackingNumber] = React.useState("")
  const [trackingUrl, setTrackingUrl] = React.useState("")
  const [notify, setNotify] = React.useState(true)
  const [busy, setBusy] = React.useState(false)
  const emailsCustomer = ["SHIPPED", "DELIVERED", "CANCELLED"].includes(status)

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-sans">{ACTION_LABEL[status]}</DialogTitle>
          <DialogDescription>
            {order.orderNumber}: {STATUS_LABEL[order.status]} → {STATUS_LABEL[status]}
          </DialogDescription>
        </DialogHeader>
        <form
          id="status-form"
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault()
            setBusy(true)
            const ok = await runAction(
              () =>
                api.patch(`/admin/orders/${order.orderNumber}/status`, {
                  status,
                  note: note.trim() || undefined,
                  ...(status === "SHIPPED" && {
                    carrier: carrier.trim() || undefined,
                    trackingNumber: trackingNumber.trim() || undefined,
                    trackingUrl: trackingUrl.trim() || undefined,
                  }),
                  notifyCustomer: notify,
                }),
              `Order ${STATUS_LABEL[status].toLowerCase()}`
            )
            setBusy(false)
            if (ok) onDone()
          }}
        >
          {status === "CANCELLED" && (
            <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              Items go back into stock. Refund any payment yourself in Paystack or by transfer.
            </p>
          )}
          {status === "SHIPPED" && (
            <>
              <FormField label="Courier / rider (optional)">
                <input value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="GIG Logistics, own rider…" className={inputCls} />
              </FormField>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Tracking number">
                  <input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} className={inputCls} />
                </FormField>
                <FormField label="Tracking link">
                  <input type="url" value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} className={inputCls} />
                </FormField>
              </div>
            </>
          )}
          <FormField label={status === "CANCELLED" ? "Reason" : "Note (optional)"}>
            <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} required={status === "CANCELLED"} />
          </FormField>
          {emailsCustomer && (
            <Toggle checked={notify} onChange={setNotify} label="Email the customer" description={order.email} />
          )}
        </form>
        <DialogFooter>
          <button type="button" className={btnOutline} onClick={onClose}>Back</button>
          <button form="status-form" disabled={busy} className={status === "CANCELLED" ? btnDanger : btnPrimary}>
            {busy ? "Saving…" : ACTION_LABEL[status]}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function MarkPaidDialog({ order, onClose, onDone }: { order: AdminOrder; onClose: () => void; onDone: () => void }) {
  const [method, setMethod] = React.useState(order.paymentStatus === "AWAITING_DELIVERY_PAYMENT" ? "PAY_ON_DELIVERY" : "BANK_TRANSFER")
  const [note, setNote] = React.useState("")
  const [busy, setBusy] = React.useState(false)

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-sans">Mark as paid</DialogTitle>
          <DialogDescription>
            Record {money(order.totalKobo, order.currency)} received outside Paystack. Only do this once the money is in your account.
          </DialogDescription>
        </DialogHeader>
        <form
          id="paid-form"
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault()
            setBusy(true)
            const ok = await runAction(
              () => api.post(`/admin/orders/${order.orderNumber}/mark-paid`, { method, note: note.trim() || undefined }),
              "Payment recorded"
            )
            setBusy(false)
            if (ok) onDone()
          }}
        >
          <FormField label="How did they pay?">
            <select value={method} onChange={(e) => setMethod(e.target.value)} className={inputCls}>
              <option value="BANK_TRANSFER">Bank transfer</option>
              <option value="PAY_ON_DELIVERY">Cash / transfer on delivery</option>
              <option value="CARD">Card (POS)</option>
              <option value="USSD">USSD</option>
            </select>
          </FormField>
          <FormField label="Reference or note (optional)">
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. GTB transfer from Ada O." className={inputCls} />
          </FormField>
        </form>
        <DialogFooter>
          <button type="button" className={btnOutline} onClick={onClose}>Back</button>
          <button form="paid-form" disabled={busy} className={btnPrimary}>{busy ? "Saving…" : "Confirm payment"}</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
