/*
 * Copyright (c) 2026 Arka Prava Ghosh
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import SidebarThemePanel from './SidebarThemePanel'
import { useFocusTrap } from '../hooks/useFocusTrap'

const POPOVER_WIDTH = 300
const POPOVER_GAP = 8
const VIEWPORT_PADDING = 12

type PopoverPosition = {
  top: number
  left: number
  maxHeight: number
}

function computePopoverPosition(trigger: DOMRect): PopoverPosition {
  const maxHeight = Math.min(420, window.innerHeight - VIEWPORT_PADDING * 2)
  const preferredTop = trigger.bottom + POPOVER_GAP
  const top = Math.min(
    preferredTop,
    window.innerHeight - VIEWPORT_PADDING - Math.min(maxHeight, 240),
  )

  let left = trigger.right + POPOVER_GAP
  if (left + POPOVER_WIDTH > window.innerWidth - VIEWPORT_PADDING) {
    left = trigger.left - POPOVER_WIDTH - POPOVER_GAP
  }
  left = Math.max(
    VIEWPORT_PADDING,
    Math.min(left, window.innerWidth - VIEWPORT_PADDING - POPOVER_WIDTH),
  )

  return {
    top: Math.max(VIEWPORT_PADDING, top),
    left,
    maxHeight,
  }
}

export default function SettingsMenu() {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<PopoverPosition | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const close = () => setOpen(false)

  useFocusTrap(popoverRef, open, close)

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setPosition(null)
      return
    }

    function updatePosition() {
      if (!triggerRef.current) return
      setPosition(computePopoverPosition(triggerRef.current.getBoundingClientRect()))
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || popoverRef.current?.contains(target)) {
        return
      }
      close()
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [open])

  return (
    <div className="settings-menu" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="settings-trigger"
        aria-label="Open settings"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? 'settings-popover' : undefined}
        onClick={() => setOpen((current) => !current)}
      >
        <span aria-hidden="true">⚙</span>
      </button>
      {open && position && createPortal(
        <div
          ref={popoverRef}
          id="settings-popover"
          className="settings-popover"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-popover-title"
          style={{
            top: position.top,
            left: position.left,
            width: POPOVER_WIDTH,
            maxHeight: position.maxHeight,
          }}
        >
          <div className="settings-popover-header">
            <h2 id="settings-popover-title">Settings</h2>
            <button
              type="button"
              className="settings-close"
              aria-label="Close settings"
              onClick={close}
            >
              ×
            </button>
          </div>
          <SidebarThemePanel />
        </div>,
        document.body,
      )}
    </div>
  )
}
