"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import { Loader2 } from "lucide-react"
import { useCart } from "@/components/providers/cart-provider"
import { api, errorMessage } from "@/lib/api"

interface VerifyResult {
  status: "PENDING" | "SUCCESS" | "FAILED" | "ABANDONED" | string
  order: { orderNumber: string; status: string }
}

export function PaymentCallback({ reference }: { reference: string | undefined }) {
  const router = useRouter()
  const { refresh } = useCart()
  const [state, setState] = React.useState<"checking" | "failed" | "pending" | "error">(reference ? "checking" : "error")
  const [message, setMessage] = React.useState(reference ? "" : "Missing payment reference.")
  const [orderNumber, setOrderNumber] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!reference) return
    let attempts = 0
    let timer: ReturnType<typeof setTimeout>

    const check = async () => {
      attempts++
      try {
        const result = await api.get<VerifyResult | null>(`/checkout/verify?reference=${encodeURIComponent(reference)}`)
        if (!result) throw new Error("We couldn't find that payment.")
        setOrderNumber(result.order.orderNumber)
        if (result.status === "SUCCESS") {
          await refresh()
          let email = ""
          try {
            email = sessionStorage.getItem("checkout:email") ?? ""
          } catch {
            // storage unavailable
          }
          router.replace(
            email
              ? `/checkout/success?order=${encodeURIComponent(result.order.orderNumber)}&email=${encodeURIComponent(email)}`
              : `/orders/lookup?order=${encodeURIComponent(result.order.orderNumber)}`
          )
          return
        }
        if (result.status === "FAILED" || result.status === "ABANDONED") {
          setState("failed")
          return
        }
        // Transfers can take a little while to land.
        if (attempts < 6) timer = setTimeout(check, 4000)
        else setState("pending")
      } catch (error) {
        setState("error")
        setMessage(errorMessage(error))
      }
    }
    void check()
    return () => clearTimeout(timer)
  }, [reference, refresh, router])

  return (
    <div className="container-page max-w-lg py-24 text-center">
      {state === "checking" && (
        <>
          <Loader2 className="mx-auto size-8 animate-spin text-muted-foreground" />
          <p className="mt-4 text-lg">Confirming your payment…</p>
          <p className="text-sm text-muted-foreground">Please don&apos;t close this page.</p>
        </>
      )}
      {state === "failed" && (
        <>
          <h1 className="text-2xl font-semibold">Payment didn&apos;t go through</h1>
          <p className="mt-2 text-muted-foreground">
            You haven&apos;t been charged. Your bag is saved, so you can try again.
          </p>
          <Link href="/checkout" className="mt-8 inline-flex h-11 items-center rounded-md bg-primary px-6 text-sm text-primary-foreground">
            Try again
          </Link>
        </>
      )}
      {state === "pending" && (
        <>
          <h1 className="text-2xl font-semibold">Payment still processing</h1>
          <p className="mt-2 text-muted-foreground">
            Bank transfers can take a few minutes. We&apos;ll email you as soon as it&apos;s confirmed
            {orderNumber ? ` (order ${orderNumber})` : ""}.
          </p>
          <Link href="/orders/lookup" className="mt-8 inline-block text-sm underline">
            Track your order
          </Link>
        </>
      )}
      {state === "error" && (
        <>
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="mt-2 text-muted-foreground">{message}</p>
        </>
      )}
    </div>
  )
}
