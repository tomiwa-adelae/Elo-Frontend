import type { Metadata } from "next"
import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = { title: "Sign in", robots: { index: false } }

export default async function LoginPage(props: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await props.searchParams
  return <LoginForm next={next} />
}
