import { useEffect, useState } from 'react'
import type { RefObject } from 'react'

/** Live content width of an element in px (`fallback` until it has been measured) */
export function useElementWidth(ref: RefObject<HTMLElement | null>, fallback: number): number {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver((items) => {
      const w = items[0]?.contentRect.width ?? 0
      if (w > 0) setWidth(w)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])

  return width > 0 ? width : fallback
}
