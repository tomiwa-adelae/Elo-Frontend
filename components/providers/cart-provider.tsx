"use client"

import * as React from "react"
import { toast } from "sonner"
import { api, errorMessage } from "@/lib/api"
import type { Cart, CartItem } from "@/lib/types"

/** What the product page knows about a line before the server prices it. */
export interface CartPreview {
  product: CartItem["product"]
  sku: string
  options: Record<string, string>
  /** Unit price in the bag's currency. */
  unitPrice: number
  compareAt: number | null
  available: number
}

interface CartContextValue {
  cart: Cart | null
  loading: boolean
  open: boolean
  setOpen: (open: boolean) => void
  refresh: () => Promise<void>
  addItem: (variantId: string, quantity?: number, preview?: CartPreview) => Promise<boolean>
  updateItem: (itemId: string, quantity: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  applyDiscount: (code: string) => Promise<boolean>
  removeDiscount: () => Promise<void>
}

const CartContext = React.createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = React.useState<Cart | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [open, setOpen] = React.useState(false)

  const refresh = React.useCallback(async () => {
    try {
      setCart(await api.get<Cart>("/cart"))
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load cart on mount
    void refresh()
    const onRefresh = () => void refresh()
    window.addEventListener("cart:refresh", onRefresh)
    return () => window.removeEventListener("cart:refresh", onRefresh)
  }, [refresh])

  // Mutations answer with the freshly priced bag; anything else, re-read it.
  const mutate = React.useCallback(
    async (action: () => Promise<unknown>) => {
      try {
        const result = await action()
        if (isCart(result)) setCart(result)
        else await refresh()
        return true
      } catch (error) {
        toast.error(errorMessage(error))
        await refresh()
        return false
      }
    },
    [refresh]
  )

  const cartRef = React.useRef(cart)
  React.useEffect(() => {
    cartRef.current = cart
  }, [cart])

  const addItem = React.useCallback(
    async (variantId: string, quantity = 1, preview?: CartPreview) => {
      // Show it in the bag straight away; the server's answer replaces this.
      const before = cartRef.current
      if (preview && before) {
        setCart(withOptimisticLine(before, variantId, quantity, preview))
        setOpen(true)
      }
      const ok = await mutate(() =>
        api.post("/cart/items", { variantId, quantity })
      )
      if (ok && !(preview && before)) setOpen(true)
      return ok
    },
    [mutate]
  )

  const updateItem = React.useCallback(
    async (itemId: string, quantity: number) => {
      await mutate(() => api.patch(`/cart/items/${itemId}`, { quantity }))
    },
    [mutate]
  )

  const removeItem = React.useCallback(
    async (itemId: string) => {
      await mutate(() => api.delete(`/cart/items/${itemId}`))
    },
    [mutate]
  )

  const applyDiscount = React.useCallback(
    async (code: string) => {
      const ok = await mutate(() => api.post("/cart/discount", { code }))
      if (ok) toast.success("Discount applied")
      return ok
    },
    [mutate]
  )

  const removeDiscount = React.useCallback(async () => {
    await mutate(() => api.delete("/cart/discount"))
  }, [mutate])

  const value = React.useMemo(
    () => ({
      cart,
      loading,
      open,
      setOpen,
      refresh,
      addItem,
      updateItem,
      removeItem,
      applyDiscount,
      removeDiscount,
    }),
    [cart, loading, open, refresh, addItem, updateItem, removeItem, applyDiscount, removeDiscount]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = React.useContext(CartContext)
  if (!context) throw new Error("useCart must be used inside CartProvider")
  return context
}

function isCart(value: unknown): value is Cart {
  return (
    !!value &&
    typeof value === "object" &&
    Array.isArray((value as Cart).items) &&
    !!(value as Cart).totals
  )
}

function withOptimisticLine(
  cart: Cart,
  variantId: string,
  quantity: number,
  preview: CartPreview
): Cart {
  const existing = cart.items.find((i) => i.variantId === variantId)
  const items = existing
    ? cart.items.map((i) =>
        i === existing
          ? {
              ...i,
              quantity: i.quantity + quantity,
              totalKobo: i.unitPriceKobo * (i.quantity + quantity),
            }
          : i
      )
    : [
        ...cart.items,
        {
          id: `pending-${variantId}`,
          variantId,
          quantity,
          product: preview.product,
          sku: preview.sku,
          options: preview.options,
          unitPriceKobo: preview.unitPrice,
          compareAtPriceKobo: preview.compareAt,
          totalKobo: preview.unitPrice * quantity,
          available: preview.available,
          inStock: true,
          quantityAdjusted: false,
          purchasableQuantity: quantity,
        },
      ]
  const added = preview.unitPrice * quantity
  return {
    ...cart,
    items,
    itemCount: cart.itemCount + quantity,
    totals: {
      ...cart.totals,
      subtotalKobo: cart.totals.subtotalKobo + added,
      totalKobo: cart.totals.totalKobo + added,
    },
  }
}
