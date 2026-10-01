import { useEffect, useState, type ComponentType } from 'react'
import * as runtime from 'react/jsx-runtime'
import { evaluate } from '@mdx-js/mdx'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { Status } from './Section'

/** Compiles MDX in the browser with the same plugins as the build, so the preview matches the post page. */
export default function MdxPreview({ source }: { source: string }) {
  const [Content, setContent] = useState<ComponentType | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const t = setTimeout(async () => {
      try {
        const mod = await evaluate(source, {
          ...runtime,
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeHighlight],
        })
        if (cancelled) return
        setContent(() => mod.default)
        setError(null)
      } catch (e) {
        if (!cancelled) setError((e as Error).message)
      }
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [source])

  if (!source.trim()) return <Status>Preview</Status>
  return (
    <>
      {error && <pre className="text-xs text-red-700 whitespace-pre-wrap mb-4">{error}</pre>}
      <div className="prose prose-neutral max-w-none">{Content && <Content />}</div>
    </>
  )
}
