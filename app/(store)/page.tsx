import Link from "next/link"
import { Fragment } from "react"
import { ProductGrid } from "@/components/store/product-card"
import { NewsletterForm } from "@/components/store/newsletter-form"
import { getStoreSettings, serverGet } from "@/lib/api-server"
import type { ProductList } from "@/lib/types"
import { StoreImage } from "@/components/store/store-image"

const img = (file: string) => `/images/products/${file}`

const MARQUEE = [
  "Softly worn",
  "Everyday ease",
  "Made for slow mornings",
  "Lagos to the world",
]

const MOODS = [
  {
    colour: "Lilac",
    sub: "Soft & dreamy",
    src: img("elo-00.jpg"),
    pos: "center",
  },
  {
    colour: "Lime",
    sub: "Bright & bold",
    src: img("elo-03.jpg"),
    pos: "70% center",
  },
  { colour: "Sky", sub: "Calm & airy", src: img("elo-11.jpg"), pos: "center" },
]

const FEATURES = [
  {
    title: "Modal fabric",
    text: "Silky to the touch and breathable enough for Lagos afternoons.",
    swatch: "var(--sky)",
  },
  {
    title: "Fitted body",
    text: "A sculpted silhouette that moves with you, never against you.",
    swatch: "var(--lilac)",
  },
  {
    title: "Delicate lace trim",
    text: "A quiet finishing touch along the neckline.",
    swatch: "var(--lime)",
  },
  {
    title: "Godet hem",
    text: "Inset panels that flare into a fluid, floor-grazing sweep.",
    swatch: "var(--brand-accent)",
  },
]

const DIARIES = [
  { src: img("elo-05.jpg"), alt: "Staying home in the ELO set", video: true },
  { src: img("elo-06.jpg"), alt: "Friends lounging in ELO sets", video: true },
  { src: img("elo-07.jpg"), alt: "Founder's diaries", video: true },
  { src: img("elo-24.jpg"), alt: "Introducing ELO", video: true },
  { src: img("elo-08.jpg"), alt: "Wrapped ELO orders", video: false },
]

const PROMISES = [
  {
    title: "Worldwide shipping",
    text: "Dispatched from Lagos, tracked to your door.",
  },
  {
    title: "Find your fit",
    text: "A simple size guide for every piece.",
    href: "/size-guide",
  },
  { title: "Pay your way", text: "Cards, bank transfer, naira or dollars." },
  { title: "Questions?", text: "Chat with us on WhatsApp or Instagram." },
]

/** "Softly worn. *Everyday* ease." → the starred words in italic olive. */
function Emphasis({ text }: { text: string }) {
  const parts = text.split(/(\*[^*]+\*)/g)
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("*") && part.endsWith("*") ? (
          <em key={i} className="text-brand italic">
            {part.slice(1, -1)}
          </em>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </>
  )
}

