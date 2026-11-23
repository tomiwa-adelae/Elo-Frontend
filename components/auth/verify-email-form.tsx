"use client"

import { useRouter } from "next/navigation"
import * as React from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { AuthField, AuthShell, authButton } from "@/components/auth/auth-shell"
import { api, errorMessage } from "@/lib/api"

export function VerifyEmailForm({ email: initialEmail, next }: { email?: string; next?: string }) {
  const router = useRouter()
  const [email, setEmail] = React.useState(initialEmail ?? "")
  const [otp, setOtp] = React.useState("")
  const [busy, setBusy] = React.useState(false)

  return (
    <AuthShell title="Verify your email" subtitle="Enter the code we sent to your inbox.">
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault()
          setBusy(true)
          try {
            await api.post("/auth/verify-email", { email: email.trim(), otp: otp.trim() })
            toast.success("Email verified. Please sign in.")
            router.push(`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`)
          } catch (error) {
            toast.error(errorMessage(error))
            setBusy(false)
          }
        }}
      >
        <AuthField label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <AuthField label="Code" required inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={(e) => setOtp(e.target.value)} />
        <button disabled={busy} className={authButton}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : "Verify"}
        </button>
        <button
          type="button"
          className="w-full text-sm text-muted-foreground underline"
          onClick={async () => {
            if (!email) return toast.error("Enter your email first")
            try {
              await api.post("/auth/resend-email-verification", { email: email.trim() })
              toast.success("If that account exists, a new code is on its way")
            } catch (error) {
              toast.error(errorMessage(error))
            }
          }}
        >
          Send a new code
        </button>
      </form>
    </AuthShell>
  )
}
