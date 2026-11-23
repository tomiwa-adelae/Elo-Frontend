import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ProductListing, toQuery } from "@/components/store/product-listing"
import type { ListingParams } from "@/components/store/product-listing"
import { serverGet, serverGetOrNull } from "@/lib/api-server"
import type { CategoryNode, Collection, Filters, ProductList } from "@/lib/types"

type CollectionResponse = ProductList & { collection: Collection }

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await props.params
  const data = await serverGetOrNull<CollectionResponse>(`/catalog/collections/${slug}`)
  return {
    title: data?.collection.name ?? "Collection",
    description: data?.collection.description ?? undefined,
  }
}

export default async function CollectionPage(props: {
  params: Promise<{ slug: string }>
  searchParams: Promise<ListingParams>
}) {
  const [{ slug }, params] = await Promise.all([props.params, props.searchParams])
  const qs = toQuery(params, { limit: "24" })

  const data = await serverGetOrNull<CollectionResponse>(
    `/catalog/collections/${encodeURIComponent(slug)}?${qs}`,
    { revalidate: 30 }
  )
  if (!data) notFound()

  const [filters, categories] = await Promise.all([
    serverGet<Filters>(`/catalog/filters?${toQuery(params, { collection: slug })}`, { revalidate: 30 }),
    serverGet<CategoryNode[]>("/catalog/categories"),
  ])

  return (
    <ProductListing
      eyebrow="Collection"
      title={data.collection.name}
      description={data.collection.description}
      list={data}
      filters={filters}
      categories={categories}
      params={params}
      basePath={`/collections/${slug}`}
    />
  )
}
