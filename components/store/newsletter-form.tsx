"use client"

import * as React from "react"
import { toast } from "sonner"
import { api, errorMessage } from "@/lib/api"
import { cn } from "@/lib/utils"

/** "Join the Softies": underline input + text button, as in the concept. */
export function NewsletterForm({
  source = "footer",
  tone = "light",
  className,
}: {
  source?: string
  tone?: "light" | "dark"
  className?: string
}) {
  const [email, setEmail] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [done, setDone] = React.useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!email.trim()) return
    setBusy(true)
    try {
      await api.post("/newsletter", { email, source })
      setDone(true)
      setEmail("")
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <p className={cn("font-heading text-2xl italic", className)}>
        You&apos;re on the list. Welcome to the Softies.
      </p>
    )
  }

  return (
    <form
      onSubmit={submit}
      className={cn(
        "flex w-full max-w-[480px] border-b",
        tone === "dark" ? "border-background/60" : "border-foreground",
        className
      )}
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email address"
        aria-label="Email address"
        className={cn(
          "min-w-0 flex-1 bg-transparent px-1 py-3.5 text-[15px] outline-none",
          tone === "dark" && "placeholder:text-background/50"
        )}
      />
      <button
        type="submit"
        disabled={busy}
        className="px-1.5 text-[12px] tracking-[0.22em] uppercase disabled:opacity-50"
      >
        {busy ? "Joining…" : "Subscribe →"}
      </button>
    </form>
  )
}
