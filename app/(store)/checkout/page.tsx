"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import { Loader2, Lock } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/components/providers/auth-provider"
import { useCart } from "@/components/providers/cart-provider"
import { useCurrency } from "@/components/providers/currency-provider"
import { DiscountForm } from "@/components/store/discount-form"
import { api, errorMessage } from "@/lib/api"
import { countryName, shippingCountries } from "@/lib/countries"
import { money } from "@/lib/currency"
import { NIGERIAN_STATES, variantLabel } from "@/lib/format"
import type { Quote, ShippingAddress } from "@/lib/types"
import { cn } from "@/lib/utils"
import { StoreImage } from "@/components/store/store-image"

const EMPTY: Required<Omit<ShippingAddress, "country">> = {
  fullName: "",
  phoneNumber: "",
  line1: "",
  line2: "",
  city: "",
  state: "Lagos",
  countryCode: "NG",
  postalCode: "",
  landmark: "",
}
type Address = typeof EMPTY

const ADDRESS_KEY = "checkout:address"

function Field({
  label,
  children,
  hint,
  className,
}: {
  label: string
  children: React.ReactNode
  hint?: string
  className?: string
}) {
  return (
    <label className={cn("block space-y-2", className)}>
      <span className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
        {label}
      </span>
      {children}
      {hint && (
        <span className="block text-xs text-muted-foreground">{hint}</span>
      )}
    </label>
  )
}

const inputClass =
  "h-12 w-full border border-stone bg-paper px-3.5 text-[15px] outline-none transition focus:border-foreground"

