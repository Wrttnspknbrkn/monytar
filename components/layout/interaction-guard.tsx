"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

// Anything that legitimately blocks the page behind it. `data-state="open"`
// is what Radix sets on live overlay content and removes when it closes.
const OPEN_OVERLAY_SELECTOR = [
  '[role="dialog"][data-state="open"]',
  '[role="alertdialog"][data-state="open"]',
  '[role="menu"][data-state="open"]',
  '[role="listbox"][data-state="open"]',
].join(",")

function overlayIsOpen(): boolean {
  return document.querySelector(OPEN_OVERLAY_SELECTOR) !== null
}

function pageIsLockedBySomethingStale(): boolean {
  const body = document.body
  return body.style.pointerEvents === "none" || body.hasAttribute("data-scroll-locked")
}

/** Undo the locks Radix puts on <body> while a modal is open. */
export function releaseBodyLocks() {
  const body = document.body
  if (body.style.pointerEvents === "none") body.style.pointerEvents = ""
  body.removeAttribute("data-scroll-locked")
  if (body.style.overflow === "hidden") body.style.overflow = ""
  body.style.removeProperty("padding-right")
  body.style.removeProperty("margin-right")
}

/**
 * Safety net for the "whole page stops responding" failure.
 *
 * Radix modals (dialogs, alert dialogs, dropdown menus, selects) disable the
 * rest of the page by setting `pointer-events: none` and a scroll lock on
 * <body>, and remove them again on close. When two overlays hand off to each
 * other — e.g. a Select closing while an AlertDialog opens from its
 * onValueChange, or a dialog unmounting mid-animation on a route change —
 * the cleanup can be skipped, leaving <body> permanently non-interactive:
 * nothing clickable, no navigation, no Log out. Nothing in the UI can fix
 * that once it happens, so this watches for the stuck state (locked body but
 * no overlay actually open) and clears it, and also clears it on every route
 * change. It never touches a page that has a real overlay open.
 */
export function InteractionGuard() {
  const pathname = usePathname()

  useEffect(() => {
    // A new page can never legitimately start with an overlay open.
    const t = window.setTimeout(() => {
      if (!overlayIsOpen()) releaseBodyLocks()
    }, 250)
    return () => window.clearTimeout(t)
  }, [pathname])

  useEffect(() => {
    let timer: number | undefined

    const schedule = () => {
      window.clearTimeout(timer)
      // Wait out Radix's close animation before judging the state stale.
      timer = window.setTimeout(() => {
        if (pageIsLockedBySomethingStale() && !overlayIsOpen()) releaseBodyLocks()
      }, 400)
    }

    const observer = new MutationObserver(schedule)
    observer.observe(document.body, { attributes: true, attributeFilter: ["style", "data-scroll-locked"] })

    // If a click lands while the body is locked and nothing is open, the user
    // is already stuck — release immediately rather than waiting on the timer.
    const onPointerDown = () => {
      if (pageIsLockedBySomethingStale() && !overlayIsOpen()) releaseBodyLocks()
    }
    document.addEventListener("pointerdown", onPointerDown, true)
    document.addEventListener("keydown", onPointerDown, true)

    schedule()
    return () => {
      window.clearTimeout(timer)
      observer.disconnect()
      document.removeEventListener("pointerdown", onPointerDown, true)
      document.removeEventListener("keydown", onPointerDown, true)
    }
  }, [])

  return null
}
