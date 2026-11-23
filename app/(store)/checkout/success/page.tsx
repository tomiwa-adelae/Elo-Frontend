import type { Metadata } from "next"
import { CheckCircle2 } from "lucide-react"
import { GuestOrder } from "@/components/store/guest-order"

export const metadata: Metadata = { title: "Thank you", robots: { index: false } }

export default async function CheckoutSuccessPage(props: {
  searchParams: Promise<{ order?: string; email?: string }>
}) {
  const { order, email } = await props.searchParams

  return (
    <div className="container-page max-w-5xl py-10">
      {order && email ? (
        <GuestOrder
          orderNumber={order}
          email={email}
          banner={
            <div className="mb-10 flex items-start gap-3 rounded-lg bg-muted p-5">
              <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-success" />
              <div>
                <p className="text-lg font-medium">Thank you, your order is in.</p>
                <p className="text-sm text-muted-foreground">
                  We&apos;ve emailed a confirmation to {email}. We&apos;ll let you know when it ships.
                </p>
              </div>
            </div>
          }
        />
      ) : (
        <p className="py-20 text-center text-muted-foreground">Order not found.</p>
      )}
    </div>
  )
}
