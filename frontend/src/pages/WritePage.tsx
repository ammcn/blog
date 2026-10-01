import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import MDEditor, { commands } from '@uiw/react-md-editor'
import '@uiw/react-md-editor/markdown-editor.css'
import { postsApi, type PostInput } from '../api'
import { slugify, usePost } from '../posts'
import Markdown from '../components/Markdown'
import { Heading, Sheet, Status } from '../components/Section'
import { useTitle } from '../useTitle'

const today = () => new Date().toISOString().slice(0, 10)
const field = 'w-full border border-neutral-300 rounded px-3 py-2 text-sm bg-white focus:outline-accent'
const blank = (): PostInput => ({
  slug: '',
  title: '',
  date: today(),
  excerpt: '',
  tags: [],
  draft: true,
  body: '',
})

export default function WritePage() {
  const { slug: existing } = useParams()
  const loaded = usePost(existing)
  useTitle(existing ? 'Edit post' : 'New post')

  if (existing && loaded.isPending)
    return (
      <Sheet>
        <Status>Loading…</Status>
      </Sheet>
    )
  if (existing && (loaded.error || !loaded.data))
    return (
      <Sheet>
        <Status>No such post.</Status>
      </Sheet>
    )
  return <Editor key={existing ?? 'new'} existing={existing} initial={loaded.data ?? blank()} />
}

function Editor({ existing, initial }: { existing?: string; initial: PostInput }) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [post, setPost] = useState<PostInput>(initial)
  const [tagsText, setTagsText] = useState(initial.tags.join(', '))
  const [slugTouched, setSlugTouched] = useState(!!existing)
  const [status, setStatus] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof PostInput>(k: K, v: PostInput[K]) => setPost((p) => ({ ...p, [k]: v }))
  const onTitle = (t: string) => {
    set('title', t)
    if (!slugTouched) set('slug', slugify(t))
  }

  const save = async () => {
    const data = {
      ...post,
      tags: tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    }
    setSaving(true)
    try {
      const saved = existing ? await postsApi.update(existing, data) : await postsApi.create(data)
      await qc.invalidateQueries({ queryKey: ['posts'] })
      await qc.invalidateQueries({ queryKey: ['post'] })
      navigate(`/blog/${saved.slug}`)
    } catch (e) {
      setStatus(String(e))
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!existing || !confirm(`Delete "${post.title}"?`)) return
    await postsApi.remove(existing)
    await qc.invalidateQueries({ queryKey: ['posts'] })
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
      {status && <Status>{status}</Status>}

      <div className="grid gap-4 mt-6 sm:grid-cols-[1fr_10rem]">
        <input
          className={field}
          placeholder="Title"
          value={post.title}
          onChange={(e) => onTitle(e.target.value)}
        />
        <input
          className={field}
          type="date"
          value={post.date}
          onChange={(e) => set('date', e.target.value)}
        />
        <input
          className={field}
          placeholder="slug"
          value={post.slug}
          onChange={(e) => {
            setSlugTouched(true)
            set('slug', slugify(e.target.value))
          }}
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={post.draft} onChange={(e) => set('draft', e.target.checked)} />
          Draft
        </label>
        <input
          className={field}
          placeholder="Excerpt"
          value={post.excerpt}
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
            value={post.body}
            onChange={(v) => set('body', v ?? '')}
            preview="edit"
            height={450}
            visibleDragbar={false}
            extraCommands={[commands.fullscreen]}
            textareaProps={{ placeholder: 'Write Markdown here…' }}
          />
        </div>
        <div className="border border-neutral-200 rounded px-4 py-3 min-h-[28rem] overflow-auto">
          {post.body.trim() ? <Markdown>{post.body}</Markdown> : <Status>Preview</Status>}
        </div>
      </div>

      <div className="flex gap-4 mt-6 items-center">
        <button
          className="bg-accent text-white px-5 py-2 rounded text-sm uppercase tracking-widest disabled:opacity-40"
          disabled={!post.title || !post.body.trim() || saving}
          onClick={save}
        >
          {saving ? 'Saving…' : post.draft ? 'Save draft' : 'Publish'}
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
