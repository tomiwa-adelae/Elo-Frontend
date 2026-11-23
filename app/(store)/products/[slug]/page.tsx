import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ProductGrid } from "@/components/store/product-card"
import { ProductView } from "@/components/store/product-view"
import { getStoreSettings, serverGet, serverGetOrNull } from "@/lib/api-server"
import type { ProductDetail, ProductList } from "@/lib/types"

const getProduct = (slug: string) =>
  serverGetOrNull<ProductDetail>(
    `/catalog/products/${encodeURIComponent(slug)}`,
    { revalidate: 30 }
  )

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await props.params
  const product = await getProduct(slug)
  if (!product) return { title: "Not found" }
  const description = product.description?.slice(0, 160) ?? undefined
  return {
    title: product.title,
    description,
    openGraph: {
      title: product.title,
      description,
      images: product.images[0]?.url,
    },
  }
}

export default async function ProductPage(props: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ colour?: string | string[] }>
}) {
  const [{ slug }, search] = await Promise.all([props.params, props.searchParams])
  const [product, store] = await Promise.all([getProduct(slug), getStoreSettings()])
  if (!product) notFound()

  const colour = typeof search.colour === "string" ? search.colour : null

  // "Complete the set": the rest of the Softies, falling back to anything.
  const related =
    (await serverGet<ProductList>(`/catalog/products?collection=the-softies&sort=price_asc&limit=8`).catch(() => null)) ??
    (await serverGet<ProductList>(`/catalog/products?limit=8`).catch(() => null))
  const others = related?.items.filter((p) => p.id !== product.id).slice(0, 4) ?? []

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: product.images.map((i) => i.url),
    description: product.description ?? undefined,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    offers: [
      {
        "@type": "AggregateOffer",
        priceCurrency: "NGN",
        lowPrice: product.minPriceKobo / 100,
        highPrice: product.maxPriceKobo / 100,
        availability: product.inStock
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      },
      ...(store.enableUsd
        ? [
            {
              "@type": "AggregateOffer",
              priceCurrency: "USD",
              lowPrice: product.minPriceUsdCents / 100,
              highPrice: product.maxPriceUsdCents / 100,
              availability: product.inStock
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            },
          ]
        : []),
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <ProductView
        key={colour ?? "all"}
        product={product}
        whatsappNumber={store.whatsappNumber}
        initialColour={colour}
      />
      {others.length > 0 && (
        <section className="container-page py-20 max-md:py-14">
          <div className="mb-10">
            <span className="eyebrow">Made to be worn together</span>
            <h2 className="mt-2 text-[clamp(34px,4vw,52px)] leading-none">Complete the set</h2>
          </div>
          <ProductGrid products={others} />
        </section>
      )}
    </>
  )
}
