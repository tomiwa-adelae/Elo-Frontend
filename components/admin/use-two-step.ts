"use client"

import * as React from "react"
import { toast } from "sonner"

/** Returns a guard: first call warns, a second within 4s goes ahead. */
export function useTwoStep() {
  const armed = React.useRef(false)
  return React.useCallback((message = "Press Delete again to confirm") => {
    if (armed.current) {
      armed.current = false
      return true
    }
    armed.current = true
    toast(message)
    setTimeout(() => (armed.current = false), 4000)
    return false
  }, [])
}
