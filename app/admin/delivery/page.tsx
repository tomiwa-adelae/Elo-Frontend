"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { CrudDialog } from "@/components/admin/crud-dialog"
import { useTwoStep } from "@/components/admin/use-two-step"
import { Empty, ErrorState, FormField, Loading, NairaInput, PageHeader, Toggle, btnPrimary, inputCls, runAction, useAdminQuery } from "@/components/admin/ui"
import { api } from "@/lib/api"
import type { DeliveryZone } from "@/lib/admin-types"
import { countryName } from "@/lib/countries"
import { money } from "@/lib/currency"
import { NIGERIAN_STATES } from "@/lib/format"
import { cn } from "@/lib/utils"

type Form = Omit<DeliveryZone, "id"> & { id?: string }

const BLANK: Form = {
  name: "",
  countries: ["NG"],
  states: [],
  cities: [],
  feeKobo: 300000,
  freeAboveKobo: null,
  feeUsdCents: null,
  freeAboveUsdCents: null,
  position: 0,
  estimatedMinDays: 1,
  estimatedMaxDays: 3,
  allowPayOnDelivery: false,
  isActive: true,
}

const isNigeria = (z: { countries: string[] }) => z.countries.length === 1 && z.countries[0] === "NG"

function coverage(z: DeliveryZone) {
  if (isNigeria(z)) {
    return [z.cities.length ? z.cities.join(", ") : null, z.states.join(", ")].filter(Boolean).join(" · ")
  }
  return z.countries.map((c) => (c === "*" ? "Everywhere else" : countryName(c))).join(", ")
}

