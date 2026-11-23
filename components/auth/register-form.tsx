"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { AuthField, AuthShell, authButton } from "@/components/auth/auth-shell"
import { api, errorMessage } from "@/lib/api"

export function RegisterForm({ next }: { next?: string }) {
  const router = useRouter()
  const [form, setForm] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
    acceptsMarketing: false,
  })
  const [busy, setBusy] = React.useState(false)
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }))

  return (
    <AuthShell
      title="Create an account"
      subtitle={
        <>
          Already have one? <Link href="/login" className="text-foreground underline">Sign in</Link>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault()
          if (form.password !== form.confirmPassword) {
            toast.error("Passwords do not match")
            return
          }
          setBusy(true)
          try {
            await api.post("/auth/register", {
              ...form,
              email: form.email.trim(),
              phoneNumber: form.phoneNumber.trim() || undefined,
            })
            toast.success("Check your email for a verification code")
            const qs = new URLSearchParams({ email: form.email.trim() })
            if (next) qs.set("next", next)
            router.push(`/verify-email?${qs}`)
          } catch (error) {
            toast.error(errorMessage(error))
            setBusy(false)
          }
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <AuthField label="First name" required minLength={2} autoComplete="given-name" value={form.firstName} onChange={set("firstName")} />
          <AuthField label="Last name" required minLength={2} autoComplete="family-name" value={form.lastName} onChange={set("lastName")} />
        </div>
        <AuthField label="Email" type="email" required autoComplete="email" value={form.email} onChange={set("email")} />
        <AuthField label="Phone (optional)" type="tel" autoComplete="tel" value={form.phoneNumber} onChange={set("phoneNumber")} />
        <AuthField label="Password" type="password" required minLength={8} autoComplete="new-password" value={form.password} onChange={set("password")} />
        <AuthField label="Confirm password" type="password" required minLength={8} autoComplete="new-password" value={form.confirmPassword} onChange={set("confirmPassword")} />
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" required checked={form.acceptTerms} onChange={set("acceptTerms")} className="mt-0.5 size-4 accent-[var(--primary)]" />
          <span>
            I agree to the <Link href="/policies/terms" className="underline">terms</Link> and{" "}
            <Link href="/policies/privacy" className="underline">privacy policy</Link>.
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={form.acceptsMarketing} onChange={set("acceptsMarketing")} className="mt-0.5 size-4 accent-[var(--primary)]" />
          Email me about new arrivals and offers.
        </label>
        <button disabled={busy} className={authButton}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : "Create account"}
        </button>
      </form>
    </AuthShell>
  )
}
