import { ProductsList } from "@/components/admin/products-list"

export const metadata = { title: "Products" }

export default async function AdminProductsPage(props: {
  searchParams: Promise<{ search?: string; status?: string; lowStock?: string; page?: string }>
}) {
  const { search, status, lowStock, page } = await props.searchParams
  return (
    <ProductsList
      key={`${search}-${status}-${lowStock}-${page}`}
      search={search}
      status={status}
      lowStock={lowStock === "true"}
      page={Math.max(1, Number(page) || 1)}
    />
  )
}
