import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export interface Me {
  authenticated: boolean
  username: string | null
}

const csrf = () => document.cookie.match(/(?:^|; )csrftoken=([^;]+)/)?.[1] ?? ''

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf() },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.detail ?? res.statusText)
  return json as T
}

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const res = await fetch('/api/auth/me/')
      if (!res.ok) throw new Error(res.statusText)
      return (await res.json()) as Me
    },
  })
}

export function useLogin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (creds: { username: string; password: string }) => post<Me>('login/', creds),
    onSuccess: (me) => qc.setQueryData(['me'], me),
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => post<Me>('logout/'),
    onSuccess: (me) => qc.setQueryData(['me'], me),
  })
}

/** Editing is possible only in dev (the file writer lives in the Vite server) and only when signed in. */
export const useCanEdit = () => {
  const me = useMe()
  return import.meta.env.DEV && !!me.data?.authenticated
}
