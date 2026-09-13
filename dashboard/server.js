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

app.use(express.static(join(__dirname, 'dist')))
app.get('*', (req, res) => res.sendFile(join(__dirname, 'dist', 'index.html')))

app.listen(3000, () => console.log('listening on 3000'))
