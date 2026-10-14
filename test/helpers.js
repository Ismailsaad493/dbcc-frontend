// Loads the real frontend source modules (the same files the browser runs)
// through Vite's SSR loader, so extensionless imports and import.meta.env work
// in plain `node --test` with no extra dependencies.

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const feRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export async function createLoader({ env = {} } = {}) {
  const saved = {}
  for (const [key, value] of Object.entries(env)) {
    saved[key] = process.env[key]
    process.env[key] = value
  }
  const vite = await createServer({
    root: feRoot,
    configFile: false,
    logLevel: 'silent',
    appType: 'custom',
    server: { middlewareMode: true, hmr: false, watch: null },
  })
  return {
    load: (file) => vite.ssrLoadModule(file),
    async close() {
      await vite.close()
      for (const [key, value] of Object.entries(saved)) {
        if (value === undefined) delete process.env[key]
        else process.env[key] = value
      }
    },
  }
}
