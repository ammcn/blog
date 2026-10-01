import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import MDEditor, { commands } from '@uiw/react-md-editor'
import '@uiw/react-md-editor/markdown-editor.css'
import MdxPreview from '../components/MdxPreview'
import { Heading, Sheet, Status } from '../components/Section'
import { postsApi, slugify, type PostMeta } from '../postSource'

const today = () => new Date().toISOString().slice(0, 10)
const field = 'w-full border border-neutral-300 rounded px-3 py-2 text-sm bg-white focus:outline-accent'

export default function WritePage() {
  const { slug: existing } = useParams()
  const navigate = useNavigate()
  const [meta, setMeta] = useState<PostMeta>({ title: '', date: today(), excerpt: '', tags: [], draft: true })
  const [tagsText, setTagsText] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(!!existing)
  const [body, setBody] = useState('')
  const [status, setStatus] = useState<string | null>(existing ? 'Loading…' : null)

  useEffect(() => {
    if (!existing) return
    postsApi
      .load(existing)
      .then(({ meta, body }) => {
        setMeta(meta)
        setTagsText(meta.tags.join(', '))
        setSlug(existing)
        setBody(body)
        setStatus(null)
      })
      .catch((e) => setStatus(String(e)))
  }, [existing])

  const set = <K extends keyof PostMeta>(k: K, v: PostMeta[K]) => setMeta((m) => ({ ...m, [k]: v }))
  const onTitle = (t: string) => {
    set('title', t)
    if (!slugTouched) setSlug(slugify(t))
  }

  const save = async () => {
    const tags = tagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    try {
      await postsApi.save(slug, { ...meta, tags }, body)
      if (existing && existing !== slug) await postsApi.remove(existing)
      navigate(`/blog/${slug}`)
    } catch (e) {
      setStatus(String(e))
    }
  }

  const remove = async () => {
    if (!existing || !confirm(`Delete ${existing}.mdx?`)) return
    await postsApi.remove(existing)
    navigate('/blog')
  }

  return (
    <Sheet>
      <div className="flex justify-between items-baseline">
        <Heading title={existing ? 'Edit Post' : 'New Post'} />
        <Link to="/blog" className="text-xs uppercase tracking-widest text-ink/60 hover:text-ink">
          ← All posts
        </Link>
      </div>
      <p className="text-sm text-ink/60 mt-2">
        Saves to <code>frontend/src/posts/{slug || 'slug'}.mdx</code>. Commit to publish.
      </p>
      {status && <Status>{status}</Status>}

      <div className="grid gap-4 mt-6 sm:grid-cols-[1fr_10rem]">
        <input
          className={field}
          placeholder="Title"
          value={meta.title}
          onChange={(e) => onTitle(e.target.value)}
        />
        <input
          className={field}
          type="date"
          value={meta.date}
          onChange={(e) => set('date', e.target.value)}
        />
        <input
          className={field}
          placeholder="slug"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true)
            setSlug(slugify(e.target.value))
          }}
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={meta.draft} onChange={(e) => set('draft', e.target.checked)} />
          Draft
        </label>
        <input
          className={field}
          placeholder="Excerpt"
          value={meta.excerpt}
          onChange={(e) => set('excerpt', e.target.value)}
        />
        <input
          className={field}
          placeholder="tags, comma separated"
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
        />
      </div>

      <div className="grid gap-6 mt-6 lg:grid-cols-2">
        <div data-color-mode="light">
          <MDEditor
            value={body}
            onChange={(v) => setBody(v ?? '')}
            preview="edit"
            height={450}
            visibleDragbar={false}
            extraCommands={[commands.fullscreen]}
            textareaProps={{ placeholder: 'Write Markdown here…' }}
          />
        </div>
        <div className="border border-neutral-200 rounded px-4 py-3 min-h-[28rem] overflow-auto">
          <MdxPreview source={body} />
        </div>
      </div>

      <div className="flex gap-4 mt-6 items-center">
        <button
          className="bg-accent text-white px-5 py-2 rounded text-sm uppercase tracking-widest disabled:opacity-40"
          disabled={!meta.title || !slug || !body.trim()}
          onClick={save}
        >
          Save
        </button>
        {existing && (
          <button className="text-sm text-red-700 underline" onClick={remove}>
            Delete
          </button>
        )}
      </div>
    </Sheet>
  )
}
