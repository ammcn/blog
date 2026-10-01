import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (c) => (data += c))
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

async function isAuthenticated(req: IncomingMessage, apiUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${apiUrl}/api/auth/me/`, { headers: { cookie: req.headers.cookie ?? '' } })
    return res.ok && ((await res.json()) as { authenticated: boolean }).authenticated
  } catch {
    return false
  }
}

/** Dev-only: GET/PUT/DELETE /__posts/:slug reads or writes src/posts/<slug>.mdx for a signed-in Django session. */
export default function postWriter(
  dir = 'src/posts',
  apiUrl = process.env.API_URL ?? 'http://localhost:8000',
): Plugin {
  return {
    name: 'post-writer',
    apply: 'serve',
    configureServer(server) {
      const root = path.resolve(server.config.root, dir)
      server.middlewares.use('/__posts', async (req, res) => {
        const slug = (req.url ?? '').replace(/^\//, '').split('?')[0]
        if (!SLUG.test(slug)) return send(res, 400, { error: 'bad slug' })
        if (!(await isAuthenticated(req, apiUrl))) return send(res, 401, { error: 'sign in first' })
        const file = path.join(root, `${slug}.mdx`)
        try {
          if (req.method === 'GET') {
            return send(res, 200, { source: await fs.readFile(file, 'utf8') })
          }
          if (req.method === 'PUT') {
            await fs.mkdir(root, { recursive: true })
            await fs.writeFile(file, await readBody(req))
            return send(res, 200, { ok: true })
          }
          if (req.method === 'DELETE') {
            await fs.unlink(file)
            return send(res, 200, { ok: true })
          }
          send(res, 405, { error: 'method not allowed' })
        } catch (e) {
          send(res, (e as NodeJS.ErrnoException).code === 'ENOENT' ? 404 : 500, { error: String(e) })
        }
      })
    },
  }
}
