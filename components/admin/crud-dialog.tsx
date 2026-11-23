"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { btnDanger, btnOutline, btnPrimary } from "@/components/admin/ui"

/** Shared modal for the small create/edit forms. */
export function CrudDialog({
  title,
  description,
  onClose,
  onSubmit,
  onDelete,
  busy,
  children,
}: {
  title: string
  description?: string
  onClose: () => void
  onSubmit: () => void
  onDelete?: () => void
  busy?: boolean
  children: React.ReactNode
}) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90svh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-sans">{title}</DialogTitle>
          <DialogDescription className={description ? undefined : "sr-only"}>{description ?? title}</DialogDescription>
        </DialogHeader>
        <form
          id="crud-form"
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit()
          }}
        >
          {children}
        </form>
        <DialogFooter className="gap-2 sm:justify-between">
          {onDelete ? (
            <button type="button" onClick={onDelete} className={btnDanger} disabled={busy}>Delete</button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={btnOutline}>Cancel</button>
            <button form="crud-form" disabled={busy} className={btnPrimary}>{busy ? "Saving…" : "Save"}</button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
