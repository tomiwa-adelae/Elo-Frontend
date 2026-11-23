import type { Metadata } from "next"
import { VerifyEmailForm } from "@/components/auth/verify-email-form"

export const metadata: Metadata = { title: "Verify email", robots: { index: false } }

export default async function VerifyEmailPage(props: {
  searchParams: Promise<{ email?: string; next?: string }>
}) {
  const { email, next } = await props.searchParams
  return <VerifyEmailForm email={email} next={next} />
}
