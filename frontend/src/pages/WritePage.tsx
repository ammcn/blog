import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import MDEditor, { commands } from '@uiw/react-md-editor'
import '@uiw/react-md-editor/markdown-editor.css'
import { postsApi, type Post, type PostInput } from '../api'
import { cachePost, slugify, useEditablePost } from '../posts'
import Markdown from '../components/Markdown'
import { Heading, Sheet, Status } from '../components/Section'
import { useTitle } from '../useTitle'

const AUTOSAVE_MS = 1000
const today = () => new Date().toISOString().slice(0, 10)
const field = 'w-full border border-neutral-300 rounded px-3 py-2 text-sm bg-white focus:outline-accent'
const primary = 'bg-accent text-white px-5 py-2 rounded text-sm uppercase tracking-widest disabled:opacity-40'
const link = 'underline underline-offset-2 disabled:opacity-40'
const blank = (): PostInput => ({ slug: '', title: '', date: today(), excerpt: '', tags: [], body: '' })
const parseTags = (s: string) =>
  s
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
const contentOf = (p: Post): PostInput => ({
  slug: p.slug,
  title: p.title,
  date: p.date,
  excerpt: p.excerpt,
  tags: p.tags,
  body: p.body,
})
const message = (e: unknown) => (e instanceof Error ? e.message : String(e))

type Meta = Pick<Post, 'slug' | 'draft' | 'has_pending'>
type SaveState = { kind: 'idle' } | { kind: 'saving' } | { kind: 'saved'; at: Date } | { kind: 'error'; msg: string }

export default function WritePage() {
  const { slug } = useParams()
  const location = useLocation()
  // An editor that moves its own URL after a slug change passes its key along, so it isn't remounted or
  // reloaded. History state outlives the page, so a passed key only counts while that editor is mounted.
  const [mountedKey, setMountedKey] = useState(location.key)
  const carried = (location.state as { editorKey?: string } | null)?.editorKey === mountedKey
  const editorKey = carried ? mountedKey : location.key
  if (editorKey !== mountedKey) setMountedKey(editorKey)
  const toLoad = carried ? undefined : slug
  const loaded = useEditablePost(toLoad)
  useTitle(slug ? 'Edit post' : 'New post')

  if (toLoad && loaded.isPending)
    return (
      <Sheet>
        <Status>Loading…</Status>
      </Sheet>
    )
  if (toLoad && (loaded.error || !loaded.data))
    return (
      <Sheet>
        <Status>No such post.</Status>
      </Sheet>
    )
  return <Editor key={editorKey} editorKey={editorKey} urlSlug={slug} loaded={loaded.data} />
}

