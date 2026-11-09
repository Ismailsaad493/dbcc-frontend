// Strip any trailing slash so a path like "/api/players" never doubles up
// into "...com//api/players" regardless of how VITE_API_URL is set.
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/+$/, '')

async function throwResponseError(res, method, path) {
  let message
  try {
    const body = await res.json()
    if (typeof body?.error === 'string') message = body.error
    else if (typeof body?.title === 'string') message = body.title
  } catch {
    // Keep a useful status message when the server didn't return JSON.
  }
  const statusMessage = `${method} ${path} failed: ${res.status}`
  throw new Error(message ? `${statusMessage} — ${message}` : statusMessage)
}

export async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) await throwResponseError(res, 'GET', path)
  return res.json()
}

export async function apiPut(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) await throwResponseError(res, 'PUT', path)
  return res.json()
}
