import Link from "next/link"
import { Suspense } from "react"
import { ProductGrid } from "@/components/store/product-card"
import {
  ActiveFilters,
  FilterSidebar,
  MobileFilterButton,
  SortSelect,
} from "@/components/store/listing-controls"
import type { CategoryNode, Filters, ProductList } from "@/lib/types"

export type ListingParams = Record<string, string | string[] | undefined>

const PASSTHROUGH = [
  "search",
  "category",
  "size",
  "colour",
  "minPriceKobo",
  "maxPriceKobo",
  "inStockOnly",
  "onSale",
  "sort",
  "page",
]

/** Turns the page's searchParams into the API's query string. */
export function toQuery(params: ListingParams, extra: Record<string, string> = {}) {
  const qs = new URLSearchParams()
  for (const key of PASSTHROUGH) {
    const value = params[key]
    if (Array.isArray(value)) value.forEach((v) => qs.append(key, v))
    else if (value) qs.set(key, value)
  }
  for (const [key, value] of Object.entries(extra)) qs.set(key, value)
  return qs
}

export function ProductListing({
  title,
  description,
  list,
  filters,
  categories,
  params,
  basePath,
  showCategories = true,
  eyebrow = "The ELO edit",
}: {
  eyebrow?: string
  title: string
  description?: string | null
  list: ProductList
  filters: Filters
  categories: CategoryNode[]
  params: ListingParams
  basePath: string
  showCategories?: boolean
}) {
  const { page, totalPages, total } = list.pagination

  const pageHref = (n: number) => {
    const qs = toQuery(params)
    qs.set("page", String(n))
    return `${basePath}?${qs.toString()}`
  }

  const controlProps = { filters, categories, showCategories }

  return (
    <div className="container-page py-12 lg:py-16">
      <div className="mb-12 border-b border-stone pb-10">
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="mt-3 text-[clamp(44px,6vw,76px)] leading-[0.95]">{title}</h1>
        {description && (
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="flex gap-10">
        <Suspense>
          <FilterSidebar {...controlProps} />
        </Suspense>

        <div className="min-w-0 flex-1 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Suspense>
                <MobileFilterButton {...controlProps} />
              </Suspense>
              <p className="text-[12px] tracking-[0.18em] text-muted-foreground uppercase">
                {total} {total === 1 ? "piece" : "pieces"}
              </p>
            </div>
            <Suspense>
              <SortSelect />
            </Suspense>
          </div>
          <Suspense>
            <ActiveFilters />
          </Suspense>

          {list.items.length ? (
            <ProductGrid
              products={list.items}
              colour={typeof params.colour === "string" ? params.colour : null}
            />
          ) : (
            <div className="border border-dashed border-stone py-24 text-center">
              <p className="font-heading text-3xl italic">Nothing here, yet.</p>
              <p className="mt-2 text-sm text-muted-foreground">Try fewer filters, or browse the full edit.</p>
              <Link href="/shop" className="btn-elo btn-ghost mt-6">Shop all</Link>
            </div>
          )}

          {totalPages > 1 && (
            <nav className="flex items-center justify-center gap-2 pt-6" aria-label="Pages">
              {page > 1 && (
                <Link href={pageHref(page - 1)} className="btn-elo btn-ghost">
                  Previous
                </Link>
              )}
              <span className="px-3 text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link href={pageHref(page + 1)} className="btn-elo btn-ghost">
                  Next
                </Link>
              )}
            </nav>
          )}
        </div>
      </div>
    </div>
  )
}
