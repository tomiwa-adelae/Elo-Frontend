import type { Metadata } from "next"
import Link from "next/link"
import { getStoreSettings } from "@/lib/api-server"
import { whatsappLink } from "@/lib/format"

export const metadata: Metadata = {
  title: "FAQ",
  description: "Delivery, sizing, fabric care, payments and exchanges at ELO.",
}

const SECTIONS: { title: string; items: { q: string; a: string }[] }[] = [
  {
    title: "Orders & delivery",
    items: [
      {
        q: "How long does delivery take?",
        a: "Orders leave our Lagos studio within 1–2 working days. Lagos deliveries usually arrive in 1–3 working days, the rest of Nigeria in 3–5, and international orders in 5–10 working days with tracking.",
      },
      {
        q: "Do you ship internationally?",
        a: "Yes, we ship worldwide. Choose your country at checkout to see the delivery fee, and pay in US dollars if you prefer. Any import duties or taxes are charged by your country on arrival.",
      },
      {
        q: "How do I track my order?",
        a: "You'll receive an email as soon as your order ships. You can also look it up any time with your order number and email on the order lookup page.",
      },
    ],
  },
  {
    title: "Sizing & fit",
    items: [
      {
        q: "How do ELO pieces fit?",
        a: "Relaxed and easy. Our modal has natural stretch, so most people take their usual size. If you're between sizes, size up for a softer drape.",
      },
      {
        q: "What if it doesn't fit?",
        a: "Exchange unworn pieces with tags attached within 7 days of delivery. Message us and we'll arrange it.",
      },
    ],
  },
  {
    title: "Fabric & care",
    items: [
      {
        q: "What is modal?",
        a: "Modal is a soft, breathable fibre made from beech wood pulp. It drapes beautifully, feels cool against the skin and gets softer with every wash.",
      },
      {
        q: "How should I wash my ELO pieces?",
        a: "Machine wash cold on a gentle cycle, inside out, with similar colours. Skip the tumble dryer and lay flat or hang to dry. A cool iron, if needed.",
      },
    ],
  },
  {
    title: "Payments & gifting",
    items: [
      {
        q: "How can I pay?",
        a: "Card, bank transfer or USSD in naira, or card in US dollars, all processed securely by Paystack.",
      },
      {
        q: "Is everything gift-wrapped?",
        a: "Always. Every order is hand-folded in ELO tissue and tied with ribbon, at no extra cost. Add a gift message at checkout and we'll tuck a handwritten note inside.",
      },
    ],
  },
]

export default async function FaqPage() {
  const store = await getStoreSettings()

  return (
    <div className="container-page py-12 lg:py-16">
      <div className="mb-14 max-w-2xl">
        <span className="eyebrow">Good to know</span>
        <h1 className="mt-3 text-[clamp(44px,6vw,76px)] leading-[0.95]">Questions, answered.</h1>
      </div>

      <div className="grid gap-14 lg:grid-cols-[1fr_340px]">
        <div className="space-y-14">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="mb-2 text-3xl">{section.title}</h2>
              <div className="divide-y divide-stone border-y border-stone">
                {section.items.map((item) => (
                  <details key={item.q} className="group py-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[15px]">
                      {item.q}
                      <span className="text-lg text-muted-foreground transition group-open:rotate-45">+</span>
                    </summary>
                    <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted-foreground">{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="h-fit space-y-4 bg-hero p-7 lg:sticky lg:top-28">
          <h2 className="text-3xl">Still wondering?</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We&apos;re a small team and we read every message.
          </p>
          <div className="flex flex-col gap-3 pt-2">
            {store.whatsappNumber && (
              <a
                href={whatsappLink(store.whatsappNumber, "Hi ELO, I have a question.")}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-elo btn-solid w-full"
              >
                Chat on WhatsApp
              </a>
            )}
            {store.contactEmail && (
              <a href={`mailto:${store.contactEmail}`} className="btn-elo btn-ghost w-full">
                Email us
              </a>
            )}
            <Link href="/size-guide" className="link-elo self-start text-sm">
              See the size guide
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
