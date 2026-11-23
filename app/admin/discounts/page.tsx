"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { CrudDialog } from "@/components/admin/crud-dialog"
import { useTwoStep } from "@/components/admin/use-two-step"
import { Empty, ErrorState, FormField, Loading, NairaInput, PageHeader, Toggle, btnPrimary, inputCls, runAction, useAdminQuery } from "@/components/admin/ui"
import { api } from "@/lib/api"
import type { AdminCollection, Discount, DiscountType } from "@/lib/admin-types"
import { formatDate, naira } from "@/lib/format"
import { cn } from "@/lib/utils"

type Form = Omit<Discount, "id" | "usedCount" | "startsAt"> & { id?: string; startsAt: string | null }

const BLANK: Form = {
  code: "",
  type: "PERCENTAGE",
  value: 10,
  maxDiscountKobo: null,
  minSubtotalKobo: null,
  appliesToCollectionIds: [],
  appliesToProductIds: [],
  usageLimit: null,
  perUserLimit: 1,
  startsAt: null,
  endsAt: null,
  isActive: true,
}

const toDateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : "")
// Dates are whole days in Lagos: start at 00:00, end at 23:59 (UTC+1).
const fromDateInput = (value: string, end = false) =>
  value ? new Date(`${value}T${end ? "23:59:59" : "00:00:00"}+01:00`).toISOString() : null

function describe(d: Discount) {
  const what =
    d.type === "PERCENTAGE" ? `${d.value}% off` : d.type === "FIXED_AMOUNT" ? `${naira(d.value)} off` : "Free delivery"
  const extra = [
    d.minSubtotalKobo && `orders over ${naira(d.minSubtotalKobo)}`,
    d.appliesToCollectionIds.length && "selected collections",
  ].filter(Boolean)
  return extra.length ? `${what} · ${extra.join(", ")}` : what
}

function state(d: Discount) {
  const now = Date.now()
  if (!d.isActive) return { label: "Off", tone: "bg-zinc-100 text-zinc-600" }
  if (new Date(d.startsAt).getTime() > now) return { label: "Scheduled", tone: "bg-sky-100 text-sky-900" }
  if (d.endsAt && new Date(d.endsAt).getTime() < now) return { label: "Ended", tone: "bg-zinc-100 text-zinc-600" }
  if (d.usageLimit && d.usedCount >= d.usageLimit) return { label: "Used up", tone: "bg-zinc-100 text-zinc-600" }
  return { label: "Active", tone: "bg-emerald-100 text-emerald-900" }
}

