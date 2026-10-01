import { Link, useParams } from 'react-router-dom'
import { usePosts } from '../posts'
import { Status, Sheet } from '../components/Section'
import { fmtDate } from '../format'
import { HeartButton } from '../components/Heart'
import { useTitle } from '../useTitle'

export default function PostPage() {
  const { slug } = useParams()
  const { posts } = usePosts()
  const post = posts.find((p) => p.slug === slug)
  useTitle(post?.title)
  if (!post)
    return (
      <Sheet>
        <Status>No such post.</Status>
      </Sheet>
    )

  return (
    <Sheet>
      <article>
        <Link to="/blog" className="no-print text-xs uppercase tracking-widest text-ink/60 hover:text-ink">
          ← All posts
        </Link>
        <header className="mt-4 mb-8 border-b border-neutral-300 pb-4">
          <h1 className="font-serif text-4xl">{post.title}</h1>
          <p className="text-sm text-ink/60 mt-2">
            {fmtDate(post.date)}
            {post.tags.length > 0 && ` · ${post.tags.join(', ')}`}
          </p>
        </header>
        <div className="prose prose-neutral max-w-none">
          <post.Content />
        </div>
        <footer className="no-print mt-10 pt-6 border-t border-neutral-300 flex justify-end">
          <HeartButton slug={post.slug} />
        </footer>
      </article>
    </Sheet>
  )
}
