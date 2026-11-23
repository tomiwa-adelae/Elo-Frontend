import type { Metadata } from "next"
import Link from "next/link"
import { SizeGuideTable } from "@/components/store/size-guide-table"
import { serverGet } from "@/lib/api-server"
import type { SizeGuide } from "@/lib/types"

export const metadata: Metadata = {
  title: "Size guide",
  description: "Find your ELO size: body measurements in centimetres with UK and US equivalents.",
}

const STEPS = [
  {
    title: "Bust",
    body: "Measure around the fullest part of your chest, keeping the tape level under your arms.",
  },
  {
    title: "Waist",
    body: "Measure around your natural waist, the narrowest part of your torso, just above the navel.",
  },
  {
    title: "Hip",
    body: "Stand with feet together and measure around the fullest part of your hips and seat.",
  },
]

export default async function SizeGuidePage() {
  const guides = await serverGet<{ name: string; slug: string; sizeGuide: SizeGuide }[]>(
    "/catalog/size-guides",
    { revalidate: 300 }
  ).catch(() => [])

  return (
    <div className="container-page py-12 lg:py-16">
      <div className="mb-12 max-w-2xl">
        <span className="eyebrow">Fit, made simple</span>
        <h1 className="mt-3 text-[clamp(44px,6vw,76px)] leading-[0.95]">Size guide</h1>
        <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">
          Every ELO piece is cut from stretch modal with an easy, relaxed drape. The charts below
          are body measurements, not garment measurements. If you&apos;re between sizes, size up
          for a softer fit or down for a closer one.
        </p>
      </div>

      <div className="grid gap-14 lg:grid-cols-[1fr_340px]">
        <div className="space-y-14">
          {guides.length ? (
            guides.map((g) => (
              <section key={g.slug}>
                <div className="mb-4 flex items-baseline justify-between gap-4">
                  <h2 className="text-3xl">{g.name}</h2>
                  <Link href={`/shop?category=${g.slug}`} className="link-elo text-[12px] tracking-[0.18em] uppercase">
                    Shop {g.name.toLowerCase()}
                  </Link>
                </div>
                <div className="bg-paper p-5">
                  <SizeGuideTable guide={g.sizeGuide} />
                </div>
              </section>
            ))
          ) : (
            <p className="text-muted-foreground">Size charts are on their way.</p>
          )}
        </div>

        <aside className="h-fit space-y-6 bg-story p-7 lg:sticky lg:top-28">
          <h2 className="text-3xl">How to measure</h2>
          <ol className="space-y-5">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="font-heading text-2xl leading-none text-lilac-deep">{i + 1}</span>
                <div>
                  <p className="text-[12px] tracking-[0.2em] uppercase">{s.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="border-t border-foreground/10 pt-5 text-sm text-muted-foreground">
            Still unsure? Message us your measurements and we&apos;ll recommend a size.{" "}
            <Link href="/faq" className="underline underline-offset-4">
              Read the FAQ
            </Link>
          </p>
        </aside>
      </div>
    </div>
  )
}