export default function CheckoutPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { cart, loading, refresh } = useCart()
  const { currency, enabled: usdEnabled, setCurrency } = useCurrency()

  const [email, setEmail] = React.useState("")
  const [address, setAddress] = React.useState<Address>(EMPTY)
  const [note, setNote] = React.useState("")
  const [method, setMethod] = React.useState<"PAYSTACK" | "PAY_ON_DELIVERY">(
    "PAYSTACK"
  )
  const [countries, setCountries] = React.useState(() =>
    shippingCountries({ worldwide: false, countries: [] })
  )
  const [fetchedQuote, setQuote] = React.useState<Quote | null>(null)
  const [quoteError, setQuoteError] = React.useState<string | null>(null)
  const [quoting, setQuoting] = React.useState(false)
  const [placing, setPlacing] = React.useState(false)

  const inNigeria = address.countryCode === "NG"

  React.useEffect(() => {
    api
      .get<{ worldwide: boolean; countries: string[] }>("/delivery/countries")
      .then((available) => setCountries(shippingCountries(available)))
      .catch(() => {})
  }, [])

  // Returning shoppers get their last address back.
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(ADDRESS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as {
          address: Partial<Address>
          email: string
        }
        // localStorage is client-only, so this can't be a lazy initialiser without a hydration mismatch.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAddress({ ...EMPTY, ...parsed.address })
        setEmail(parsed.email ?? "")
      }
    } catch {
      // storage unavailable
    }
  }, [])

  React.useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- prefill from the signed-in user
      setEmail((e) => e || user.email)
      setAddress((a) => ({
        ...a,
        fullName:
          a.fullName ||
          [user.firstName, user.lastName].filter(Boolean).join(" "),
        phoneNumber: a.phoneNumber || user.phoneNumber || "",
      }))
    }
  }, [user])

  const set =
    (key: keyof Address) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setAddress((a) => ({ ...a, [key]: e.target.value }))

  const setCountry = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value
    setAddress((a) => ({
      ...a,
      countryCode: code,
      // Nigerian states don't carry over abroad, and vice versa.
      state:
        code === "NG"
          ? NIGERIAN_STATES.includes(a.state)
            ? a.state
            : "Lagos"
          : "",
    }))
  }

  // Delivery depends on country (+ state and city in Nigeria).
  const quoteReady =
    !!cart?.items.length &&
    address.city.trim().length >= 2 &&
    (!inNigeria || !!address.state)
  // A quote for an address that's since changed currency or been cleared is stale.
  const quote =
    quoteReady && fetchedQuote?.currency === cart?.currency
      ? fetchedQuote
      : null
  const subtotal = cart?.totals.totalKobo
  const bagCurrency = cart?.currency ?? currency

  React.useEffect(() => {
    if (!quoteReady) return
    const timer = setTimeout(async () => {
      setQuoting(true)
      try {
        const q = await api.post<Quote>("/checkout/quote", {
          shippingAddress: {
            fullName: address.fullName || "Customer",
            phoneNumber:
              address.phoneNumber.length >= 7 ? address.phoneNumber : "0000000",
            line1: address.line1.length >= 3 ? address.line1 : "TBD",
            city: address.city.trim(),
            state: address.state,
            countryCode: address.countryCode,
          },
        })
        setQuote(q)
        setQuoteError(null)
        if (!q.delivery.allowPayOnDelivery) setMethod("PAYSTACK")
      } catch (error) {
        setQuote(null)
        setQuoteError(errorMessage(error))
      } finally {
        setQuoting(false)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [
    quoteReady,
    address.state,
    address.city,
    address.countryCode,
    cart?.items.length,
    cart?.currency,
    subtotal,
    cart?.discount?.code,
  ]) // eslint-disable-line react-hooks/exhaustive-deps

  const placeOrder = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!quote) {
      toast.error(
        quoteError ?? "Enter your delivery address to see delivery options"
      )
      return
    }
    setPlacing(true)
    const clean = Object.fromEntries(
      Object.entries({ ...address, country: countryName(address.countryCode) })
        .map(([k, v]) => [k, String(v).trim()])
        .filter(([k, v]) => v || (k === "state" && !inNigeria))
    )
    try {
      localStorage.setItem(ADDRESS_KEY, JSON.stringify({ address, email }))
      sessionStorage.setItem("checkout:email", email)
    } catch {
      // storage unavailable
    }
    try {
      const result = await api.post<{
        orderNumber: string
        authorizationUrl: string | null
      }>("/checkout", {
        shippingAddress: clean,
        email: email.trim() || undefined,
        paymentMethod: method,
        customerNote: note.trim() || undefined,
      })
      if (result.authorizationUrl) {
        window.location.href = result.authorizationUrl
        return
      }
      await refresh()
      router.push(
        `/checkout/success?order=${encodeURIComponent(result.orderNumber)}&email=${encodeURIComponent(email.trim())}`
      )
    } catch (error) {
      toast.error(errorMessage(error))
      setPlacing(false)
      void refresh()
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!cart?.items.length) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="text-5xl">Your bag is empty</h1>
        <Link href="/shop" className="btn-elo mt-8 btn-solid">
          Shop the Softies →
        </Link>
      </div>
    )
  }

  const podAllowed = quote?.delivery.allowPayOnDelivery ?? false
  const showPod = inNigeria && bagCurrency === "NGN"
  const m = (minor: number) => money(minor, bagCurrency)

  return (
    <div className="container-page py-10 lg:py-14">
      <div className="mb-10">
        <span className="eyebrow">Secure checkout</span>
        <h1 className="mt-2 text-5xl">Almost yours.</h1>
      </div>
      <div className="grid gap-12 lg:grid-cols-[1fr_420px]">
        <form id="checkout-form" onSubmit={placeOrder} className="space-y-12">
          <section className="space-y-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-3xl">Contact</h2>
              {!user && (
                <Link
                  href="/login?next=/checkout"
                  className="text-sm underline underline-offset-4"
                >
                  Sign in
                </Link>
              )}
            </div>
            <Field
              label="Email"
              hint="Your receipt and delivery updates go here."
            >
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </Field>
          </section>

          <section className="space-y-5">
            <h2 className="text-3xl">Delivery</h2>
            <Field label="Country">
              <select
                required
                autoComplete="country"
                value={address.countryCode}
                onChange={setCountry}
                className={inputClass}
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>

            {!inNigeria && usdEnabled && bagCurrency === "NGN" && (
              <div className="flex flex-wrap items-center justify-between gap-3 bg-story px-4 py-3 text-sm">
                <span>Shopping from abroad? You can pay in US dollars.</span>
                <button
                  type="button"
                  onClick={() => setCurrency("USD")}
                  className="text-[12px] tracking-[0.18em] uppercase underline underline-offset-4"
                >
                  Switch to $ USD
                </button>
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Full name">
                <input
                  required
                  minLength={2}
                  autoComplete="name"
                  value={address.fullName}
                  onChange={set("fullName")}
                  className={inputClass}
                />
              </Field>
              <Field
                label="Phone number"
                hint={
                  inNigeria ? undefined : "Include your country code, e.g. +44"
                }
              >
                <input
                  required
                  type="tel"
                  minLength={7}
                  autoComplete="tel"
                  placeholder={inNigeria ? "0801 234 5678" : "+44 7700 900000"}
                  value={address.phoneNumber}
                  onChange={set("phoneNumber")}
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label="Street address">
              <input
                required
                minLength={3}
                autoComplete="address-line1"
                value={address.line1}
                onChange={set("line1")}
                className={inputClass}
              />
            </Field>
            <Field label="Apartment, suite, etc. (optional)">
              <input
                autoComplete="address-line2"
                value={address.line2}
                onChange={set("line2")}
                className={inputClass}
              />
            </Field>
            {inNigeria ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="City / area" hint="e.g. Lekki, Ikeja, Wuse 2">
                  <input
                    required
                    minLength={2}
                    autoComplete="address-level2"
                    value={address.city}
                    onChange={set("city")}
                    className={inputClass}
                  />
                </Field>
                <Field label="State">
                  <select
                    required
                    value={address.state}
                    onChange={set("state")}
                    className={inputClass}
                  >
                    {NIGERIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-3">
                <Field label="City / town">
                  <input
                    required
                    minLength={2}
                    autoComplete="address-level2"
                    value={address.city}
                    onChange={set("city")}
                    className={inputClass}
                  />
                </Field>
                <Field label="State / region">
                  <input
                    autoComplete="address-level1"
                    value={address.state}
                    onChange={set("state")}
                    className={inputClass}
                  />
                </Field>
                <Field label="Postcode / ZIP">
                  <input
                    autoComplete="postal-code"
                    value={address.postalCode}
                    onChange={set("postalCode")}
                    className={inputClass}
                  />
                </Field>
              </div>
            )}
            {inNigeria && (
              <Field
                label="Nearest landmark (optional)"
                hint="Helps the rider find you."
              >
                <input
                  value={address.landmark}
                  onChange={set("landmark")}
                  className={inputClass}
                />
              </Field>
            )}
            <Field label="Gift message or order note (optional)">
              <textarea
                value={note}
                maxLength={500}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Sending this as a gift? Write a note and we'll tuck it in."
                className="w-full border border-stone bg-paper px-3.5 py-3 text-[15px] outline-none focus:border-foreground"
              />
            </Field>
          </section>

          <section className="space-y-5">
            <h2 className="text-3xl">Payment</h2>
            <div className="divide-y divide-stone border border-stone bg-paper">
              <PaymentOption
                checked={method === "PAYSTACK"}
                onSelect={() => setMethod("PAYSTACK")}
                title={`Pay now in ${bagCurrency === "USD" ? "US dollars" : "naira"}`}
                description={
                  bagCurrency === "USD"
                    ? "Visa, Mastercard and more, secured by Paystack."
                    : "Card, bank transfer or USSD, secured by Paystack."
                }
              />
              {showPod && (
                <PaymentOption
                  checked={method === "PAY_ON_DELIVERY"}
                  onSelect={() => setMethod("PAY_ON_DELIVERY")}
                  disabled={!podAllowed}
                  title="Pay on delivery"
                  description={
                    quote && !podAllowed
                      ? "Not available for this delivery area."
                      : "Pay the rider by cash or transfer when your order arrives."
                  }
                />
              )}
            </div>
          </section>
        </form>

        <aside className="h-fit space-y-6 bg-paper p-6 lg:sticky lg:top-28">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-3xl">Your order</h2>
            {usdEnabled && (
              <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                Paying in {bagCurrency}
              </span>
            )}
          </div>
          <div className="space-y-4">
            {cart.items.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="relative aspect-[3/4] w-16 shrink-0 overflow-hidden bg-stone">
                  {item.product.image && (
                    <StoreImage
                      src={item.product.image}
                      alt=""
                      className="object-cover"
                      sizes="64px"
                    />
                  )}
                  <span className="absolute top-0 right-0 flex size-5 items-center justify-center bg-foreground text-[10px] text-background">
                    {item.quantity}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-lg leading-snug">
                    {item.product.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {variantLabel(item.options)}
                  </p>
                </div>
                <p className="text-sm">{m(item.totalKobo)}</p>
              </div>
            ))}
          </div>
          <DiscountForm />
          <div className="space-y-2 border-t border-stone pt-5 text-sm">
            <Row label="Subtotal" value={m(cart.totals.subtotalKobo)} />
            {cart.totals.discountKobo > 0 && (
              <Row label="Discount" value={`−${m(cart.totals.discountKobo)}`} />
            )}
            <Row label="Gift wrapping" value="Complimentary" />
            <Row
              label={
                quote ? `Delivery · ${quote.delivery.zoneName}` : "Delivery"
              }
              value={
                quoting
                  ? "…"
                  : quote
                    ? quote.delivery.isFree
                      ? "Free"
                      : m(quote.delivery.feeKobo)
                    : "Enter address"
              }
            />
            {quote && (
              <p className="text-xs text-muted-foreground">
                Arrives in {quote.delivery.estimatedMinDays}–
                {quote.delivery.estimatedMaxDays} working days
                {quote.delivery.freeAboveKobo && !quote.delivery.isFree
                  ? `. Free over ${m(quote.delivery.freeAboveKobo)}.`
                  : "."}
                {!inNigeria && " Import duties, if any, are paid on arrival."}
              </p>
            )}
            {quoteError && (
              <p className="text-xs text-destructive">{quoteError}</p>
            )}
          </div>
          <div className="flex items-baseline justify-between border-t border-stone pt-5">
            <span className="text-[12px] tracking-[0.2em] uppercase">
              Total
            </span>
            <span className="font-heading text-3xl">
              {m(quote?.totals.totalKobo ?? cart.totals.totalKobo)}
            </span>
          </div>
          <button
            form="checkout-form"
            disabled={placing || !quote || cart.hasUnavailableItems}
            className="btn-elo w-full btn-solid py-[18px]"
          >
            {placing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : method === "PAYSTACK" ? (
              <>
                <Lock className="size-3.5" /> Pay{" "}
                {quote ? m(quote.totals.totalKobo) : ""}
              </>
            ) : (
              "Place order"
            )}
          </button>
          {cart.hasUnavailableItems && (
            <p className="text-xs text-destructive">
              Some items in your bag are no longer available.{" "}
              <Link href="/cart" className="underline">
                Review bag
              </Link>
            </p>
          )}
        </aside>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  )
}

function PaymentOption({
  checked,
  onSelect,
  disabled,
  title,
  description,
}: {
  checked: boolean
  onSelect: () => void
  disabled?: boolean
  title: string
  description: string
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 p-4",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <input
        type="radio"
        name="payment"
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
        className="mt-1 accent-foreground"
      />
      <span>
        <span className="block text-[15px]">{title}</span>
        <span className="block text-sm text-muted-foreground">
          {description}
        </span>
      </span>
    </label>
  )
}
