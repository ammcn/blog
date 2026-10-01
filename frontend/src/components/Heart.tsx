import { Heart as HeartIcon } from 'lucide-react'
import { useLikes, useToggleLike } from '../likes'

/** Read-only count for list rows. */
export function HeartCount({ likes }: { likes?: { count: number; liked: boolean } }) {
  if (!likes) return null
  return (
    <span className="inline-flex items-center gap-1 text-sm text-ink/60">
      <HeartIcon size={14} className={likes.liked ? 'fill-ink/40 text-ink/40' : 'text-ink/40'} />
      {likes.count}
    </span>
  )
}

/** Toggle button for the post page. */
export function HeartButton({ slug }: { slug: string }) {
  const { data } = useLikes([slug])
  const toggle = useToggleLike(slug)
  const state = data?.[slug]
  return (
    <button
      className="inline-flex items-center gap-2 text-sm text-ink/60 disabled:opacity-40"
      aria-pressed={state?.liked ?? false}
      aria-label={state?.liked ? 'Remove heart' : 'Heart this post'}
      disabled={!state || toggle.isPending}
      onClick={() => toggle.mutate()}
    >
      <HeartIcon
        size={20}
        className={`transition text-red-400 ${state?.liked ? 'fill-red-400' : 'hover:fill-red-100'}`}
      />
      {state?.count ?? ''}
    </button>
  )
}
