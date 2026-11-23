"use client"

import * as React from "react"
import { ImagePlus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { api, errorMessage } from "@/lib/api"
import { cn } from "@/lib/utils"

const MAX_BYTES = 8 * 1024 * 1024

export async function uploadImage(file: File, folder: string): Promise<string> {
  if (file.size > MAX_BYTES) throw new Error(`${file.name} is over 8 MB`)
  const body = new FormData()
  body.append("file", file)
  const result = await api.post<{ url: string }>(`/admin/uploads?folder=${encodeURIComponent(folder)}`, body)
  return result.url
}

/** Button that uploads one or more images and reports their URLs. */
export function UploadButton({
  folder,
  multiple,
  onUploaded,
  className,
  children,
}: {
  folder: string
  multiple?: boolean
  onUploaded: (urls: string[]) => void
  className?: string
  children?: React.ReactNode
}) {
  const input = React.useRef<HTMLInputElement>(null)
  const [busy, setBusy] = React.useState(false)

  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/svg+xml,image/x-icon"
        multiple={multiple}
        hidden
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? [])
          e.target.value = ""
          if (!files.length) return
          setBusy(true)
          const urls: string[] = []
          for (const file of files) {
            try {
              urls.push(await uploadImage(file, folder))
            } catch (error) {
              toast.error(errorMessage(error))
            }
          }
          setBusy(false)
          if (urls.length) onUploaded(urls)
        }}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => input.current?.click()}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md border border-dashed text-sm text-muted-foreground transition hover:border-foreground hover:text-foreground disabled:opacity-60",
          className
        )}
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
        {children ?? (busy ? "Uploading…" : "Upload")}
      </button>
    </>
  )
}

/** A single image field: preview + upload + clear. */
export function SingleImageField({
  value,
  onChange,
  folder,
  aspect = "aspect-video",
}: {
  value: string | null
  onChange: (url: string | null) => void
  folder: string
  aspect?: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("w-28 shrink-0 overflow-hidden rounded-md border bg-muted", aspect)}>
        {value && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="size-full object-contain" />
        )}
      </div>
      <div className="flex flex-col gap-2">
        <UploadButton folder={folder} onUploaded={([url]) => onChange(url)} className="h-9 px-3">
          {value ? "Replace" : "Upload"}
        </UploadButton>
        {value && (
          <button type="button" onClick={() => onChange(null)} className="text-left text-xs text-muted-foreground underline">
            Remove
          </button>
        )}
      </div>
    </div>
  )
}
