import * as React from "react"

/**
 * Return keyboard focus to whatever opened an overlay when it closes.
 *
 * Radix Dialog only refocuses its own <DialogTrigger>. Most Accel modals and
 * drawers open from a plain button, a table row or a menu item, so without
 * this, focus fell to <body> on close and keyboard users lost their place.
 *
 * Pass the caller's own handlers through; if the caller prevents the default
 * close focus, this does nothing.
 */
export function useRestoreFocus(
  onOpenAutoFocus?: (event: Event) => void,
  onCloseAutoFocus?: (event: Event) => void
) {
  const opener = React.useRef<HTMLElement | null>(null)

  return {
    onOpenAutoFocus: (event: Event) => {
      // Still the element that opened us — focus hasn't moved in yet.
      const active = document.activeElement
      opener.current = active instanceof HTMLElement && active !== document.body ? active : null
      onOpenAutoFocus?.(event)
    },
    onCloseAutoFocus: (event: Event) => {
      onCloseAutoFocus?.(event)
      if (event.defaultPrevented) return
      const el = opener.current
      opener.current = null
      if (el && el.isConnected) {
        event.preventDefault()
        el.focus()
      }
    },
  }
}
