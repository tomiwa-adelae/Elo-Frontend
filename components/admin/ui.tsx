"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { api, errorMessage } from "@/lib/api"
import { STATUS_LABEL } from "@/lib/format"
import { cn } from "@/lib/utils"

/** GET a path; returns data, loading/error state and a reload function. */
export function useAdminQuery<T>(path: string | null) {
  const [data, setData] = React.useState<T | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)

  const load = React.useCallback(async () => {
    if (!path) return
    setLoading(true)
    try {
      setData(await api.get<T>(path))
      setError(null)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [path])

  React.useEffect(() => {
    // Fetch-on-mount: setLoading runs before the request, which is intended.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  return { data, error, loading, reload: load, setData }
}

/** Runs a mutation with a toast on failure; returns whether it succeeded. */
export async function runAction(action: () => Promise<unknown>, success?: string) {
  try {
    await action()
    if (success) toast.success(success)
    return true
  } catch (e) {
    toast.error(errorMessage(e))
    return false
  }
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-sans text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Panel({
  title,
  children,
  className,
  actions,
}: {
  title?: string
  children: React.ReactNode
  className?: string
  actions?: React.ReactNode
}) {
  return (
    <section className={cn("rounded-lg border bg-background", className)}>
      {title && (
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <h2 className="font-sans text-sm font-semibold">{title}</h2>
          {actions}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  )
}

export function Loading() {
  return (
    <div className="flex justify-center py-20">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-lg border border-dashed p-10 text-center text-sm">
      <p className="text-destructive">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 underline">
          Try again
        </button>
      )}
    </div>
  )
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
      {children}
    </div>
  )
}

const TONE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-900",
  UNPAID: "bg-amber-100 text-amber-900",
  AWAITING_DELIVERY_PAYMENT: "bg-sky-100 text-sky-900",
  CONFIRMED: "bg-sky-100 text-sky-900",
  PROCESSING: "bg-indigo-100 text-indigo-900",
  SHIPPED: "bg-violet-100 text-violet-900",
  DELIVERED: "bg-emerald-100 text-emerald-900",
  PAID: "bg-emerald-100 text-emerald-900",
  ACTIVE: "bg-emerald-100 text-emerald-900",
  DRAFT: "bg-zinc-100 text-zinc-800",
  ARCHIVED: "bg-zinc-100 text-zinc-600",
  CANCELLED: "bg-zinc-100 text-zinc-600",
  REFUNDED: "bg-zinc-100 text-zinc-600",
  PARTIALLY_REFUNDED: "bg-zinc-100 text-zinc-600",
  FAILED: "bg-red-100 text-red-900",
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap", TONE[status] ?? "bg-muted")}>
      {label ?? STATUS_LABEL[status] ?? status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  )
}

export const inputCls =
  "h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:border-foreground disabled:opacity-60"

export const btnPrimary =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"

export const btnOutline =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md border bg-background px-4 text-sm transition hover:border-foreground disabled:opacity-50"

export const btnDanger =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-destructive/30 px-4 text-sm text-destructive transition hover:bg-destructive/5 disabled:opacity-50"

export function FormField({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </label>
  )
}

/** Naira input that stores kobo. Empty → null. */
export function NairaInput({
  value,
  onChange,
  placeholder,
  required,
  symbol = "₦",
}: {
  value: number | null | undefined
  onChange: (kobo: number | null) => void
  placeholder?: string
  required?: boolean
  /** Currency symbol shown in the field; amounts are always minor units. */
  symbol?: string
}) {
  const [text, setText] = React.useState(value == null ? "" : String(value / 100))
  // Follow outside changes (e.g. "apply to all") without clobbering typing.
  const parsed = text === "" ? null : Math.round(Number(text.replace(/,/g, "")) * 100)
  if (parsed !== (value ?? null) && !(Number.isNaN(parsed) && value == null)) {
    setText(value == null ? "" : String(value / 100))
  }

  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">{symbol}</span>
      <input
        inputMode="decimal"
        required={required}
        placeholder={placeholder}
        value={text}
        onChange={(e) => {
          const next = e.target.value.replace(/[^\d.,]/g, "")
          setText(next)
          const n = Number(next.replace(/,/g, ""))
          onChange(next === "" || Number.isNaN(n) ? null : Math.round(n * 100))
        }}
        className={cn(inputCls, "pl-7")}
      />
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {description && <span className="block text-xs text-muted-foreground">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("relative h-6 w-11 shrink-0 rounded-full transition", checked ? "bg-primary" : "bg-input")}
      >
        <span className={cn("absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition", checked && "translate-x-5")} />
      </button>
    </label>
  )
}

export function Pager({
  page,
  totalPages,
  onPage,
}: {
  page: number
  totalPages: number
  onPage: (p: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-end gap-2 pt-4 text-sm">
      <button disabled={page <= 1} onClick={() => onPage(page - 1)} className={cn(btnOutline, "h-8 px-3")}>
        Previous
      </button>
      <span className="text-muted-foreground">
        {page} / {totalPages}
      </span>
      <button disabled={page >= totalPages} onClick={() => onPage(page + 1)} className={cn(btnOutline, "h-8 px-3")}>
        Next
      </button>
    </div>
  )
}
