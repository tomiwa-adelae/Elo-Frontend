"use client"

import * as React from "react"
import { api, ApiError } from "@/lib/api"
import type { User } from "@/lib/types"

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
  reload: () => Promise<User | null>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [loading, setLoading] = React.useState(true)

  const reload = React.useCallback(async () => {
    try {
      const me = await api.get<User>("/auth/me")
      setUser(me)
      return me
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) {
        console.error(error)
      }
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- session check on mount
    void reload()
  }, [reload])

  const login = React.useCallback(async (email: string, password: string) => {
    const result = await api.post<{ user: User }>("/auth/login", {
      email,
      password,
    })
    setUser(result.user)
    // Fold anything added as a guest into the account's bag.
    try {
      await api.post("/cart/merge")
    } catch {
      // A failed merge must not block sign-in.
    }
    window.dispatchEvent(new Event("cart:refresh"))
    return result.user
  }, [])

  const logout = React.useCallback(async () => {
    try {
      await api.post("/auth/logout")
    } finally {
      setUser(null)
      window.dispatchEvent(new Event("cart:refresh"))
    }
  }, [])

  const value = React.useMemo(
    () => ({ user, loading, login, logout, reload }),
    [user, loading, login, logout, reload]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used inside AuthProvider")
  return context
}
