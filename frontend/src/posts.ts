import { useQuery, type QueryClient } from '@tanstack/react-query'
import { postsApi, type Post } from './api'
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

export function usePost(slug: string | undefined, draft = false) {
  const me = useMe()
  const authed = !!me.data?.authenticated
  return useQuery({
    queryKey: ['post', slug, authed, draft],
    queryFn: () => postsApi.get(slug!, draft),
    enabled: !!slug && !me.isPending,
    retry: false,
  })
}

/** A fresh copy for the editor to start from. Never cached: text superseded by an autosave must not seed a new session. */
export function useEditablePost(slug: string | undefined) {
  return useQuery({
    queryKey: ['editable-post', slug],
    queryFn: () => postsApi.get(slug!, true),
    enabled: !!slug,
    retry: false,
    gcTime: 0,
    staleTime: Infinity,
  })
}

/** Caches a write's response, which is the signed-in `?draft` view, so later reads don't show the old copy. */
export function cachePost(qc: QueryClient, post: Post) {
  qc.setQueryData(['post', post.slug, true, true], post)
  if (!post.has_pending) qc.setQueryData(['post', post.slug, true, false], post)
  qc.invalidateQueries({ queryKey: ['posts'] })
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