export default async function HomePage() {
  const [store, softies] = await Promise.all([
    getStoreSettings(),
    serverGet<ProductList>(
      "/catalog/products?collection=the-softies&sort=price_asc&limit=8"
    ).catch(() => null),
  ])
  const all = softies?.items.length
    ? softies
    : await serverGet<ProductList>("/catalog/products?limit=8").catch(
        () => null
      )
  const products = all?.items ?? []

  const featured =
    products.find((p) => p.tags.some((t) => t.toLowerCase() === "new")) ??
    products[0]
  const instagram = store.instagram
    ? `https://www.instagram.com/${store.instagram.replace(/^@/, "")}/`
    : null

  // "Softly worn. *Everyday* ease." splits into two lines after the first full stop.
  const title = store.heroTitle || "Softly worn. *Everyday* ease."
  const [line1, ...rest] = title.split(/(?<=\.)\s+/)

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="container-page grid items-center gap-14 pt-14 pb-20 max-lg:gap-10 max-md:pt-10 max-md:pb-14 lg:grid-cols-[1fr_1.05fr]">
        <div>
          {store.heroEyebrow && (
            <span className="eyebrow">{store.heroEyebrow}</span>
          )}
          <h1 className="mt-5 mb-6 text-[clamp(52px,7.2vw,104px)] leading-[0.95]">
            <Emphasis text={line1} />
            {rest.length > 0 && (
              <>
                <br />
                <Emphasis text={rest.join(" ")} />
              </>
            )}
          </h1>
          {store.heroSubtitle && (
            <p className="mb-9 max-w-[420px] text-[17px] text-muted-foreground">
              {store.heroSubtitle}
            </p>
          )}
          <div className="flex flex-wrap gap-3.5">
            <Link
              href={store.heroCtaHref || "/shop"}
              className="btn-elo btn-solid"
            >
              {store.heroCtaLabel || "Shop the collection"} →
            </Link>
            <Link href="#fabric" className="btn-elo btn-ghost">
              Feel the fabric
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-[1.35fr_1fr] items-end gap-4">
          <div className="aspect-[3/4] overflow-hidden rounded-t-[320px] bg-hero">
            <StoreImage
              src={store.heroImageUrl || img("elo-02.jpg")}
              alt="Model in the lime ELO slip dress and matching robe"
              preload
              className="object-cover"
              sizes="(min-width: 1024px) 40vw, 58vw"
            />
          </div>
          <div className="grid gap-4">
            {featured && (
              <Link
                href={`/products/${featured.slug}`}
                className="bg-paper px-[18px] py-4 text-[12.5px] shadow-[0_10px_30px_rgba(0,0,0,0.06)] transition hover:-translate-y-0.5"
              >
                <span className="eyebrow">New in</span>
                <b className="mt-1 mb-0.5 block font-heading text-[22px] leading-[1.1] font-medium">
                  {featured.title}
                </b>
                {featured.category?.name ?? "Shop now"} →
              </Link>
            )}
            <div className="aspect-[3/4] overflow-hidden bg-stone">
              <StoreImage
                src={img("elo-21.jpg")}
                alt="ELO robes in sky, lime and lilac on a rail"
                className="object-cover"
                sizes="(min-width: 1024px) 25vw, 40vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Marquee ──────────────────────────────────────────────────── */}
      <div
        className="overflow-hidden border-y border-stone bg-paper py-[18px] whitespace-nowrap"
        aria-hidden
      >
        <div className="inline-block animate-marquee font-heading text-2xl text-muted-foreground italic motion-reduce:animate-none">
          {Array.from({ length: 8 }).flatMap((_, r) =>
            MARQUEE.map((m) => (
              <span key={`${r}-${m}`}>
                {m}
                <span className="mx-7 text-brand not-italic">✦</span>
              </span>
            ))
          )}
        </div>
      </div>

      {/* ── Shop by mood ─────────────────────────────────────────────── */}
      <section
        id="colours"
        className="scroll-mt-24 py-[110px] max-md:py-[72px]"
      >
        <div className="container-page">
          <SectionHead
            eyebrow="Shop by mood"
            title={
              <>
                Three colours,
                <br />
                endless ease.
              </>
            }
            link={{ href: "/shop", label: "View all" }}
          />
          <div className="grid gap-5 sm:grid-cols-3">
            {MOODS.map((m) => (
              <Link
                key={m.colour}
                href={`/shop?colour=${m.colour}`}
                className="group relative aspect-[3/4] overflow-hidden"
              >
                <StoreImage
                  src={m.src}
                  alt={`ELO in ${m.colour}`}
                  loading="lazy"
                  className="object-cover transition duration-1000 ease-[cubic-bezier(.2,.7,.2,1)] group-hover:scale-105"
                  style={{ objectPosition: m.pos }}
                  sizes="(min-width: 768px) 33vw, 100vw"
                />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-b from-transparent to-[rgba(30,28,20,0.45)] px-7 pt-[60px] pb-[26px] text-white">
                  <h3 className="text-[44px] leading-none">{m.colour}</h3>
                  <p className="text-[11px] tracking-[0.22em] uppercase">
                    {m.sub}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Shop the Softies ─────────────────────────────────────────── */}
      <section id="shop" className="pb-[110px] max-md:pb-[72px]">
        <div className="container-page">
          <SectionHead
            eyebrow="The essentials"
            title="Shop the Softies"
            link={{ href: "/size-guide", label: "Size guide" }}
          />
          {products.length ? (
            <ProductGrid products={products} />
          ) : (
            <p className="text-muted-foreground">
              New pieces are on their way. Check back soon.
            </p>
          )}
        </div>
      </section>

      {/* ── Fabric & details ─────────────────────────────────────────── */}
      <section
        id="fabric"
        className="scroll-mt-24 bg-paper py-[110px] max-md:py-[72px]"
      >
        <div className="container-page grid items-center gap-20 max-lg:gap-12 lg:grid-cols-2">
          <div className="grid grid-cols-2 gap-3.5">
            {[
              {
                src: img("elo-13.jpg"),
                alt: "Sky set: fitted robe, lace trim, fitted body, godet hem, modal fabric",
              },
              {
                src: img("elo-18.jpg"),
                alt: "Lilac set: robe, lace details, body-fitted dress, modal fabric",
              },
            ].map((d, i) => (
              <div
                key={d.src}
                className={`aspect-[3/4] overflow-hidden bg-[#F4F4F2] ${i === 1 ? "mt-[60px]" : ""}`}
              >
                <StoreImage
                  src={d.src}
                  alt={d.alt}
                  loading="lazy"
                  className="object-contain"
                  sizes="(min-width: 1024px) 22vw, 45vw"
                />
              </div>
            ))}
          </div>
          <div>
            <span className="eyebrow">Designed to be lived in</span>
            <h2 className="mt-3.5 text-[clamp(38px,4.4vw,58px)] leading-[1.02]">
              Every detail,
              <br />
              softly considered.
            </h2>
            <div className="mt-10 grid gap-x-[30px] gap-y-[34px] sm:grid-cols-2">
              {FEATURES.map((f) => (
                <div key={f.title}>
                  <i
                    className="mb-3 block size-[26px] rounded-full"
                    style={{ background: f.swatch }}
                  />
                  <h4 className="mb-1.5 font-heading text-2xl font-medium">
                    {f.title}
                  </h4>
                  <p className="text-[14.5px] text-muted-foreground">
                    {f.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── The ELO experience ───────────────────────────────────────── */}
      <section className="grid bg-story lg:grid-cols-[1.1fr_1fr]">
        <div className="min-h-[560px] overflow-hidden max-md:min-h-[360px]">
          <StoreImage
            src={img("elo-19.jpg")}
            alt="ELO orders wrapped in tissue with lilac ribbon"
            loading="lazy"
            className="object-cover"
            sizes="(min-width: 1024px) 55vw, 100vw"
          />
        </div>
        <div className="flex flex-col justify-center px-16 py-20 max-md:px-5 max-md:py-14">
          <span className="eyebrow">The ELO experience</span>
          <h2 className="mt-4 mb-[22px] text-[clamp(38px,4.4vw,58px)] leading-[1.02]">
            Wrapped like
            <br />a little gift to you.
          </h2>
          <p className="mb-8 max-w-[420px] text-muted-foreground">
            Every order is hand-folded, wrapped in ELO tissue and tied with
            ribbon in Lagos, then tracked to your door wherever you are in the
            world.
          </p>
          <Link href="/shop" className="btn-elo w-fit btn-solid">
            Start your order →
          </Link>
        </div>
      </section>

      {/* ── Founder's diaries ────────────────────────────────────────── */}
      <section
        id="diaries"
        className="scroll-mt-24 py-[110px] max-md:py-[72px]"
      >
        <div className="container-page">
          <SectionHead
            eyebrow={
              store.instagram
                ? `@${store.instagram.replace(/^@/, "")}`
                : "Diaries"
            }
            title="Founder's diaries"
            link={
              instagram
                ? { href: instagram, label: "Follow along", external: true }
                : undefined
            }
          />
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {DIARIES.map((d, i) => {
              const Tile = instagram ? "a" : "div"
              return (
                <Tile
                  key={d.src}
                  {...(instagram && {
                    href: instagram,
                    target: "_blank",
                    rel: "noopener noreferrer",
                  })}
                  className={`relative block aspect-[9/14] overflow-hidden bg-stone ${i >= 2 ? "max-sm:hidden" : ""} ${i >= 3 ? "sm:max-lg:hidden" : ""}`}
                >
                  <StoreImage
                    src={d.src}
                    alt={d.alt}
                    loading="lazy"
                    className="object-cover transition duration-700 hover:scale-[1.03]"
                    sizes="(min-width: 1024px) 20vw, 50vw"
                  />
                  {d.video && (
                    <span className="absolute top-3 right-3 grid size-7 place-items-center rounded-full border border-white/90 bg-black/15 text-[9px] text-white">
                      ▶
                    </span>
                  )}
                </Tile>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Promises ─────────────────────────────────────────────────── */}
      <div className="container-page">
        <div className="grid border-y border-stone sm:grid-cols-2 lg:grid-cols-4">
          {PROMISES.map((p) => (
            <div
              key={p.title}
              className="border-stone px-7 py-[38px] max-lg:odd:border-r max-sm:border-r-0 max-sm:border-b max-sm:last:border-b-0 lg:not-last:border-r"
            >
              <h5 className="mb-1.5 font-heading text-[22px] font-medium">
                {p.href ? (
                  <Link href={p.href} className="hover:text-brand">
                    {p.title}
                  </Link>
                ) : (
                  p.title
                )}
              </h5>
              <p className="text-[13.5px] text-muted-foreground">{p.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Join the Softies ─────────────────────────────────────────── */}
      <section className="py-[120px] text-center max-md:py-20">
        <div className="container-page flex flex-col items-center">
          <span className="eyebrow">Join the Softies</span>
          <h2 className="mt-4 mb-[18px] text-[clamp(40px,5vw,68px)] leading-none">
            First to know,
            <br />
            first to wear.
          </h2>
          <p className="mb-[34px] text-muted-foreground">
            New colours, restocks and the occasional founder&apos;s note.
          </p>
          <NewsletterForm source="home" />
        </div>
      </section>
    </>
  )
}

function SectionHead({
  eyebrow,
  title,
  link,
}: {
  eyebrow: string
  title: React.ReactNode
  link?: { href: string; label: string; external?: boolean }
}) {
  return (
    <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2 className="mt-2 text-[clamp(38px,4.6vw,60px)] leading-none">
          {title}
        </h2>
      </div>
      {link &&
        (link.external ? (
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="link-elo"
          >
            {link.label}
          </a>
        ) : (
          <Link href={link.href} className="link-elo">
            {link.label}
          </Link>
        ))}
    </div>
  )
}
