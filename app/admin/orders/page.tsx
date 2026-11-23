import { OrdersList } from "@/components/admin/orders-list"

export const metadata = { title: "Orders" }

export default async function AdminOrdersPage(props: {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>
}) {
  const { status, search, page } = await props.searchParams
  return <OrdersList key={`${status}-${search}-${page}`} status={status} search={search} page={Math.max(1, Number(page) || 1)} />
}
