export type Platform =
  'website' | 'github' | 'linkedin' | 'x' | 'bluesky' | 'mastodon' | 'instagram' | 'youtube' | 'other'

export interface SocialLink {
  platform: Platform
  label: string
  url: string
}

export interface Profile {
  name: string
  title: string
  summary: string
  email: string
  phone: string
  location: string
  socials: SocialLink[]
}

export interface Experience {
  id: number
  company: string
  role: string
  location: string
  start_date: string
  end_date: string | null
  description: string
}

export interface Education {
  id: number
  institution: string
  degree: string
  field_of_study: string
  start_date: string | null
  end_date: string | null
  description: string
}

export interface ProficiencyCategory {
  id: number
  name: string
  items: { id: number; name: string; level: number }[]
}

export interface Resume {
  profile: Profile
  experience: Experience[]
  education: Education[]
  proficiencies: ProficiencyCategory[]
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export const api = {
  resume: () => get<Resume>('/resume/'),
}

export interface PostSummary {
  slug: string
  title: string
  date: string
  excerpt: string
  tags: string[]
  draft: boolean
  updated_at: string
}

export interface Post extends PostSummary {
  body: string
}

export type PostInput = Omit<Post, 'updated_at'>

const csrf = () => document.cookie.match(/(?:^|; )csrftoken=([^;]+)/)?.[1] ?? ''

async function send<T>(path: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrf() },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) {
    const detail = await res.json().catch(() => null)
    throw new Error(detail ? JSON.stringify(detail) : `${res.status} ${res.statusText}`)
  }
  return res.status === 204 ? (undefined as T) : res.json()
}

export const postsApi = {
  list: () => get<PostSummary[]>('/blog/posts/'),
  get: (slug: string) => get<Post>(`/blog/posts/${slug}/`),
  create: (data: PostInput) => send<Post>('/blog/posts/', 'POST', data),
  update: (slug: string, data: Partial<PostInput>) => send<Post>(`/blog/posts/${slug}/`, 'PATCH', data),
  remove: (slug: string) => send<void>(`/blog/posts/${slug}/`, 'DELETE'),
}
