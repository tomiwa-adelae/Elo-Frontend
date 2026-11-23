"use client"

import Link from "next/link"
import * as React from "react"
import type { ProductCard as ProductCardData } from "@/lib/types"
import { Price } from "@/components/store/price"
import { cn } from "@/lib/utils"
import { StoreImage } from "@/components/store/store-image"

const BADGES: [tag: string, label: string][] = [
  ["bestseller", "Bestseller"],
  ["new", "New"],
  ["gift", "Gift idea"],
]

export function productBadge(
  product: Pick<ProductCardData, "tags" | "inStock" | "onSale">
) {
  if (!product.inStock) return "Sold out"
  if (product.onSale) return "Sale"
  const tags = product.tags.map((t) => t.toLowerCase())
  return BADGES.find(([tag]) => tags.includes(tag))?.[1] ?? null
}

/**
 * Editorial card from the concept: tall image, serif title, and swatches
 * that preview each colour's photo before you click through.
 */
export function ProductCard({
  product,
  subtitle,
  priority,
  colour,
}: {
  product: ProductCardData
  subtitle?: string | null
  priority?: boolean
  /** Colour the listing is filtered by: lead with that colour's photo. */
  colour?: string | null
}) {
  const [picked, setPicked] = React.useState<string | null>(
    colour && product.colourImages?.[colour] ? colour : null
  )
  const [first, second] = product.images
  const pickedImage = picked ? product.colourImages?.[picked] : undefined
  const badge = productBadge(product)
  const href = `/products/${product.slug}${picked ? `?colour=${encodeURIComponent(picked)}` : ""}`
  const varies = product.minPriceKobo !== product.maxPriceKobo

  return (
    <div className="group">
      <Link
        href={href}
        className="relative block aspect-[3/4] overflow-hidden bg-stone"
      >
        {first ? (
          <>
            <StoreImage
              wrapperClassName="absolute inset-0"
              src={pickedImage ?? first.url}
              alt={first.alt ?? product.title}
              preload={priority}
              loading="lazy"
              className="object-cover transition duration-[800ms] ease-[cubic-bezier(.2,.7,.2,1)] group-hover:scale-[1.04]"
              sizes="(min-width: 1024px) 25vw, 50vw"
            />
            {second && !pickedImage && (
              <StoreImage
                wrapperClassName="absolute inset-0"
                src={second.url}
                alt=""
                loading="lazy"
                className="object-cover opacity-0 transition duration-700 group-hover:opacity-100"
                sizes="(min-width: 1024px) 25vw, 50vw"
              />
            )}
          </>
        ) : (
          <div className="flex size-full items-center justify-center p-4 text-center font-heading text-xl text-muted-foreground">
            {product.title}
          </div>
        )}
        {badge && (
          <span className="absolute top-3.5 left-3.5 z-[1] bg-foreground px-2.5 py-1 text-[10px] tracking-[0.2em] text-background uppercase">
            {badge}
          </span>
        )}
        <span className="absolute inset-x-3.5 bottom-3.5 z-[1] bg-foreground py-3 text-center text-[11px] tracking-[0.22em] text-background uppercase transition duration-300 max-md:py-2 max-md:text-[10px] md:translate-y-[160%] md:group-hover:translate-y-0">
          {product.inStock ? "Choose your size" : "View details"}
        </span>
      </Link>

      <div className="mt-4 flex items-start justify-between gap-2.5 max-md:flex-col max-md:gap-0.5">
        <Link href={href} className="min-w-0">
          <h3 className="font-heading text-[22px] leading-[1.15] font-medium max-md:text-lg">
            {product.title}
          </h3>
          {(subtitle ?? product.category?.name) && (
            <span className="mt-1 block text-[13px] text-muted-foreground">
              {subtitle ?? product.category?.name}
            </span>
          )}
        </Link>
        <Price
          kobo={product.minPriceKobo}
          usdCents={product.minPriceUsdCents}
          from={varies}
          className="text-sm whitespace-nowrap"
        />
      </div>

      {product.swatches.length > 1 && (
        <div className="mt-2.5 flex gap-2" role="group" aria-label="Colours">
          {product.swatches.map((s) => (
            <button
              key={s.value}
              type="button"
              title={s.value}
              aria-label={s.value}
              aria-pressed={picked === s.value}
              onClick={() => setPicked(picked === s.value ? null : s.value)}
              className={cn(
                "size-[18px] rounded-full border border-black/10 outline outline-1 outline-offset-2 outline-transparent transition",
                picked === s.value && "outline-foreground"
              )}
              style={{ background: s.swatch ?? undefined }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function ProductGrid({
  products,
  subtitles,
  colour,
}: {
  products: ProductCardData[]
  colour?: string | null
  /** Optional one-liners under titles, keyed by product slug. */
  subtitles?: Record<string, string>
}) {
  return (
    <div className="grid grid-cols-2 gap-x-3.5 gap-y-10 md:gap-x-6 lg:grid-cols-4">
      {products.map((product, i) => (
        <ProductCard
          key={product.id}
          product={product}
          subtitle={subtitles?.[product.slug]}
          priority={i < 4}
          colour={colour}
        />
      ))}
    </div>
  )
}
