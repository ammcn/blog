declare module '*.mdx' {
  import type { ComponentType } from 'react'
  export const frontmatter: {
    title: string
    date: string
    excerpt?: string
    tags?: string[]
    draft?: boolean
  }
  const Component: ComponentType
  export default Component
}
