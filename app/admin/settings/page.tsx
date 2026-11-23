"use client"

import * as React from "react"
import { toast } from "sonner"
import { refreshStorefront } from "@/app/admin/actions"
import { SingleImageField } from "@/components/admin/image-upload"
import { ErrorState, FormField, Loading, PageHeader, Panel, Toggle, btnPrimary, inputCls, useAdminQuery } from "@/components/admin/ui"
import { api, errorMessage } from "@/lib/api"
import type { StoreSettings, StoreTheme } from "@/lib/types"
import { cn } from "@/lib/utils"

const PALETTES: { label: string; theme: Partial<StoreTheme> }[] = [
  { label: "ELO", theme: { primary: "#2B2A26", primaryForeground: "#F7F4EF", background: "#F7F4EF", foreground: "#2B2A26", muted: "#ECE7DF", accent: "#8C8A3A" } },
  { label: "Lilac", theme: { primary: "#2B2A26", primaryForeground: "#F7F4EF", background: "#F7F4EF", foreground: "#2B2A26", muted: "#EDE5F7", accent: "#9B7FD1" } },
  { label: "Paper", theme: { primary: "#2B2A26", primaryForeground: "#FFFFFF", background: "#FFFFFF", foreground: "#2B2A26", muted: "#F3F0EA", accent: "#8C8A3A" } },
]

const COLOR_FIELDS: { key: keyof StoreTheme; label: string; hint?: string }[] = [
  { key: "primary", label: "Main brand colour", hint: "Buttons, badges, header bar" },
  { key: "primaryForeground", label: "Text on brand colour" },
  { key: "accent", label: "Accent", hint: "Sale prices, highlights" },
  { key: "background", label: "Background" },
  { key: "foreground", label: "Text" },
  { key: "muted", label: "Soft panels" },
]

type TextKey = {
  [K in keyof StoreSettings]: StoreSettings[K] extends string | null ? K : never
}[keyof StoreSettings]

