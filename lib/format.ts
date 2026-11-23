const nf = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 })

/** ₦25,000 — whole naira, which is how Nigerian shops price things. */
export function naira(kobo: number | null | undefined): string {
  if (kobo === null || kobo === undefined) return "—"
  const value = kobo / 100
  return `₦${Number.isInteger(value) ? nf.format(value) : value.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function priceRange(minKobo: number, maxKobo: number): string {
  return minKobo === maxKobo
    ? naira(minKobo)
    : `${naira(minKobo)} – ${naira(maxKobo)}`
}

export function formatDate(value: string | Date, withTime = false): string {
  const date = typeof value === "string" ? new Date(value) : value
  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime && { hour: "numeric", minute: "2-digit" }),
    timeZone: "Africa/Lagos",
  })
}

export function variantLabel(options: Record<string, string>): string {
  return Object.values(options).join(" / ")
}

export const STATUS_LABEL: Record<string, string> = {
  PENDING: "Awaiting payment",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
  UNPAID: "Unpaid",
  AWAITING_DELIVERY_PAYMENT: "Pay on delivery",
  PAID: "Paid",
  PARTIALLY_REFUNDED: "Partly refunded",
  FAILED: "Failed",
}

/** wa.me link; the number must be international digits (2348012345678). */
export function whatsappLink(number: string, text?: string): string {
  const digits = number.replace(/\D/g, "")
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`
}

export const NIGERIAN_STATES = [
  "Abia", "Abuja (FCT)", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa",
  "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi",
  "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
  "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
]
