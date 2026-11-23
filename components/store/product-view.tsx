"use client"

import * as React from "react"
import { Gift, Globe2, RefreshCcw } from "lucide-react"
import { ProductBuyBox } from "@/components/store/product-buy-box"
import type { ProductDetail } from "@/lib/types"
import { cn } from "@/lib/utils"
import { StoreImage } from "@/components/store/store-image"

const isColourOption = (name: string) => /colou?r/i.test(name)

export function ProductView({
  product,
  whatsappNumber,
  initialColour,
}: {
  product: ProductDetail
  whatsappNumber: string | null
  initialColour?: string | null
}) {
  const colourOption = product.options.find((o) => isColourOption(o.name))
  const colours = colourOption?.values.map((v) => v.value) ?? []
  const startColour =
    initialColour && colours.includes(initialColour) ? initialColour : null

  const [colour, setColour] = React.useState<string | null>(startColour)
  const [activeIndex, setActiveIndex] = React.useState(0)

  // The gallery follows the chosen colour: its own photos plus any untagged
  // ones. Before a colour is picked, show everything.
  const images = React.useMemo(() => {
    const all = product.images.length
      ? product.images
      : [{ url: "", alt: product.title, colour: null }]
    if (!colour) return all
    const matching = all.filter((i) => i.colour === colour || !i.colour)
    return matching.length ? matching : all
  }, [product.images, product.title, colour])

  const active = images[Math.min(activeIndex, images.length - 1)]

  const chooseColour = (value: string) => {
    setColour(value)
    setActiveIndex(0)
  }

  const details = [
    { title: "Description", body: product.description },
    { title: "Fit", body: product.fitNotes },
    { title: "Fabric", body: product.material },
    { title: "Care", body: product.careNotes },
  ].filter((d) => d.body)

  return (
    <div className="container-page grid gap-10 py-8 lg:grid-cols-[1.25fr_1fr] lg:gap-16 lg:py-12">
      <div>
        {/* Mobile: swipeable strip. */}
        <div className="-mx-4 scrollbar-none flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 sm:hidden">
          {images.map((image, i) => (
            <div
              key={`${image.url}-${i}`}
              className="aspect-[3/4] w-[86%] shrink-0 snap-center overflow-hidden bg-stone"
            >
              {image.url && (
                <StoreImage
                  src={image.url}
                  alt={image.alt ?? product.title}
                  loading={i === 0 ? "eager" : "lazy"}
                  className="object-cover"
                  sizes="86vw"
                />
              )}
            </div>
          ))}
        </div>

        {/* Desktop: thumbnails rail + large image. */}
        <div className="hidden gap-4 sm:grid sm:grid-cols-[72px_1fr]">
          <div className="flex flex-col gap-3">
            {images.length > 1 &&
              images.map((image, i) => (
                <button
                  key={`${image.url}-${i}`}
                  type="button"
                  aria-label={`View image ${i + 1}`}
                  onClick={() => setActiveIndex(i)}
                  className={cn(
                    "aspect-[3/4] w-full overflow-hidden bg-stone outline outline-1 outline-offset-2 transition",
                    active === image
                      ? "outline-foreground"
                      : "opacity-70 outline-transparent hover:opacity-100"
                  )}
                >
                  <StoreImage
                    src={image.url}
                    alt=""
                    className="object-cover"
                    sizes="72px"
                  />
                </button>
              ))}
          </div>
          <div className="aspect-[3/4] overflow-hidden bg-stone">
            {active?.url && (
              <StoreImage
                key={active.url}
                src={active.url}
                alt={active.alt ?? product.title}
                className="animate-in object-cover duration-500 fade-in"
                sizes="(min-width: 1024px) 50vw, 90vw"
              />
            )}
          </div>
        </div>
      </div>

      <div className="lg:sticky lg:top-28 lg:self-start">
        <ProductBuyBox
          product={product}
          whatsappNumber={whatsappNumber}
          initialColour={startColour}
          onColourChange={chooseColour}
        />

        <ul className="mt-8 grid gap-3 border-y border-stone py-6 text-[13.5px] text-muted-foreground">
          <li className="flex gap-3">
            <Gift className="size-4 shrink-0 translate-y-0.5 stroke-[1.5] text-foreground" />
            Hand-folded and gift-wrapped in ELO tissue and ribbon, free on every
            order.
          </li>
          <li className="flex gap-3">
            <Globe2 className="size-4 shrink-0 translate-y-0.5 stroke-[1.5] text-foreground" />
            Dispatched from Lagos in 1–2 working days, tracked to your door
            worldwide.
          </li>
          <li className="flex gap-3">
            <RefreshCcw className="size-4 shrink-0 translate-y-0.5 stroke-[1.5] text-foreground" />
            Wrong size? Exchange unworn pieces within 7 days.
          </li>
        </ul>

        {details.length > 0 && (
          <div className="divide-y divide-stone border-b border-stone">
            {details.map((d, i) => (
              <details key={d.title} open={i === 0} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between text-[12px] tracking-[0.2em] uppercase">
                  {d.title}
                  <span className="text-lg text-muted-foreground transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-[14.5px] leading-relaxed whitespace-pre-line text-muted-foreground">
                  {d.body}
                </p>
              </details>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
