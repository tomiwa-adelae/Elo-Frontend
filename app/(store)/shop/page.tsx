import type { Metadata } from "next"
import { ProductListing, toQuery } from "@/components/store/product-listing"
import type { ListingParams } from "@/components/store/product-listing"
import { serverGet } from "@/lib/api-server"
import type { CategoryNode, Filters, ProductList } from "@/lib/types"

export const metadata: Metadata = { title: "Shop" }

function findCategory(nodes: CategoryNode[], slug?: string): CategoryNode | undefined {
  if (!slug) return undefined
  for (const node of nodes) {
    if (node.slug === slug) return node
    const child = findCategory(node.children, slug)
    if (child) return child
  }
}

export default async function ShopPage(props: { searchParams: Promise<ListingParams> }) {
  const params = await props.searchParams
  const qs = toQuery(params, { limit: "24" })

  const [list, filters, categories] = await Promise.all([
    serverGet<ProductList>(`/catalog/products?${qs}`, { revalidate: 30 }),
    serverGet<Filters>(`/catalog/filters?${qs}`, { revalidate: 30 }),
    serverGet<CategoryNode[]>("/catalog/categories"),
  ])

  const category = findCategory(categories, params.category as string | undefined)
  const title = params.search
    ? `Results for “${params.search}”`
    : params.onSale === "true"
      ? "Sale"
      : (category?.name ?? (params.colour ? `In ${params.colour}` : "Shop all"))
  const description = params.search
    ? null
    : params.colour
      ? "One colour, every piece. Mix it with the others, or wear it head to toe."
      : "Slips, sets and robes cut from buttery modal. Made to be lived in, gift-wrapped by hand."

  return (
    <ProductListing
      title={title}
      description={description}
      list={list}
      filters={filters}
      categories={categories}
      params={params}
      basePath="/shop"
    />
  )
}
