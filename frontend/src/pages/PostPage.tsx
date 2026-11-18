import { Link, useParams, useSearchParams } from 'react-router-dom'
import { usePost } from '../posts'
import { Status, Sheet } from '../components/Section'
import Markdown from '../components/Markdown'
import { fmtDate } from '../format'
import { HeartButton } from '../components/Heart'
import { useTitle } from '../useTitle'
import { useCanEdit } from '../auth'

export default function PostPage() {
  const { slug } = useParams()
  const canEdit = useCanEdit()
  const draftView = useSearchParams()[0].has('draft') && canEdit
  const { data: post, isPending, error } = usePost(slug, draftView)
  useTitle(post?.title)

  if (isPending)
    return (
      <Sheet>
        <Status>Loading…</Status>
      </Sheet>
    )
  if (error || !post)
    return (
      <Sheet>
        <Status>No such post.</Status>
      </Sheet>
    )

  return (
    <Sheet>
      <article>
        <div className="no-print flex justify-between text-xs uppercase tracking-widest text-ink/60">
          <Link to="/blog" className="hover:text-ink">
            ← All posts
          </Link>
          {canEdit && (
            <span className="flex gap-4">
              {post.has_pending && (
                <Link to={draftView ? `/blog/${post.slug}` : `/blog/${post.slug}?draft`} className="hover:text-ink">
                  {draftView ? 'View live' : 'View draft'}
                </Link>
              )}
              <Link to={`/write/${post.slug}`} className="hover:text-ink">
                Edit{post.draft && ' (draft)'}
              </Link>
            </span>
          )}
        </div>
        {(post.draft || (draftView && post.has_pending)) && (
          <p className="no-print mt-4 rounded border border-accent/40 bg-accent/5 px-3 py-2 text-sm text-ink/70">
            {post.draft ? 'Draft — not published.' : 'Draft — unpublished changes to this post.'}
          </p>
        )}
        <header className="mt-4 mb-8 border-b border-neutral-300 pb-4">
          <h1 className="font-serif text-4xl">{post.title}</h1>
          <p className="text-sm text-ink/60 mt-2">
            {fmtDate(post.date)}
            {post.tags.length > 0 && ` · ${post.tags.join(', ')}`}
          </p>
        </header>
        <Markdown>{post.body}</Markdown>
        <footer className="no-print mt-10 pt-6 border-t border-neutral-300 flex justify-end">
          <HeartButton slug={post.slug} />
        </footer>
      </article>
    </Sheet>
  )
}
