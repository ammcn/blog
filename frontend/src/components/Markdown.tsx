import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { PluggableList } from 'unified'

export default function Markdown({
  children,
  className = '',
  rehypePlugins,
}: {
  children: string
  className?: string
  rehypePlugins?: PluggableList
}) {
  return (
    <div className={`prose prose-neutral max-w-none ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={rehypePlugins}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
