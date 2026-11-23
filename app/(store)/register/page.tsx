import type { Metadata } from "next"
import { RegisterForm } from "@/components/auth/register-form"

export const metadata: Metadata = { title: "Create an account", robots: { index: false } }

export default async function RegisterPage(props: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await props.searchParams
  return <RegisterForm next={next} />
}
