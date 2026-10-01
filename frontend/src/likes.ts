import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export interface LikeState {
  count: number
  liked: boolean
}

function clientId(): string {
  try {
    let id = localStorage.getItem('client-id')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('client-id', id)
    }
    return id
  } catch {
    return crypto.randomUUID()
  }
}

const headers = () => ({ 'X-Client-Id': clientId() })

export function useLikes(slugs: string[]) {
  return useQuery({
    queryKey: ['likes', slugs],
    enabled: slugs.length > 0,
    queryFn: async () => {
      const res = await fetch(`/api/likes/?slugs=${slugs.join(',')}`, { headers: headers() })
      if (!res.ok) throw new Error(res.statusText)
      return (await res.json()) as Record<string, LikeState>
    },
  })
}

export function useToggleLike(slug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/likes/${slug}/toggle/`, { method: 'POST', headers: headers() })
      if (!res.ok) throw new Error(res.statusText)
      return (await res.json()) as LikeState
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['likes'] })
      qc.setQueriesData<Record<string, LikeState>>({ queryKey: ['likes'] }, (old) => {
        const cur = old?.[slug]
        if (!cur) return old
        return { ...old, [slug]: { liked: !cur.liked, count: cur.count + (cur.liked ? -1 : 1) } }
      })
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['likes'] }),
  })
}
