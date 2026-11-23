import type { Metadata } from "next"
import { PaymentCallback } from "@/components/store/payment-callback"

export const metadata: Metadata = { title: "Confirming payment", robots: { index: false } }

// Paystack sends ?reference=…&trxref=… after payment.
export default async function CallbackPage(props: {
  searchParams: Promise<{ reference?: string; trxref?: string }>
}) {
  const params = await props.searchParams
  return <PaymentCallback reference={params.reference ?? params.trxref} />
}
