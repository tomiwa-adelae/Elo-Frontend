import Image from "next/image"
import type { CSSProperties } from "react"
import { isOptimisedHost } from "@/lib/image-hosts"
import { cn } from "@/lib/utils"

/**
 * next/image filling its box: responsive sizes and modern formats for our own
 * photos and R2 uploads. Images on any other host are passed through as-is,
 * so an admin pasting an outside URL never breaks the page.
 */
export function StoreImage({
  src,
  alt,
  sizes,
  className,
  wrapperClassName,
  preload,
  loading,
  style,
}: {
  src: string
  alt: string
  /** How wide the image renders, e.g. "(min-width: 1024px) 25vw, 50vw". */
  sizes: string
  className?: string
  /** Defaults to filling the parent; pass "absolute inset-0" to overlay. */
  wrapperClassName?: string
  /** For the largest image above the fold. */
  preload?: boolean
  loading?: "eager" | "lazy"
  style?: CSSProperties
}) {
  let unoptimized = false
  if (/^https?:\/\//.test(src)) {
    try {
      unoptimized = !isOptimisedHost(new URL(src).hostname)
    } catch {
      unoptimized = true
    }
  }

  return (
    <span className={cn("relative block size-full", wrapperClassName)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        preload={preload}
        loading={preload ? undefined : loading}
        unoptimized={unoptimized}
        className={cn("object-cover", className)}
        style={style}
      />
    </span>
  )
}
