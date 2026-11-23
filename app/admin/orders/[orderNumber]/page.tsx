import { OrderDetail } from "@/components/admin/order-detail"

export const metadata = { title: "Order" }

export default async function AdminOrderPage(props: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await props.params
  return <OrderDetail orderNumber={orderNumber} />
}
