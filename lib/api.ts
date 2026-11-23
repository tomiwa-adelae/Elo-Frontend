"use client"

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly data?: unknown
  ) {
    super(message)
  }
}

function messageFrom(data: unknown, status: number): string {
  if (data && typeof data === "object" && "message" in data) {
    const message = (data as { message: unknown }).message
    if (Array.isArray(message)) return message.join(". ")
    if (typeof message === "string") return message
  }
  if (status === 429) return "Too many attempts. Please wait a minute."
  if (status >= 500) return "Something went wrong on our side. Please try again."
  return "Request failed"
}

let refreshing: Promise<boolean> | null = null

/** One refresh at a time, shared by every request that hit a 401. */
function refreshSession(): Promise<boolean> {
  refreshing ??= fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
  })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      setTimeout(() => (refreshing = null), 0)
    })
  return refreshing
}

type Body = Record<string, unknown> | unknown[] | FormData | undefined

async function request<T>(
  method: string,
  path: string,
  body?: Body,
  retry = true
): Promise<T> {
  const isForm = body instanceof FormData
  const res = await fetch(`/api${path}`, {
    method,
    credentials: "include",
    headers: body && !isForm ? { "content-type": "application/json" } : {},
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  })

  // Access tokens last 15 minutes; refresh once and replay the request.
  if (res.status === 401 && retry && !path.startsWith("/auth/")) {
    if (await refreshSession()) return request<T>(method, path, body, false)
  }

  const text = await res.text()
  const data: unknown = text ? safeJson(text) : null

  if (!res.ok) throw new ApiError(res.status, messageFrom(data, res.status), data)
  return data as T
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: Body) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: Body) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return "Something went wrong"
}