export default function SettingsPage() {
  const { data, error, loading, reload } = useAdminQuery<StoreSettings>("/store")
  const [form, setForm] = React.useState<StoreSettings | null>(null)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- seed form from fetched settings
    if (data) setForm(data)
  }, [data])

  if (loading && !form) return <Loading />
  if (error || !form) return <ErrorState message={error ?? "Could not load"} onRetry={reload} />

  const set = (patch: Partial<StoreSettings>) => setForm((f) => (f ? { ...f, ...patch } : f))
  const setTheme = (patch: Partial<StoreTheme>) => setForm((f) => (f ? { ...f, theme: { ...f.theme, ...patch } } : f))

  const text = (key: TextKey, label: string, props: { placeholder?: string; hint?: string; multiline?: boolean; rows?: number } = {}) => (
    <FormField label={label} hint={props.hint}>
      {props.multiline ? (
        <textarea
          value={(form[key] as string | null) ?? ""}
          onChange={(e) => set({ [key]: e.target.value } as Partial<StoreSettings>)}
          rows={props.rows ?? 4}
          placeholder={props.placeholder}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
        />
      ) : (
        <input
          value={(form[key] as string | null) ?? ""}
          onChange={(e) => set({ [key]: e.target.value } as Partial<StoreSettings>)}
          placeholder={props.placeholder}
          className={inputCls}
        />
      )}
    </FormField>
  )

  const save = async () => {
    setSaving(true)
    // id/updatedAt are server-owned; the API rejects unknown fields.
    const { id, ...rest } = form as StoreSettings & { updatedAt?: string }
    void id
    delete (rest as { updatedAt?: string }).updatedAt
    const whatsapp = rest.whatsappNumber?.replace(/\D/g, "") ?? ""
    try {
      const saved = await api.patch<StoreSettings>("/admin/settings", {
        ...rest,
        whatsappNumber: whatsapp ? (whatsapp.startsWith("0") ? `234${whatsapp.slice(1)}` : whatsapp) : "",
      })
      await refreshStorefront()
      setForm({ ...form, ...saved, theme: { ...form.theme, ...(saved.theme ?? {}) } })
      toast.success("Store updated")
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const t = form.theme

  return (
    <div className="pb-24">
      <PageHeader title="Store settings" description="Your brand, look and store details. Changes go live as soon as you save." />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <Panel title="Brand">
            <div className="space-y-4">
              {text("name", "Store name")}
              {text("tagline", "Tagline", { placeholder: "Softly worn. Everyday ease." })}
              <FormField label="Logo" hint="PNG or SVG with a transparent background works best. Leave empty to show the store name.">
                <SingleImageField folder="branding" value={form.logoUrl} onChange={(logoUrl) => set({ logoUrl })} aspect="aspect-[3/1]" />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Favicon" hint="Square, at least 64px.">
                  <SingleImageField folder="branding" value={form.faviconUrl} onChange={(faviconUrl) => set({ faviconUrl })} aspect="aspect-square" />
                </FormField>
                <FormField label="Share image" hint="Shown when the link is shared. 1200×630.">
                  <SingleImageField folder="branding" value={form.ogImageUrl} onChange={(ogImageUrl) => set({ ogImageUrl })} />
                </FormField>
              </div>
            </div>
          </Panel>

          <Panel title="Look & feel">
            <div className="space-y-5">
              <div className="space-y-2">
                <span className="text-sm font-medium">Colour presets</span>
                <div className="flex flex-wrap gap-2">
                  {PALETTES.map((p) => (
                    <button key={p.label} type="button" onClick={() => setTheme(p.theme)} className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs hover:border-foreground">
                      <span className="flex">
                        {[p.theme.primary, p.theme.accent, p.theme.muted].map((c, i) => (
                          <span key={i} className="-ml-1 size-4 rounded-full border border-white first:ml-0" style={{ background: c }} />
                        ))}
                      </span>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {COLOR_FIELDS.map(({ key, label, hint }) => (
                  <FormField key={key} label={label} hint={hint}>
                    <div className="flex gap-2">
                      <input type="color" value={t[key]} onChange={(e) => setTheme({ [key]: e.target.value.toUpperCase() })} className="h-10 w-12 shrink-0 cursor-pointer rounded-md border bg-background p-1" />
                      <input
                        value={t[key]}
                        onChange={(e) => setTheme({ [key]: e.target.value })}
                        pattern="#[0-9A-Fa-f]{6}"
                        className={cn(inputCls, "font-mono uppercase")}
                      />
                    </div>
                  </FormField>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Typography is part of the ELO identity (Cormorant Garamond with Outfit) and stays fixed.
              </p>
              <FormField label="Corner style">
                <div className="flex gap-2">
                  {[
                    { label: "Sharp", value: "0rem" },
                    { label: "Soft", value: "0.5rem" },
                    { label: "Round", value: "1rem" },
                  ].map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setTheme({ radius: r.value })}
                      className={cn("flex-1 border px-3 py-2 text-sm", t.radius === r.value ? "border-foreground bg-foreground text-background" : "hover:border-foreground")}
                      style={{ borderRadius: r.value }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </FormField>
            </div>
          </Panel>

          <Panel title="Home page">
            <div className="space-y-4">
              {text("announcement", "Announcement bar", { placeholder: "Complimentary gift wrapping on every order", hint: "Leave empty to hide." })}
              {text("heroEyebrow", "Hero small text", { placeholder: "New collection" })}
              {text("heroTitle", "Hero headline", { placeholder: "Made for the moments that matter" })}
              {text("heroSubtitle", "Hero subtext", { multiline: true, rows: 2 })}
              <div className="grid gap-4 sm:grid-cols-2">
                {text("heroCtaLabel", "Button text", { placeholder: "Shop now" })}
                {text("heroCtaHref", "Button link", { placeholder: "/shop" })}
              </div>
              <FormField label="Hero image" hint="Wide photo, at least 1600px. Defaults to your newest product.">
                <SingleImageField folder="branding" value={form.heroImageUrl} onChange={(heroImageUrl) => set({ heroImageUrl })} />
              </FormField>
            </div>
          </Panel>

          <Panel title="Policies">
            <div className="space-y-4">
              {text("shippingPolicy", "Delivery policy", { multiline: true, rows: 5 })}
              {text("returnsPolicy", "Returns & exchanges", { multiline: true, rows: 5 })}
              {text("privacyPolicy", "Privacy policy", { multiline: true, rows: 5 })}
              {text("termsOfService", "Terms of service", { multiline: true, rows: 5 })}
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Contact">
            <div className="space-y-4">
              {text("whatsappNumber", "WhatsApp number", { placeholder: "0801 234 5678", hint: "Adds a chat button across the store." })}
              {text("contactPhone", "Phone")}
              {text("contactEmail", "Email")}
              {text("address", "Address / showroom", { multiline: true, rows: 2 })}
            </div>
          </Panel>
          <Panel title="Social">
            <div className="space-y-4">
              {text("instagram", "Instagram", { placeholder: "@yourbrand" })}
              {text("tiktok", "TikTok", { placeholder: "@yourbrand" })}
              {text("facebook", "Facebook")}
              {text("twitter", "X (Twitter)")}
            </div>
          </Panel>
          <Panel title="Currency">
            <div className="space-y-4">
              <Toggle
                checked={form.enableUsd}
                onChange={(enableUsd) => set({ enableUsd })}
                label="Sell in US dollars"
                description="Adds a ₦ / $ switch. Shoppers outside Nigeria see dollars first. USD must also be enabled on your Paystack account."
              />
              <FormField
                label="Naira per dollar"
                hint={`Used for products and fees without their own dollar price. Converted prices round up to the next whole dollar, e.g. ₦58,000 → $${Math.ceil(58000 / Math.max(form.ngnPerUsd || 1, 1))}.`}
              >
                <input
                  type="number"
                  min={100}
                  max={100000}
                  value={form.ngnPerUsd}
                  onChange={(e) => set({ ngnPerUsd: Number(e.target.value) })}
                  className={inputCls}
                />
              </FormField>
            </div>
          </Panel>
          <Panel title="Checkout">
            <Toggle
              checked={form.enablePayOnDelivery}
              onChange={(enablePayOnDelivery) => set({ enablePayOnDelivery })}
              label="Pay on delivery"
              description="Nigeria and naira orders only. Each delivery zone can also turn it off."
            />
          </Panel>
          <Panel title="Search & sharing">
            <div className="space-y-4">
              {text("metaTitle", "Page title", { hint: "Defaults to the store name." })}
              {text("metaDescription", "Description", { multiline: true, rows: 3, hint: "About 150 characters, shown on Google." })}
            </div>
          </Panel>
          <div className="overflow-hidden rounded-lg border" style={{ background: t.background, color: t.foreground, borderRadius: t.radius }}>
            <div className="p-4">
              <p className="text-xs opacity-70">Preview</p>
              <p className="font-heading text-2xl">{form.name}</p>
              <p className="text-sm">
                Softie Slip Dress · <span style={{ color: t.accent }}>₦58,000</span>
              </p>
              <span className="mt-3 inline-block px-4 py-2 text-xs tracking-[0.18em] uppercase" style={{ background: t.primary, color: t.primaryForeground, borderRadius: t.radius }}>
                Add to bag
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 px-4 py-3 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-6xl justify-end">
          <button disabled={saving} onClick={save} className={btnPrimary}>{saving ? "Saving…" : "Save changes"}</button>
        </div>
      </div>
    </div>
  )
}
