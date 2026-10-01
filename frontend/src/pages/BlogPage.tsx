import { Link, useSearchParams } from 'react-router-dom'
import { usePosts } from '../posts'
import { Status, Sheet } from '../components/Section'
import { fmtDate } from '../format'
import { HeartCount } from '../components/Heart'
import { useLikes } from '../likes'
import { useCanEdit } from '../auth'
import { useTitle } from '../useTitle'

export default function BlogPage() {
  useTitle('Blog')
  const [params, setParams] = useSearchParams()
  const tag = params.get('tag')
  const { posts, tags } = usePosts()
  const shown = tag ? posts.filter((p) => p.tags.includes(tag)) : posts
  const likes = useLikes(posts.map((p) => p.slug))
  const canEdit = useCanEdit()

  return (
    <Sheet>
      <header className="text-center">
        <h1 className="font-serif text-4xl">Blog</h1>
        {tags.length > 0 && (
          <p className="text-sm text-ink/60 mt-3 flex flex-wrap justify-center gap-x-3">
            <button className={tag ? 'underline' : 'font-bold'} onClick={() => setParams({})}>
              All
            </button>
            {tags.map((t) => (
              <button
                key={t}
                className={t === tag ? 'font-bold' : 'underline'}
                onClick={() => setParams({ tag: t })}
              >
                {t}
              </button>
            ))}
          </p>
        )}
      </header>

      <div className="mt-12">
        {shown.length === 0 && <Status>Nothing here yet.</Status>}
        <ul className="divide-y divide-neutral-200">
          {shown.map((p) => (
            <li key={p.slug} className="py-7 first:pt-0">
              <div className="flex justify-between items-baseline gap-4">
                <Link to={`/blog/${p.slug}`} className="font-serif text-2xl hover:text-accent">
                  {p.title}
                </Link>
                <span className="text-sm text-ink/60 whitespace-nowrap flex flex-col items-end gap-1">
                  {fmtDate(p.date)}
                  <HeartCount likes={likes.data?.[p.slug]} />
                </span>
              </div>
              {p.tags.length > 0 && (
                <div className="text-xs uppercase tracking-widest text-accent mt-1">{p.tags.join(' · ')}</div>
              )}
              {p.excerpt && <p className="mt-3 text-ink/70 leading-relaxed">{p.excerpt}</p>}
              <div className="mt-3 text-sm flex gap-4">
                <Link to={`/blog/${p.slug}`} className="underline underline-offset-2">
                  Read more
                </Link>
                {canEdit && (
                  <Link to={`/write/${p.slug}`} className="text-ink/60 underline underline-offset-2">
                    edit{p.draft && ' (draft)'}
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Sheet>
  )
}