export default function DeliveryPage() {
  const { data, error, loading, reload } = useAdminQuery<DeliveryZone[]>("/admin/delivery-zones")
  const [form, setForm] = React.useState<Form | null>(null)
  const [citiesText, setCitiesText] = React.useState("")
  const [countriesText, setCountriesText] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const confirm = useTwoStep()

  if (loading && !data) return <Loading />
  if (error || !data) return <ErrorState message={error ?? "Could not load"} onRetry={reload} />

  const open = (zone: Form) => {
    setForm(zone)
    setCitiesText(zone.cities.join(", "))
    setCountriesText(isNigeria(zone) ? "" : zone.countries.join(", "))
  }
  const set = (patch: Partial<Form>) => setForm((f) => (f ? { ...f, ...patch } : f))

  const domestic = form ? isNigeria(form) : true
  const parsedCountries = countriesText
    .split(/[\s,]+/)
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean)

  const save = async () => {
    if (!form) return
    const countries = domestic ? ["NG"] : parsedCountries
    const body = {
      name: form.name,
      countries,
      states: domestic ? form.states : [],
      cities: domestic ? citiesText.split(",").map((c) => c.trim()).filter(Boolean) : [],
      feeKobo: form.feeKobo,
      freeAboveKobo: form.freeAboveKobo,
      feeUsdCents: form.feeUsdCents,
      freeAboveUsdCents: form.freeAboveUsdCents,
      position: form.position,
      estimatedMinDays: form.estimatedMinDays,
      estimatedMaxDays: form.estimatedMaxDays,
      allowPayOnDelivery: domestic && form.allowPayOnDelivery,
      isActive: form.isActive,
    }
    setBusy(true)
    const ok = await runAction(
      () => (form.id ? api.patch(`/admin/delivery-zones/${form.id}`, body) : api.post("/admin/delivery-zones", body)),
      "Zone saved"
    )
    setBusy(false)
    if (ok) {
      setForm(null)
      void reload()
    }
  }

  const remove = async () => {
    if (!form?.id || !confirm()) return
    setBusy(true)
    const ok = await runAction(() => api.delete(`/admin/delivery-zones/${form.id}`), "Zone removed")
    setBusy(false)
    if (ok) {
      setForm(null)
      void reload()
    }
  }

  return (
    <>
      <PageHeader
        title="Delivery zones"
        description="In Nigeria, checkout matches the customer's city first, then their state. Abroad, it uses the zone listing their country, then the “everywhere else” (*) zone."
        actions={
          <button className={btnPrimary} onClick={() => open({ ...BLANK, position: data.length })}>
            <Plus className="size-4" /> Add zone
          </button>
        }
      />
      {data.length === 0 ? (
        <Empty>No delivery zones. Customers can&apos;t check out until you add one.</Empty>
      ) : (
        <div className="divide-y overflow-hidden rounded-lg border bg-background">
          {data.map((z) => (
            <button key={z.id} onClick={() => open({ ...z })} className={cn("flex w-full items-start gap-3 p-4 text-left hover:bg-accent", !z.isActive && "opacity-60")}>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {z.name}
                  <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground uppercase">
                    {isNigeria(z) ? "Nigeria" : "International"}
                  </span>
                  {!z.isActive && <span className="ml-2 text-xs font-normal text-muted-foreground">(off)</span>}
                </p>
                <p className="truncate text-xs text-muted-foreground">{coverage(z)}</p>
                <p className="text-xs text-muted-foreground">
                  {z.estimatedMinDays}–{z.estimatedMaxDays} days
                  {z.allowPayOnDelivery ? " · pay on delivery" : ""}
                </p>
              </div>
              <div className="text-right text-sm">
                <p className="tabular-nums">
                  {z.feeKobo ? money(z.feeKobo, "NGN") : "Free"}
                  {z.feeUsdCents != null && <span className="text-muted-foreground"> · {money(z.feeUsdCents, "USD")}</span>}
                </p>
                {(z.freeAboveKobo || z.freeAboveUsdCents) && (
                  <p className="text-xs text-muted-foreground">
                    free over{" "}
                    {[
                      z.freeAboveKobo ? money(z.freeAboveKobo, "NGN") : null,
                      z.freeAboveUsdCents ? money(z.freeAboveUsdCents, "USD") : null,
                    ]
                      .filter(Boolean)
                      .join(" / ")}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {form && (
        <CrudDialog
          title={form.id ? "Edit zone" : "New zone"}
          busy={busy}
          onClose={() => setForm(null)}
          onSubmit={save}
          onDelete={form.id ? remove : undefined}
        >
          <FormField label="Name" hint="Shown to customers at checkout.">
            <input required value={form.name} onChange={(e) => set({ name: e.target.value })} className={inputCls} placeholder={domestic ? "Lagos" : "UK & Europe"} />
          </FormField>

          <div className="grid grid-cols-2 gap-2">
            {(["Nigeria", "International"] as const).map((scope) => {
              const on = (scope === "Nigeria") === domestic
              return (
                <button
                  key={scope}
                  type="button"
                  onClick={() => set({ countries: scope === "Nigeria" ? ["NG"] : parsedCountries.length ? parsedCountries : ["*"] })}
                  className={cn("h-10 rounded-md border text-sm", on ? "border-foreground bg-foreground text-background" : "hover:border-foreground")}
                >
                  {scope}
                </button>
              )
            })}
          </div>

          {domestic ? (
            <>
              <div className="space-y-1.5">
                <span className="text-sm font-medium">States</span>
                <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto rounded-md border p-2">
                  {NIGERIAN_STATES.map((s) => {
                    const on = form.states.includes(s)
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => set({ states: on ? form.states.filter((x) => x !== s) : [...form.states, s] })}
                        className={cn("rounded-full border px-2.5 py-1 text-xs", on ? "border-foreground bg-foreground text-background" : "hover:border-foreground")}
                      >
                        {s}
                      </button>
                    )
                  })}
                </div>
              </div>
              <FormField label="Cities / areas (optional)" hint="Comma separated. Leave empty to cover the whole state.">
                <input value={citiesText} onChange={(e) => setCitiesText(e.target.value)} className={inputCls} placeholder="Lekki, Ikoyi, Victoria Island, Ajah" />
              </FormField>
            </>
          ) : (
            <FormField
              label="Countries"
              hint={
                parsedCountries.length
                  ? parsedCountries.map((c) => (c === "*" ? "Everywhere else" : countryName(c))).join(", ")
                  : "2-letter codes, comma separated (GB, FR, US). Use * for everywhere not listed in another zone."
              }
            >
              <input
                required
                value={countriesText}
                onChange={(e) => {
                  setCountriesText(e.target.value)
                  const codes = e.target.value.split(/[\s,]+/).map((c) => c.trim().toUpperCase()).filter(Boolean)
                  set({ countries: codes.length && !(codes.length === 1 && codes[0] === "NG") ? codes : ["*"] })
                }}
                className={inputCls}
                placeholder="GB, IE, FR, DE"
              />
            </FormField>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Delivery fee (₦)">
              <NairaInput required value={form.feeKobo} onChange={(v) => set({ feeKobo: v ?? 0 })} />
            </FormField>
            <FormField label="Free over (₦, optional)">
              <NairaInput value={form.freeAboveKobo} onChange={(freeAboveKobo) => set({ freeAboveKobo })} />
            </FormField>
            <FormField label="Fee for USD shoppers" hint="Blank converts the naira fee.">
              <NairaInput symbol="$" placeholder="Auto" value={form.feeUsdCents} onChange={(feeUsdCents) => set({ feeUsdCents })} />
            </FormField>
            <FormField label="Free over ($, optional)" hint="Blank converts the naira threshold.">
              <NairaInput symbol="$" placeholder="Auto" value={form.freeAboveUsdCents} onChange={(freeAboveUsdCents) => set({ freeAboveUsdCents })} />
            </FormField>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Earliest (days)">
              <input type="number" min={0} max={60} value={form.estimatedMinDays} onChange={(e) => set({ estimatedMinDays: Number(e.target.value) })} className={inputCls} />
            </FormField>
            <FormField label="Latest (days)">
              <input type="number" min={0} max={60} value={form.estimatedMaxDays} onChange={(e) => set({ estimatedMaxDays: Number(e.target.value) })} className={inputCls} />
            </FormField>
            <FormField label="Order">
              <input type="number" min={0} value={form.position} onChange={(e) => set({ position: Number(e.target.value) })} className={inputCls} />
            </FormField>
          </div>
          {domestic && (
            <Toggle checked={form.allowPayOnDelivery} onChange={(allowPayOnDelivery) => set({ allowPayOnDelivery })} label="Allow pay on delivery" />
          )}
          <Toggle checked={form.isActive} onChange={(isActive) => set({ isActive })} label="Zone is on" />
        </CrudDialog>
      )}
    </>
  )
}
