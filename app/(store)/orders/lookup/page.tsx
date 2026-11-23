import type { Metadata } from "next"
import { OrderLookup } from "@/components/store/order-lookup"

export const metadata: Metadata = { title: "Track your order", robots: { index: false } }

export default async function OrderLookupPage(props: {
  searchParams: Promise<{ order?: string; email?: string }>
}) {
  const { order, email } = await props.searchParams
  return (
    <div className="container-page max-w-5xl py-10">
      <OrderLookup key={`${order}-${email}`} order={order} email={email} />
    </div>
  )
}
