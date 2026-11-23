"use server"

import { revalidatePath } from "next/cache"

/**
 * Drops the cached storefront render so admin edits (branding, products)
 * show immediately instead of after the 30–60s revalidate window. It only
 * clears cache, so it is safe to expose without auth.
 */
export async function refreshStorefront() {
  revalidatePath("/", "layout")
}