function Editor({ editorKey, urlSlug, loaded }: { editorKey: string; urlSlug?: string; loaded?: Post }) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const initial = loaded ? contentOf(loaded) : blank()
  const [post, setPost] = useState<PostInput>(initial)
  const [tagsText, setTagsText] = useState(initial.tags.join(', '))
  const [slugTouched, setSlugTouched] = useState(!!loaded)
  const [meta, setMeta] = useState<Meta | null>(loaded ?? null)
  const [save, setSave] = useState<SaveState>({ kind: 'idle' })
  const [busy, setBusy] = useState(false)

  const content: PostInput = { ...post, tags: parseTags(tagsText) }
  const snapshot = JSON.stringify(content)
  const saveable = !!content.title.trim() && !!content.slug

  const latest = useRef({ content, snapshot, saveable })
  useLayoutEffect(() => {
    latest.current = { content, snapshot, saveable }
  })
  // The ref serves async saves; the state drives rendering.
  const savedSnapshot = useRef(snapshot)
  const [savedSnap, setSavedSnap] = useState(snapshot)
  const markSaved = (snap: string) => {
    savedSnapshot.current = snap
    setSavedSnap(snap)
  }
  const metaRef = useRef(meta)
  const queue = useRef<Promise<void>>(Promise.resolve())

  const dirty = snapshot !== savedSnap

  const adopt = useCallback(
    (saved: Post) => {
      metaRef.current = saved
      setMeta(saved)
      cachePost(qc, saved)
    },
    [qc],
  )

  useEffect(() => {
    if (meta && meta.slug !== urlSlug) navigate(`/write/${meta.slug}`, { replace: true, state: { editorKey } })
  }, [meta, urlSlug, navigate, editorKey])

  /** Saves the latest content once any in-flight save finishes. */
  const flush = useCallback(() => {
    queue.current = queue.current.then(async () => {
      const { content, snapshot, saveable } = latest.current
      if (!saveable || snapshot === savedSnapshot.current) return
      setSave({ kind: 'saving' })
      try {
        const m = metaRef.current
        const saved = m ? await postsApi.update(m.slug, content) : await postsApi.create(content)
        markSaved(snapshot)
        adopt(saved)
        setSave({ kind: 'saved', at: new Date() })
      } catch (e) {
        setSave({ kind: 'error', msg: message(e) })
      }
    })
    return queue.current
  }, [adopt])

  useEffect(() => {
    if (!dirty || !saveable) return
    const t = setTimeout(flush, AUTOSAVE_MS)
    return () => clearTimeout(t)
  }, [snapshot, dirty, saveable, flush])

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (latest.current.snapshot !== savedSnapshot.current) e.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => {
      window.removeEventListener('beforeunload', warn)
      flush()
    }
  }, [flush])

  const set = <K extends keyof PostInput>(k: K, v: PostInput[K]) => setPost((p) => ({ ...p, [k]: v }))
  const onTitle = (t: string) => {
    set('title', t)
    if (!slugTouched) set('slug', slugify(t))
  }

  const act = async (fn: (slug: string) => Promise<Post>, after?: (p: Post) => void) => {
    setBusy(true)
    try {
      await flush()
      const m = metaRef.current
      if (!m || latest.current.snapshot !== savedSnapshot.current) return
      const res = await fn(m.slug)
      adopt(res)
      setSave({ kind: 'idle' })
      after?.(res)
    } catch (e) {
      setSave({ kind: 'error', msg: message(e) })
    } finally {
      setBusy(false)
    }
  }

  const publish = () => act(postsApi.publish, (p) => navigate(`/blog/${p.slug}`))

  const preview = async () => {
    await flush()
    const m = metaRef.current
    if (m) navigate(`/blog/${m.slug}${m.has_pending ? '?draft' : ''}`)
  }

  const unpublish = () => {
    if (confirm('Take this post off the site? It becomes a private draft.')) act(postsApi.unpublish)
  }

  const discard = () => {
    if (!confirm('Throw away your edits and go back to the published version?')) return
    act(postsApi.discard, (p) => {
      const c = contentOf(p)
      markSaved(JSON.stringify(c))
      setPost(c)
      setTagsText(c.tags.join(', '))
    })
  }

  const remove = async () => {
    if (!meta || !confirm(`Delete "${post.title}"?`)) return
    markSaved(snapshot)
    await postsApi.remove(meta.slug)
    await qc.invalidateQueries({ queryKey: ['posts'] })
    navigate('/blog')
  }

  const published = !!meta && !meta.draft
  const hasChanges = !!meta?.has_pending || dirty
  const canPublish = saveable && !!content.body.trim() && !busy && (!published || hasChanges)

  return (
    <Sheet>
      <div className="flex justify-between items-baseline">
        <Heading title={meta ? 'Edit Post' : 'New Post'} />
        <Link to="/blog" className="text-xs uppercase tracking-widest text-ink/60 hover:text-ink">
          ← All posts
        </Link>
      </div>

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
          className={`${field} disabled:text-ink/50 disabled:bg-neutral-50`}
          placeholder="slug"
          value={post.slug}
          disabled={published}
          title={published ? 'A published post keeps its slug' : undefined}
          onChange={(e) => {
            setSlugTouched(true)
            set('slug', slugify(e.target.value))
          }}
        />
        <p className={`self-center text-xs ${save.kind === 'error' ? 'text-red-700' : 'text-ink/60'}`} role="status">
          {statusText(save, dirty, saveable, published)}
        </p>
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

      {meta && (
        <div className="flex flex-wrap gap-x-5 gap-y-3 mt-6 items-center text-sm">
          <button className={primary} disabled={!canPublish} onClick={publish}>
            {published ? 'Update' : 'Publish'}
          </button>
          <button className={link} disabled={busy} onClick={preview}>
            Preview
          </button>
          {published && hasChanges && (
            <button className={link} disabled={busy} onClick={discard}>
              Revert
            </button>
          )}
          <span className="ml-auto flex gap-5 text-ink/60">
            {published && (
              <button className={link} disabled={busy} onClick={unpublish}>
                Unpublish
              </button>
            )}
            <button className={`${link} text-red-700`} disabled={busy} onClick={remove}>
              Delete
            </button>
          </span>
        </div>
      )}
    </Sheet>
  )
}

function statusText(save: SaveState, dirty: boolean, saveable: boolean, published: boolean) {
  if (save.kind === 'error') return `Not saved: ${save.msg}`
  if (save.kind === 'saving') return 'Saving…'
  if (!saveable) return 'Add a title to start saving'
  if (dirty) return 'Unsaved changes'
  if (save.kind === 'idle') return published ? 'Published' : 'Draft'
  const at = save.at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  return `${published ? 'Draft saved, not live' : 'Draft saved'} ${at}`
}
