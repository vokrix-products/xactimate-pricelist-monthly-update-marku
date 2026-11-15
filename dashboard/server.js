import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readdir } from 'fs/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
app.use(express.json())

const apiDir = join(__dirname, 'api')
let handlers = {}
try {
  const files = await readdir(apiDir)
  for (const f of files) {
    if (f.endsWith('.js')) {
      const mod = await import(join(apiDir, f))
      handlers[f.replace('.js', '')] = mod.default
    }
  }
} catch {}

app.all('/api/:name', async (req, res) => {
  const handler = handlers[req.params.name]
  if (!handler) return res.status(404).json({ error: 'Not found' })
  try {
    await handler(req, res)
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

// Hashed build assets never change, so cache them for a year.
app.use('/assets', express.static(join(__dirname, 'dist', 'assets'), {
  immutable: true,
  maxAge: '1y',
}))

app.use(express.static(join(__dirname, 'dist'), { index: false }))

app.use((req, res) => {
  // A stale index.html can request chunk hashes that no longer exist.
  // Return a real 404 instead of index.html, which the browser rejects
  // with a "MIME type text/html" module script error.
  if (req.path.startsWith('/assets/')) {
    return res.status(404).type('text/plain').send('Asset not found')
  }
  res.set('Cache-Control', 'no-store, must-revalidate')
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

app.listen(3000, () => console.log('listening on 3000'))
