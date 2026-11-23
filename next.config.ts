import type { NextConfig } from "next"
import { EXTRA_IMAGE_HOSTS } from "./lib/image-hosts"

// The Nest API. Browser calls go to /api on this origin and are forwarded, so
// the auth and cart cookies are first-party and work on every browser.
const API_ORIGIN = (process.env.API_URL ?? "http://localhost:8010").replace(
  /\/$/,
  ""
)

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 85],
    remotePatterns: [
      // Admin uploads live in the Cloudflare R2 bucket.
      { protocol: "https", hostname: "**.r2.dev" },
      ...EXTRA_IMAGE_HOSTS.map((hostname) => ({ protocol: "https" as const, hostname })),
    ],
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_ORIGIN}/api/:path*` }]
  },
}

export default nextConfig
