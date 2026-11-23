// Shapes returned by the Nest API.
//
// Money is integer minor units. Catalogue prices come in both currencies
// (…Kobo for naira, …UsdCents for dollars). Cart, quote and order amounts are
// already in their own `currency`, despite the "Kobo" suffix.

import type { Currency } from "./currency"
export type { Currency }

export interface StoreTheme {
  primary: string
  primaryForeground: string
  background: string
  foreground: string
  muted: string
  accent: string
  fontHeading: string
  fontBody: string
  radius: string
}

export interface StoreSettings {
  id: string
  name: string
  tagline: string | null
  logoUrl: string | null
  faviconUrl: string | null
  ogImageUrl: string | null
  theme: StoreTheme
  announcement: string | null
  heroEyebrow: string | null
  heroTitle: string | null
  heroSubtitle: string | null
  heroImageUrl: string | null
  heroCtaLabel: string | null
  heroCtaHref: string | null
  contactEmail: string | null
  contactPhone: string | null
  whatsappNumber: string | null
  address: string | null
  instagram: string | null
  tiktok: string | null
  facebook: string | null
  twitter: string | null
  enablePayOnDelivery: boolean
  enableUsd: boolean
  ngnPerUsd: number
  shippingPolicy: string | null
  returnsPolicy: string | null
  privacyPolicy: string | null
  termsOfService: string | null
  metaTitle: string | null
  metaDescription: string | null
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
}

export interface Swatch {
  value: string
  swatch: string | null
}

export interface ProductCard {
  id: string
  slug: string
  title: string
  brand: string | null
  category: { id: string; name: string; slug: string } | null
  minPriceKobo: number
  maxPriceKobo: number
  minPriceUsdCents: number
  maxPriceUsdCents: number
  images: { url: string; alt: string | null }[]
  /** First photo of each colour, keyed by colour value. */
  colourImages: Record<string, string>
  tags: string[]
  inStock: boolean
  onSale: boolean
  swatches: Swatch[]
}

export interface ProductList {
  items: ProductCard[]
  pagination: Pagination
}

export interface ProductVariant {
  id: string
  sku: string
  priceKobo: number
  compareAtPriceKobo: number | null
  priceUsdCents: number
  compareAtUsdCents: number | null
  image: string | null
  options: Record<string, string>
  inStock: boolean
  lowStock: boolean
  available: number
}

export interface SizeGuide {
  columns: string[]
  rows: { label: string; values: string[] }[]
}

export interface ProductDetail {
  id: string
  slug: string
  title: string
  description: string | null
  brand: string | null
  material: string | null
  careNotes: string | null
  fitNotes: string | null
  tags: string[]
  minPriceKobo: number
  maxPriceKobo: number
  minPriceUsdCents: number
  maxPriceUsdCents: number
  category: {
    id: string
    name: string
    slug: string
    sizeGuide: SizeGuide | null
  } | null
  collections: { id: string; name: string; slug: string }[]
  images: { url: string; alt: string | null; colour: string | null }[]
  options: {
    id: string
    name: string
    values: { id: string; value: string; swatch: string | null }[]
  }[]
  variants: ProductVariant[]
  inStock: boolean
  reviews: {
    average: number | null
    count: number
    fit: { RUNS_SMALL: number; TRUE_TO_SIZE: number; RUNS_LARGE: number }
  }
}

export interface CategoryNode {
  id: string
  name: string
  slug: string
  image: string | null
  children: CategoryNode[]
}

export interface Collection {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
}

export interface Filters {
  options: { name: string; values: Swatch[] }[]
  brands: string[]
  tags: string[]
  priceRange: { minKobo: number; maxKobo: number }
}

export interface CartItem {
  id: string
  variantId: string
  quantity: number
  product: { id: string; title: string; slug: string; image: string | null }
  sku: string
  options: Record<string, string>
  unitPriceKobo: number
  compareAtPriceKobo: number | null
  totalKobo: number
  available: number
  inStock: boolean
  quantityAdjusted: boolean
  purchasableQuantity: number
}

export interface Cart {
  id: string
  currency: Currency
  ngnPerUsd: number
  items: CartItem[]
  itemCount: number
  discount: {
    code: string
    type: string
    freeDelivery: boolean
    reason?: string
  } | null
  totals: { subtotalKobo: number; discountKobo: number; totalKobo: number }
  hasUnavailableItems: boolean
}

export interface ShippingAddress {
  fullName: string
  phoneNumber: string
  line1: string
  line2?: string
  city: string
  state: string
  country?: string
  countryCode?: string
  postalCode?: string
  landmark?: string
}

export interface Quote {
  currency: Currency
  ngnPerUsd: number
  delivery: {
    zoneName: string
    feeKobo: number
    isFree: boolean
    freeAboveKobo: number | null
    estimatedMinDays: number
    estimatedMaxDays: number
    allowPayOnDelivery: boolean
  }
  totals: {
    subtotalKobo: number
    discountKobo: number
    deliveryKobo: number
    totalKobo: number
  }
  hasUnavailableItems: boolean
}

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED"

export type PaymentStatus =
  | "UNPAID"
  | "AWAITING_DELIVERY_PAYMENT"
  | "PAID"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED"
  | "FAILED"

export interface OrderItem {
  id: string
  variantId: string | null
  productTitle: string
  variantTitle: string
  sku: string
  image: string | null
  unitPriceKobo: number
  quantity: number
  totalKobo: number
}

export interface Order {
  id: string
  orderNumber: string
  email: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  subtotalKobo: number
  discountKobo: number
  deliveryKobo: number
  totalKobo: number
  currency: Currency
  discountCode: string | null
  shippingAddress: ShippingAddress
  customerNote: string | null
  placedAt: string
  items: OrderItem[]
  shipments: {
    status: string
    carrier: string | null
    trackingNumber: string | null
    trackingUrl: string | null
    shippedAt: string | null
    deliveredAt: string | null
  }[]
  events: { type: string; message: string; createdAt: string }[]
  payments: {
    method: string
    status: string
    reference: string
    amountKobo: number
    currency: Currency
    channel: string | null
    paidAt: string | null
  }[]
}

export interface OrderSummary {
  orderNumber: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  totalKobo: number
  currency: Currency
  formattedTotal: string
  placedAt: string
  itemCount: number
  items: { productTitle: string; variantTitle: string; image: string | null; quantity: number }[]
}

export interface User {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  phoneNumber: string | null
  role: "CUSTOMER" | "ADMIN"
  emailVerified: boolean
  adminPosition: string | null
}
