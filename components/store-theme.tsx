import type { StoreTheme } from "@/lib/types"

const HEX = /^#[0-9a-fA-F]{6}$/
const RADIUS = /^\d+(\.\d+)?(px|rem)$/

/**
 * Server component: injects the admin-tunable brand colours as CSS
 * variables. Fonts are fixed to ELO's (Cormorant Garamond + Outfit) and loaded
 * with next/font in the root layout.
 */
export function StoreThemeStyle({ theme }: { theme: StoreTheme }) {
  // Values are validated by the API too; re-check because they land in CSS.
  const color = (value: string, fallback: string) =>
    HEX.test(value) ? value : fallback
  const css = `:root:root{
--primary:${color(theme.primary, "#2B2A26")};
--primary-foreground:${color(theme.primaryForeground, "#F7F4EF")};
--background:${color(theme.background, "#F7F4EF")};
--foreground:${color(theme.foreground, "#2B2A26")};
--muted:${color(theme.muted, "#ECE7DF")};
--brand-accent:${color(theme.accent, "#8C8A3A")};
--radius:${RADIUS.test(theme.radius) ? theme.radius : "0.75rem"};
}`

  return (
<style dangerouslySetInnerHTML={{ __html: css }} />
  )
}
