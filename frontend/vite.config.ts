import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import postWriter from './plugins/postWriter.js'
import stripDrafts from './plugins/stripDrafts.js'

export default defineConfig({
  plugins: [
    stripDrafts(),
    {
      enforce: 'pre',
      ...mdx({
        remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkGfm],
        rehypePlugins: [rehypeHighlight],
      }),
    },
    react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
    tailwindcss(),
    postWriter(),
  ],
  // The lazy WritePage chunk bundles the MDX compiler and editor; it is dev-only and never fetched in production.
  build: { chunkSizeWarningLimit: 1500 },
  server: {
    proxy: { '/api': process.env.API_URL ?? 'http://localhost:8000' },
  },
})
