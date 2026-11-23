import type { Currency, OrderStatus, PaymentStatus, Pagination, ShippingAddress } from "./types"

export interface Paged<T> {
  items: T[]
  pagination: Pagination
}

export interface Dashboard {
  revenue: Record<"today" | "week" | "month", { kobo: number; orders: number }>
  toFulfil: number
  awaitingPayment: number
  ordersByStatus: Partial<Record<OrderStatus, number>>
  customers: number
  salesChart: { date: string; revenueKobo: number; orders: number }[]
  recentOrders: {
    orderNumber: string
    email: string
    status: OrderStatus
    paymentStatus: PaymentStatus
    currency: Currency
    totalKobo: number
    placedAt: string
    customerName: string | null
  }[]
  lowStock: {
    variantId: string
    productId: string
    title: string
    variant: string
    sku: string
    stock: number
  }[]
}

export type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED"

export interface AdminProductRow {
  id: string
  title: string
  slug: string
  status: ProductStatus
  image: string | null
  category: { id: string; name: string } | null
  minPriceKobo: number
  maxPriceKobo: number
  variantCount: number
  totalStock: number
  lowStockVariants: number
  updatedAt: string
}

export interface EditorOption {
  name: string
  values: { value: string; swatch: string | null }[]
}

export interface EditorVariant {
  id?: string
  sku?: string
  options: Record<string, string>
  priceKobo: number
  compareAtPriceKobo: number | null
  /** Explicit dollar price; null = converted from naira at the store rate. */
  priceUsdCents: number | null
  compareAtUsdCents: number | null
  costKobo: number | null
  stock: number
  reserved?: number
  /** Shoppers waiting for a back-in-stock email (read-only). */
  waiting?: number
  allowBackorder: boolean
  lowStockAt: number
  isActive: boolean
  image: string | null
}

export interface EditorProduct {
  id?: string
  title: string
  slug?: string
  description: string | null
  categoryId: string | null
  status: ProductStatus
  brand: string | null
  material: string | null
  careNotes: string | null
  fitNotes: string | null
  tags: string[]
  collectionIds: string[]
  images: { url: string; alt: string | null; colour: string | null }[]
  options: EditorOption[]
  variants: EditorVariant[]
}

export interface AdminCategory {
  id: string
  name: string
  slug: string
  parentId: string | null
  image: string | null
  position: number
  productCount: number
}

export interface AdminCollection {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  isActive: boolean
  position: number
  productCount: number
}

export interface DeliveryZone {
  id: string
  name: string
  /** ISO country codes, or "*" for everywhere else. */
  countries: string[]
  states: string[]
  cities: string[]
  feeKobo: number
  freeAboveKobo: number | null
  /** Dollar overrides for USD shoppers; null = converted from naira. */
  feeUsdCents: number | null
  freeAboveUsdCents: number | null
  position: number
  estimatedMinDays: number
  estimatedMaxDays: number
  allowPayOnDelivery: boolean
  isActive: boolean
}

export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING"

export interface Discount {
  id: string
  code: string
  type: DiscountType
  value: number
  maxDiscountKobo: number | null
  minSubtotalKobo: number | null
  appliesToCollectionIds: string[]
  appliesToProductIds: string[]
  usageLimit: number | null
  perUserLimit: number | null
  usedCount: number
  startsAt: string
  endsAt: string | null
  isActive: boolean
}

export interface AdminOrderRow {
  id: string
  orderNumber: string
  email: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  currency: Currency
  totalKobo: number
  placedAt: string
  customerName: string | null
  phoneNumber: string | null
  city: string
  itemCount: number
  paymentMethod: string | null
}

export interface AdminOrder {
  id: string
  orderNumber: string
  email: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  currency: Currency
  ngnPerUsd: number | null
  totalNgnKobo: number
  subtotalKobo: number
  discountKobo: number
  deliveryKobo: number
  totalKobo: number
  discountCode: string | null
  shippingAddress: ShippingAddress
  customerNote: string | null
  placedAt: string
  items: {
    id: string
    productTitle: string
    variantTitle: string
    sku: string
    image: string | null
    unitPriceKobo: number
    quantity: number
    totalKobo: number
  }[]
  payments: {
    id: string
    method: string
    status: string
    reference: string
    amountKobo: number
    currency: Currency
    channel: string | null
    paidAt: string | null
    createdAt: string
  }[]
  shipments: {
    id: string
    status: string
    carrier: string | null
    trackingNumber: string | null
    trackingUrl: string | null
    shippedAt: string | null
    deliveredAt: string | null
    zone: { name: string } | null
  }[]
  events: { id: string; type: string; message: string; createdAt: string }[]
  user: { id: string; email: string; firstName: string | null; lastName: string | null; phoneNumber: string | null } | null
  allowedTransitions: OrderStatus[]
  canMarkPaid: boolean
}

export interface AdminCustomer {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  phoneNumber: string | null
  createdAt: string
  acceptsMarketing: boolean
  paidOrders: number
  totalSpentKobo: number
}

export interface Subscriber {
  id: string
  email: string
  source: string | null
  unsubscribedAt: string | null
  createdAt: string
}
