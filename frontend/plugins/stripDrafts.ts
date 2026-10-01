import type { Plugin } from 'vite'

/** Production builds replace draft posts with an empty stub so their text never ships in the bundle. */
export default function stripDrafts(dir = '/src/posts/'): Plugin {
  let isBuild = false
  return {
    name: 'strip-drafts',
    enforce: 'pre',
    configResolved(config) {
      isBuild = config.command === 'build'
    },
    transform(code, id) {
      if (!isBuild || !id.includes(dir) || !id.endsWith('.mdx')) return
      const fm = code.match(/^---\n([\s\S]*?)\n---/)
      if (fm && /^draft:\s*true\s*$/m.test(fm[1])) return '---\ntitle: ""\ndate: ""\ndraft: true\n---\n'
    },
  }
}
