import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getStoreSettings } from "@/lib/api-server"
import type { StoreSettings } from "@/lib/types"

const POLICIES: Record<string, { title: string; field: keyof StoreSettings }> = {
  shipping: { title: "Delivery policy", field: "shippingPolicy" },
  returns: { title: "Returns & exchanges", field: "returnsPolicy" },
  privacy: { title: "Privacy policy", field: "privacyPolicy" },
  terms: { title: "Terms of service", field: "termsOfService" },
}

export async function generateMetadata(props: { params: Promise<{ policy: string }> }): Promise<Metadata> {
  const { policy } = await props.params
  return { title: POLICIES[policy]?.title ?? "Policy" }
}

export default async function PolicyPage(props: { params: Promise<{ policy: string }> }) {
  const { policy } = await props.params
  const config = POLICIES[policy]
  if (!config) notFound()
  const store = await getStoreSettings()
  const body = store[config.field] as string | null

  return (
    <article className="container-page max-w-3xl py-14">
      <span className="eyebrow">The fine print</span>
      <h1 className="mt-3 mb-10 text-[clamp(40px,5vw,64px)] leading-[0.95]">{config.title}</h1>
      {body ? (
        <div className="space-y-4 text-[15px] leading-relaxed whitespace-pre-line text-muted-foreground">{body}</div>
      ) : (
        <p className="text-muted-foreground">
          This policy hasn&apos;t been published yet. Contact us{store.contactEmail ? ` at ${store.contactEmail}` : ""} with any questions.
        </p>
      )}
    </article>
  )
}
