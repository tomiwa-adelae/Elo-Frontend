"use client"

import { useRouter } from "next/navigation"
import * as React from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { AuthField, AuthShell, authButton } from "@/components/auth/auth-shell"
import { api, errorMessage } from "@/lib/api"

export function ForgotPasswordForm() {
  const router = useRouter()
  const [step, setStep] = React.useState<"email" | "reset">("email")
  const [email, setEmail] = React.useState("")
  const [otp, setOtp] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [confirm, setConfirm] = React.useState("")
  const [busy, setBusy] = React.useState(false)

  const run = async (action: () => Promise<void>) => {
    setBusy(true)
    try {
      await action()
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  if (step === "email") {
    return (
      <AuthShell title="Reset your password" subtitle="We'll email you a reset code.">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            void run(async () => {
              await api.post("/auth/forgot-password", { email: email.trim() })
              toast.success("If that account exists, a code is on its way")
              setStep("reset")
            })
          }}
        >
          <AuthField label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <button disabled={busy} className={authButton}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : "Send code"}
          </button>
        </form>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Choose a new password" subtitle={`Enter the code sent to ${email}.`}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (password !== confirm) return toast.error("Passwords do not match")
          void run(async () => {
            await api.post("/auth/set-new-password", {
              email: email.trim(),
              otp: otp.trim(),
              newPassword: password,
              confirmPassword: confirm,
            })
            toast.success("Password updated. Please sign in.")
            router.push("/login")
          })
        }}
      >
        <AuthField label="Code" required inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={(e) => setOtp(e.target.value)} />
        <AuthField label="New password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <AuthField label="Confirm password" type="password" required minLength={8} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <button disabled={busy} className={authButton}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : "Update password"}
        </button>
      </form>
    </AuthShell>
  )
}
