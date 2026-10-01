import { useEffect } from 'react'

const base = document.title

export function useTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${base}` : base
    return () => {
      document.title = base
    }
  }, [title])
}
