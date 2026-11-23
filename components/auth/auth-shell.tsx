import * as React from "react"

export const authInput =
  "h-11 w-full rounded-md border bg-background px-3 text-sm outline-none focus:border-foreground"

export const authButton =
  "flex h-11 w-full items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="container-page flex justify-center py-16">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  )
}

export function AuthField({
  label,
  ...props
}: { label: string } & React.ComponentProps<"input">) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      <input {...props} className={authInput} />
    </label>
  )
}

/** Only allow same-site relative redirects after sign-in. */
export function safeNext(next: string | null | undefined, fallback = "/account") {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback
}
