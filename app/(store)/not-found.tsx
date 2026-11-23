import Link from "next/link"

export default function NotFound() {
  return (
    <div className="container-page py-32 text-center">
      <h1 className="text-4xl font-semibold">Page not found</h1>
      <p className="mt-3 text-muted-foreground">That page may have moved or sold out.</p>
      <Link href="/shop" className="mt-8 inline-flex h-11 items-center rounded-md bg-primary px-6 text-sm text-primary-foreground">
        Back to the shop
      </Link>
    </div>
  )
}
