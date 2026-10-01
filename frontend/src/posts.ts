import type { ComponentType } from 'react'
import { useCanEdit } from './auth'

export interface Post {
  slug: string
  title: string
  date: string
  excerpt: string
  tags: string[]
  draft: boolean
  Content: ComponentType
}

const modules = import.meta.glob<typeof import('*.mdx')>('./posts/*.mdx', { eager: true })

const allPosts: Post[] = Object.entries(modules)
  .map(([path, m]) => ({
    slug: path.replace(/^.*\//, '').replace(/\.mdx$/, ''),
    title: m.frontmatter.title,
    date: m.frontmatter.date,
    excerpt: m.frontmatter.excerpt ?? '',
    tags: m.frontmatter.tags ?? [],
    draft: m.frontmatter.draft ?? false,
    Content: m.default,
  }))
  .sort((a, b) => b.date.localeCompare(a.date))

/** Drafts are visible only to a signed-in editor (and never in production builds). */
export function usePosts() {
  const canEdit = useCanEdit()
  const posts = allPosts.filter((p) => !p.draft || canEdit)
  const tags = [...new Set(posts.flatMap((p) => p.tags))].sort()
  return { posts, tags }
}
