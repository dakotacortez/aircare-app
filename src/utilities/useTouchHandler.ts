import { useCallback, useRef } from 'react'

/**
 * Custom hook for reliable touch handling on Android WebView
 * Fixes tap cooldown issues by using native touch events
 */
export function useTouchHandler<T = void>(
  handler: () => T,
  options?: { preventDefault?: boolean; stopPropagation?: boolean }
) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const isProcessingRef = useRef(false)

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0]
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      }
    },
    []
  )

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      // Prevent double-firing and cooldown issues
      if (isProcessingRef.current) {
        return
      }

      const touch = e.changedTouches[0]
      const start = touchStartRef.current

      if (!start) return

      // Calculate movement distance
      const dx = touch.clientX - start.x
      const dy = touch.clientY - start.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const duration = Date.now() - start.time

      // Only trigger if it's a tap (not a swipe/scroll)
      // and not held too long (not a long press)
      if (distance < 10 && duration < 500) {
        if (options?.preventDefault) {
          e.preventDefault()
        }
        if (options?.stopPropagation) {
          e.stopPropagation()
        }

        // Mark as processing to prevent double-fire
        isProcessingRef.current = true

        // Execute handler
        handler()

        // Reset processing flag after a short delay
        setTimeout(() => {
          isProcessingRef.current = false
        }, 100)
      }

      touchStartRef.current = null
    },
    [handler, options]
  )

  // Fallback onClick for non-touch devices (desktop)
  const onClick = useCallback(
    (e: React.MouseEvent) => {
      // Don't fire onClick on touch devices (touch events will handle it)
      if ('ontouchstart' in window) {
        return
      }

      if (options?.preventDefault) {
        e.preventDefault()
      }
      if (options?.stopPropagation) {
        e.stopPropagation()
      }

      handler()
    },
    [handler, options]
  )

  return {
    onTouchStart,
    onTouchEnd,
    onClick,
  }
}
