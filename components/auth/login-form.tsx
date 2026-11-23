"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/components/providers/auth-provider"
import { AuthField, AuthShell, authButton, safeNext } from "@/components/auth/auth-shell"
import { errorMessage } from "@/lib/api"

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [busy, setBusy] = React.useState(false)

  return (
    <AuthShell
      title="Sign in"
      subtitle={
        <>
          New here?{" "}
          <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-foreground underline">
            Create an account
          </Link>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault()
          setBusy(true)
          try {
            const user = await login(email.trim(), password)
            router.replace(safeNext(next, user.role === "ADMIN" ? "/admin" : "/account"))
            router.refresh()
          } catch (error) {
            toast.error(errorMessage(error) === "Unauthorized" ? "Wrong email or password" : errorMessage(error))
            setBusy(false)
          }
        }}
      >
        <AuthField label="Email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <AuthField label="Password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="text-right">
          <Link href="/forgot-password" className="text-sm text-muted-foreground underline">
            Forgot password?
          </Link>
        </div>
        <button disabled={busy} className={authButton}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : "Sign in"}
        </button>
      </form>
      <p className="text-center text-xs text-muted-foreground">
        You can also check out as a guest. <Link href="/orders/lookup" className="underline">Track an order</Link>
      </p>
    </AuthShell>
  )
}
