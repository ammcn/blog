import { Link, useParams } from 'react-router-dom'
import { usePost } from '../posts'
import { Status, Sheet } from '../components/Section'
import Markdown from '../components/Markdown'
import { fmtDate } from '../format'
import { HeartButton } from '../components/Heart'
import { useTitle } from '../useTitle'
import { useCanEdit } from '../auth'

export default function PostPage() {
  const { slug } = useParams()
  const { data: post, isPending, error } = usePost(slug)
  const canEdit = useCanEdit()
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
            <Link to={`/write/${post.slug}`} className="hover:text-ink">
              Edit{post.draft && ' (draft)'}
            </Link>
          )}
        </div>
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
