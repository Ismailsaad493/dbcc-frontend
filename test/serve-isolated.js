// Starts the Vite dev server on port 5174 wired to the isolated test backend
// (http://localhost:4100, see be/test/serve-isolated.js), so browser testing
// never talks to the normal backend or its data.

import path from 'node:path'
import { fileURLToPath } from 'node:url'

process.env.VITE_API_URL = process.env.VITE_API_URL || 'http://localhost:4100'

const { createServer } = await import('vite')
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const server = await createServer({ root, server: { port: 5174, strictPort: true } })
await server.listen()
server.printUrls()