export default function DiscountsPage() {
  const { data, error, loading, reload } = useAdminQuery<Discount[]>("/admin/discounts")
  const collections = useAdminQuery<AdminCollection[]>("/admin/collections")
  const [form, setForm] = React.useState<Form | null>(null)
  const [busy, setBusy] = React.useState(false)
  const confirm = useTwoStep()

  if (loading && !data) return <Loading />
  if (error || !data) return <ErrorState message={error ?? "Could not load"} onRetry={reload} />

  const save = async () => {
    if (!form) return
    setBusy(true)
    const { id, ...rest } = form
    const body = {
      ...rest,
      code: rest.code.trim().toUpperCase(),
      value: rest.type === "FREE_SHIPPING" ? 0 : rest.value,
      startsAt: rest.startsAt ?? undefined,
    }
    const ok = await runAction(() => (id ? api.patch(`/admin/discounts/${id}`, body) : api.post("/admin/discounts", body)), "Discount saved")
    setBusy(false)
    if (ok) {
      setForm(null)
      void reload()
    }
  }

  const remove = async () => {
    if (!form?.id || !confirm()) return
    setBusy(true)
    const ok = await runAction(() => api.delete(`/admin/discounts/${form.id}`), "Discount removed")
    setBusy(false)
    if (ok) {
      setForm(null)
      void reload()
    }
  }

  const set = (patch: Partial<Form>) => setForm((f) => (f ? { ...f, ...patch } : f))

  return (
    <>
      <PageHeader
        title="Discounts"
        description="Codes customers enter in their bag or at checkout."
        actions={
          <button className={btnPrimary} onClick={() => setForm({ ...BLANK })}>
            <Plus className="size-4" /> New code
          </button>
        }
      />

      {data.length === 0 ? (
        <Empty>No discount codes yet.</Empty>
      ) : (
        <div className="divide-y overflow-hidden rounded-lg border bg-background">
          {data.map((d) => {
            const s = state(d)
            return (
              <button
                key={d.id}
                onClick={() => setForm({ ...d, startsAt: d.startsAt })}
                className="flex w-full items-center gap-3 p-4 text-left hover:bg-accent"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm font-semibold">{d.code}</p>
                  <p className="text-xs text-muted-foreground">{describe(d)}</p>
                  {d.endsAt && <p className="text-xs text-muted-foreground">Ends {formatDate(d.endsAt)}</p>}
                </div>
                <div className="text-right">
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", s.tone)}>{s.label}</span>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {d.usedCount}
                    {d.usageLimit ? ` / ${d.usageLimit}` : ""} used
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {form && (
        <CrudDialog
          title={form.id ? `Edit ${form.code}` : "New discount code"}
          busy={busy}
          onClose={() => setForm(null)}
          onSubmit={save}
          onDelete={form.id ? remove : undefined}
        >
          <FormField label="Code" hint="What customers type. Letters, numbers, dashes.">
            <input
              required
              pattern="[A-Za-z0-9_\-]{3,30}"
              value={form.code}
              onChange={(e) => set({ code: e.target.value.toUpperCase() })}
              className={cn(inputCls, "font-mono uppercase")}
              placeholder="WELCOME10"
            />
          </FormField>
          <FormField label="Type">
            <select
              value={form.type}
              onChange={(e) => {
                const type = e.target.value as DiscountType
                set({ type, value: type === "PERCENTAGE" ? 10 : type === "FIXED_AMOUNT" ? 200000 : 0 })
              }}
              className={inputCls}
            >
              <option value="PERCENTAGE">Percentage off</option>
              <option value="FIXED_AMOUNT">Fixed amount off</option>
              <option value="FREE_SHIPPING">Free delivery</option>
            </select>
          </FormField>
          {form.type === "PERCENTAGE" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Percent off">
                <input type="number" min={1} max={100} required value={form.value} onChange={(e) => set({ value: Number(e.target.value) })} className={inputCls} />
              </FormField>
              <FormField label="Cap (optional)" hint="Most it can take off.">
                <NairaInput value={form.maxDiscountKobo} onChange={(maxDiscountKobo) => set({ maxDiscountKobo })} />
              </FormField>
            </div>
          )}
          {form.type === "FIXED_AMOUNT" && (
            <FormField label="Amount off">
              <NairaInput required value={form.value} onChange={(v) => set({ value: v ?? 0 })} />
            </FormField>
          )}
          <FormField label="Minimum order (optional)">
            <NairaInput value={form.minSubtotalKobo} onChange={(minSubtotalKobo) => set({ minSubtotalKobo })} />
          </FormField>
          {(collections.data ?? []).length > 0 && form.type !== "FREE_SHIPPING" && (
            <div className="space-y-1.5">
              <span className="text-sm font-medium">Only on these collections (optional)</span>
              <div className="flex flex-wrap gap-2">
                {(collections.data ?? []).map((c) => {
                  const on = form.appliesToCollectionIds.includes(c.id)
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => set({ appliesToCollectionIds: on ? form.appliesToCollectionIds.filter((x) => x !== c.id) : [...form.appliesToCollectionIds, c.id] })}
                      className={cn("rounded-full border px-3 py-1 text-xs", on ? "border-foreground bg-foreground text-background" : "hover:border-foreground")}
                    >
                      {c.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Total uses (optional)">
              <input type="number" min={1} value={form.usageLimit ?? ""} onChange={(e) => set({ usageLimit: e.target.value ? Number(e.target.value) : null })} className={inputCls} placeholder="Unlimited" />
            </FormField>
            <FormField label="Uses per customer">
              <input type="number" min={1} value={form.perUserLimit ?? ""} onChange={(e) => set({ perUserLimit: e.target.value ? Number(e.target.value) : null })} className={inputCls} placeholder="Unlimited" />
            </FormField>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Starts">
              <input type="date" value={toDateInput(form.startsAt)} onChange={(e) => set({ startsAt: fromDateInput(e.target.value) })} className={inputCls} />
            </FormField>
            <FormField label="Ends (optional)">
              <input type="date" value={toDateInput(form.endsAt)} onChange={(e) => set({ endsAt: fromDateInput(e.target.value, true) })} className={inputCls} />
            </FormField>
          </div>
          <Toggle checked={form.isActive} onChange={(isActive) => set({ isActive })} label="Active" />
        </CrudDialog>
      )}
    </>
  )
}
