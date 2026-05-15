import { useEffect, useRef } from 'react'

export function useAutoSave(
  value: unknown,
  onSave: () => Promise<void>,
  delay = 2000
) {
  const isFirstRender = useRef(true)
  const isSaving = useRef(false)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const timer = setTimeout(async () => {
      if (isSaving.current) return
      isSaving.current = true
      await onSave()
      isSaving.current = false
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay, onSave])
}
