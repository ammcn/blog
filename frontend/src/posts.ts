import { useQuery } from '@tanstack/react-query'
import { postsApi } from './api'
import { useMe } from './auth'

/** Post lists are keyed by auth state so drafts appear or vanish on sign-in and sign-out. */
export function usePosts() {
  const me = useMe()
  const authed = !!me.data?.authenticated
  const q = useQuery({ queryKey: ['posts', authed], queryFn: postsApi.list, enabled: !me.isPending })
  const posts = q.data ?? []
  const tags = [...new Set(posts.flatMap((p) => p.tags))].sort()
  return { ...q, posts, tags }
}

export function usePost(slug: string | undefined) {
  const me = useMe()
  const authed = !!me.data?.authenticated
  return useQuery({
    queryKey: ['post', slug, authed],
    queryFn: () => postsApi.get(slug!),
    enabled: !!slug && !me.isPending,
    retry: false,
  })
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
