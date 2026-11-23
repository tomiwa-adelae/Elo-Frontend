"use client"

import * as React from "react"
import { Check, Loader2 } from "lucide-react"
import { useCart, type CartPreview } from "@/components/providers/cart-provider"
import { useCurrency } from "@/components/providers/currency-provider"
import { api, errorMessage } from "@/lib/api"
import { QuantityStepper } from "@/components/store/cart-drawer"
import { Price } from "@/components/store/price"
import { productBadge } from "@/components/store/product-card"
import { SizeGuideTable } from "@/components/store/size-guide-table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { money } from "@/lib/currency"
import { whatsappLink } from "@/lib/format"
import type { ProductDetail, ProductVariant } from "@/lib/types"
import { cn } from "@/lib/utils"

const isColour = (name: string) => /colou?r/i.test(name)
const isSize = (name: string) => /size/i.test(name)

function matches(variant: ProductVariant, picked: Record<string, string>) {
  return Object.entries(picked).every(([k, v]) => variant.options[k] === v)
}

export function ProductBuyBox({
  product,
  whatsappNumber,
  initialColour,
  onColourChange,
}: {
  product: ProductDetail
  whatsappNumber: string | null
  initialColour?: string | null
  onColourChange?: (colour: string) => void
}) {
  const { cart, addItem } = useCart()
  const { currency } = useCurrency()
  const options = product.options
  const actionsRef = React.useRef<HTMLDivElement>(null)
  const optionsRef = React.useRef<HTMLDivElement>(null)
  const [actionsVisible, setActionsVisible] = React.useState(true)

  // The mobile bar appears once the real buttons scroll out of view.
  React.useEffect(() => {
    const el = actionsRef.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver(([entry]) =>
      setActionsVisible(entry.isIntersecting)
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  React.useEffect(() => {
    if (actionsVisible) delete document.body.dataset.stickyBar
    else document.body.dataset.stickyBar = "on"
    return () => {
      delete document.body.dataset.stickyBar
    }
  }, [actionsVisible])

  // Preselect forced choices (single-value options) and the colour the
  // shopper arrived with.
  const [picked, setPicked] = React.useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const option of options) {
      if (option.values.length === 1)
        initial[option.name] = option.values[0].value
      if (isColour(option.name) && initialColour)
        initial[option.name] = initialColour
    }
    return initial
  })
  const [quantity, setQuantity] = React.useState(1)
  const [adding, setAdding] = React.useState(false)
  const [added, setAdded] = React.useState(false)
  const [guideOpen, setGuideOpen] = React.useState(false)
  const [showErrors, setShowErrors] = React.useState(false)

  const complete = options.every((o) => picked[o.name])
  const variant: ProductVariant | undefined = complete
    ? product.variants.find((v) => matches(v, picked))
    : product.variants.length === 1 && options.length === 0
      ? product.variants[0]
      : undefined

  // Is this value purchasable given the other choices already made?
  const valueAvailable = (optionName: string, value: string) => {
    const others = Object.fromEntries(
      Object.entries(picked).filter(([k]) => k !== optionName)
    )
    return product.variants.some(
      (v) => v.options[optionName] === value && matches(v, others) && v.inStock
    )
  }

  const choose = (optionName: string, value: string) => {
    setPicked((prev) => ({ ...prev, [optionName]: value }))
    setQuantity(1)
    if (isColour(optionName)) onColourChange?.(value)
  }

  const add = async () => {
    if (!variant) {
      setShowErrors(true)
      optionsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
      return
    }
    // Lets the bag show the line before the server answers.
    const bagCurrency = cart?.currency ?? currency
    const colour = Object.entries(variant.options).find(([k]) =>
      isColour(k)
    )?.[1]
    const preview: CartPreview = {
      product: {
        id: product.id,
        title: product.title,
        slug: product.slug,
        image:
          variant.image ??
          (colour && product.images.find((i) => i.colour === colour)?.url) ??
          product.images[0]?.url ??
          null,
      },
      sku: variant.sku,
      options: variant.options,
      unitPrice:
        bagCurrency === "USD" ? variant.priceUsdCents : variant.priceKobo,
      compareAt:
        bagCurrency === "USD"
          ? variant.compareAtUsdCents
          : variant.compareAtPriceKobo,
      available: variant.available,
    }
    setAdding(true)
    const ok = await addItem(variant.id, quantity, preview)
    setAdding(false)
    if (ok) {
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    }
  }

  const single = product.minPriceKobo === product.maxPriceKobo
  const ref = variant ?? (single ? product.variants[0] : undefined)
  const sizeGuide = product.category?.sizeGuide
  const badge = productBadge({
    tags: product.tags,
    inStock: product.inStock,
    onSale: product.variants.some(
      (v) => v.compareAtPriceKobo !== null && v.compareAtPriceKobo > v.priceKobo
    ),
  })
  const soldOut = !product.inStock || (!!variant && !variant.inStock)

  return (
    <div className="space-y-7">
      <div>
        <div className="flex items-center gap-3">
          {product.category && (
            <span className="eyebrow">{product.category.name}</span>
          )}
          {badge && (
            <span className="bg-foreground px-2 py-0.5 text-[9.5px] tracking-[0.2em] text-background uppercase">
              {badge}
            </span>
          )}
        </div>
        <h1 className="mt-3 text-[clamp(38px,4vw,52px)] leading-[1.02]">
          {product.title}
        </h1>
        <div className="mt-4 text-lg">
          {ref ? (
            <Price
              kobo={ref.priceKobo}
              usdCents={ref.priceUsdCents}
              compareAtKobo={ref.compareAtPriceKobo}
              compareAtUsdCents={ref.compareAtUsdCents}
            />
          ) : (
            <Price
              kobo={product.minPriceKobo}
              usdCents={product.minPriceUsdCents}
              from
            />
          )}
        </div>
        {product.reviews.count > 0 && product.reviews.average && (
          <p className="mt-2 text-sm text-muted-foreground">
            ★ {product.reviews.average.toFixed(1)} · {product.reviews.count}{" "}
            {product.reviews.count === 1 ? "review" : "reviews"}
          </p>
        )}
      </div>

      <div ref={optionsRef} className="space-y-7">
        {options.map((option) => {
          const colour = isColour(option.name)
          const missing = showErrors && !picked[option.name]
          return (
            <div key={option.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <p
                  className={cn(
                    "text-[12px] tracking-[0.2em] uppercase",
                    missing && "text-destructive"
                  )}
                >
                  {option.name}
                  {picked[option.name] && (
                    <span className="ml-2 tracking-normal text-muted-foreground normal-case">
                      {picked[option.name]}
                    </span>
                  )}
                  {missing && (
                    <span className="ml-2 tracking-normal normal-case">
                      Please choose
                    </span>
                  )}
                </p>
                {isSize(option.name) && sizeGuide && (
                  <button
                    type="button"
                    onClick={() => setGuideOpen(true)}
                    className="text-[12px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
                  >
                    Size guide
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2.5">
                {option.values.map((v) => {
                  const active = picked[option.name] === v.value
                  const available = valueAvailable(option.name, v.value)
                  return colour && v.swatch ? (
                    <button
                      key={v.id}
                      type="button"
                      title={available ? v.value : `${v.value} (sold out)`}
                      aria-label={v.value}
                      aria-pressed={active}
                      onClick={() => choose(option.name, v.value)}
                      className={cn(
                        "relative size-9 rounded-full outline outline-1 outline-offset-[3px] transition",
                        active
                          ? "outline-foreground"
                          : "outline-transparent hover:outline-stone",
                        !available && "opacity-40"
                      )}
                    >
                      <span
                        className="block size-full rounded-full border border-black/10"
                        style={{ background: v.swatch }}
                      />
                      {!available && (
                        <span className="absolute inset-0 m-auto h-px w-full rotate-45 bg-foreground/60" />
                      )}
                    </button>
                  ) : (
                    <button
                      key={v.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => choose(option.name, v.value)}
                      className={cn(
                        "h-11 min-w-12 border px-3.5 text-sm transition",
                        active
                          ? "border-foreground bg-foreground text-background"
                          : "border-stone hover:border-foreground",
                        !available &&
                          !active &&
                          "text-muted-foreground line-through decoration-1"
                      )}
                    >
                      {v.value}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {variant && (
        <p className="text-sm">
          {!variant.inStock ? (
            <span className="text-destructive">Sold out in this option</span>
          ) : variant.lowStock ? (
            <span className="text-brand">
              Only {variant.available} left in this size
            </span>
          ) : (
            <span className="text-success">In stock, ready to wrap</span>
          )}
        </p>
      )}

      <div ref={actionsRef} className="flex gap-3">
        <QuantityStepper
          value={quantity}
          max={variant ? Math.max(variant.available, 1) : undefined}
          onChange={setQuantity}
          disabled={!!variant && !variant.inStock}
        />
        <button
          type="button"
          onClick={add}
          disabled={adding || soldOut}
          className="btn-elo flex-1 btn-solid"
        >
          {adding ? (
            <Loader2 className="size-4 animate-spin" />
          ) : added ? (
            <>
              <Check className="size-4" /> Added to bag
            </>
          ) : soldOut ? (
            "Sold out"
          ) : (
            "Add to bag"
          )}
        </button>
      </div>

      {variant && !variant.inStock && (
        <RestockForm
          key={variant.id}
          variantId={variant.id}
          label={Object.values(variant.options).join(" / ")}
        />
      )}

      {whatsappNumber && (
        <a
          href={whatsappLink(
            whatsappNumber,
            `Hi ELO, I'm interested in ${product.title}${variant ? ` (${Object.values(variant.options).join(" / ")})` : ""}.`
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-elo w-full btn-ghost"
        >
          {soldOut ? "Ask about a restock on WhatsApp" : "Ask us on WhatsApp"}
        </a>
      )}

      {/* Mobile: keep the buy button in reach while browsing photos. */}
      <div
        aria-hidden={actionsVisible}
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-stone bg-background/95 px-4 py-3 backdrop-blur transition-transform duration-300 md:hidden",
          actionsVisible
            ? "pointer-events-none translate-y-full"
            : "translate-y-0"
        )}
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-heading text-lg leading-tight">
              {product.title}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {variant
                ? Object.values(variant.options).join(" / ")
                : `Choose ${options.map((o) => o.name.toLowerCase()).join(" & ")}`}
              {ref &&
                ` · ${money(currency === "USD" ? ref.priceUsdCents : ref.priceKobo, currency)}`}
            </p>
          </div>
          <button
            type="button"
            tabIndex={actionsVisible ? -1 : 0}
            onClick={() => {
              if (variant && !variant.inStock)
                actionsRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                })
              else void add()
            }}
            disabled={adding || !product.inStock}
            className="btn-elo shrink-0 btn-solid px-5"
          >
            {adding ? (
              <Loader2 className="size-4 animate-spin" />
            ) : added ? (
              "Added"
            ) : !product.inStock ? (
              "Sold out"
            ) : variant && !variant.inStock ? (
              "Notify me"
            ) : variant ? (
              "Add to bag"
            ) : (
              "Choose size"
            )}
          </button>
        </div>
      </div>

      {sizeGuide && (
        <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
          <DialogContent className="max-w-xl rounded-none border-stone bg-background">
            <DialogHeader>
              <DialogTitle className="font-heading text-3xl font-normal">
                Find your fit
              </DialogTitle>
              <DialogDescription>
                Body measurements. Our modal stretches, so if you&apos;re
                between sizes, size up for a softer drape.
              </DialogDescription>
            </DialogHeader>
            <SizeGuideTable guide={sizeGuide} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function RestockForm({
  variantId,
  label,
}: {
  variantId: string
  label: string
}) {
  const [email, setEmail] = React.useState("")
  const [state, setState] = React.useState<"idle" | "sending" | "done">("idle")
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("checkout:address")
      const parsed = saved ? (JSON.parse(saved) as { email?: string }) : null
      // localStorage is client-only, so this can't be a lazy initialiser.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (parsed?.email) setEmail(parsed.email)
    } catch {
      // storage unavailable
    }
  }, [])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setState("sending")
    setError(null)
    try {
      await api.post("/restock-alerts", { variantId, email: email.trim() })
      setState("done")
    } catch (e) {
      setError(errorMessage(e))
      setState("idle")
    }
  }

  if (state === "done") {
    return (
      <div className="bg-story px-4 py-4 text-sm">
        <p className="font-heading text-xl">You&apos;re on the list.</p>
        <p className="mt-1 text-muted-foreground">
          We&apos;ll email {email} the moment {label} is back.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-3 bg-paper p-4">
      <div>
        <p className="text-[12px] tracking-[0.2em] uppercase">
          Sold out in {label}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Leave your email and we&apos;ll tell you when it&apos;s back.
        </p>
      </div>
      <div className="flex gap-2">
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          aria-label="Email for restock alert"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 min-w-0 flex-1 border border-stone bg-background px-3 text-[15px] outline-none focus:border-foreground"
        />
        <button
          type="submit"
          disabled={state === "sending"}
          className="btn-elo shrink-0 btn-solid px-5"
        >
          {state === "sending" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Notify me"
          )}
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </form>
  )
}
