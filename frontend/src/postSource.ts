export interface PostMeta {
  title: string
  date: string
  excerpt: string
  tags: string[]
  draft: boolean
}

const quote = (s: string) => JSON.stringify(s)
const unquote = (s: string) => (s.startsWith('"') ? (JSON.parse(s) as string) : s)

export function serialize(meta: PostMeta, body: string): string {
  const lines = [`title: ${quote(meta.title)}`, `date: ${meta.date}`]
  if (meta.excerpt) lines.push(`excerpt: ${quote(meta.excerpt)}`)
  if (meta.tags.length) lines.push(`tags: [${meta.tags.map(quote).join(', ')}]`)
  if (meta.draft) lines.push('draft: true')
  return `---\n${lines.join('\n')}\n---\n\n${body.trim()}\n`
}

export function parse(source: string): { meta: PostMeta; body: string } {
  const m = source.match(/^---\n([\s\S]*?)\n---\n?/)
  const meta: PostMeta = { title: '', date: '', excerpt: '', tags: [], draft: false }
  if (!m) return { meta, body: source }
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':')
    if (i < 0) continue
    const key = line.slice(0, i).trim()
    const val = line.slice(i + 1).trim()
    if (key === 'tags') {
      meta.tags = val
        .replace(/^\[|\]$/g, '')
        .split(',')
        .map((t) => unquote(t.trim()))
        .filter(Boolean)
    } else if (key === 'draft') meta.draft = val === 'true'
    else if (key === 'title' || key === 'date' || key === 'excerpt') meta[key] = unquote(val)
  }
  return { meta, body: source.slice(m[0].length).replace(/^\n/, '') }
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const postsApi = {
  load: async (slug: string) => {
    const res = await fetch(`/__posts/${slug}`)
    if (!res.ok) throw new Error((await res.json()).error ?? res.statusText)
    return parse((await res.json()).source as string)
  },
  save: async (slug: string, meta: PostMeta, body: string) => {
    const res = await fetch(`/__posts/${slug}`, { method: 'PUT', body: serialize(meta, body) })
    if (!res.ok) throw new Error((await res.json()).error ?? res.statusText)
  },
  remove: async (slug: string) => {
    const res = await fetch(`/__posts/${slug}`, { method: 'DELETE' })
    if (!res.ok) throw new Error((await res.json()).error ?? res.statusText)
  },
}
