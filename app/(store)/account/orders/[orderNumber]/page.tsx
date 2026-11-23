import type { Metadata } from "next"
import { AccountOrder } from "@/components/store/account-order"

export const metadata: Metadata = { title: "Order", robots: { index: false } }

export default async function AccountOrderPage(props: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await props.params
  return <AccountOrder orderNumber={orderNumber} />
}
