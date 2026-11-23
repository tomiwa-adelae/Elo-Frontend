/**
 * Remote hosts whose images next/image may resize. Cloudflare R2 public
 * buckets (*.r2.dev) are always allowed; add a custom image domain later with
 * NEXT_PUBLIC_IMAGE_HOSTS=images.elo.com (comma separated).
 *
 * Shared by next.config.ts and StoreImage so the two never disagree.
 */
export const EXTRA_IMAGE_HOSTS = (process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? "")
  .split(",")
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean)

export function isOptimisedHost(hostname: string) {
  const host = hostname.toLowerCase()
  return host.endsWith(".r2.dev") || EXTRA_IMAGE_HOSTS.includes(host)
}
