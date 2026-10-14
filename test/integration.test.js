// Frontend <-> backend integration tests. The real frontend modules (api.js and
// the data builders) talk to the real Express server, which is started on a free
// port with a throwaway data folder. No database, no production API, and the
// repo's be/data folder is never touched.

import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { access, readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createLoader } from './helpers.js'
import { startServer, makeClient } from '../../be/test/helpers.js'

const feRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const beRoot = path.resolve(feRoot, '..', 'be')

async function sourceFiles(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await sourceFiles(full)))
    else if (/\.(jsx?|mjs)$/.test(entry.name)) out.push(full)
  }
  return out
}

let server
let client
let loader
let api
let mods

before(async () => {
  server = await startServer()
  client = makeClient(server.base)
  loader = await createLoader({ env: { VITE_API_URL: server.base } })
  api = await loader.load('/src/utils/api.js')
  mods = {
    expenses: await loader.load('/src/utils/expenses.js'),
    matches: await loader.load('/src/utils/matches.js'),
    players: await loader.load('/src/data/players.js'),
    collections: await loader.load('/src/data/collections.js'),
  }
})

after(async () => {
  await loader.close()
  await server.stop()
})

describe('endpoint contract: what the frontend calls vs what the backend serves', () => {
  let frontendCalls
  let backendRoutes

  before(async () => {
    frontendCalls = new Set()
    for (const file of await sourceFiles(path.join(feRoot, 'src'))) {
      const text = await readFile(file, 'utf-8')
      for (const m of text.matchAll(/api(Get|Put)\(\s*'([^']+)'/g)) {
        frontendCalls.add(`${m[1].toUpperCase()} ${m[2]}`)
      }
    }
    const serverText = await readFile(path.join(beRoot, 'server.js'), 'utf-8')
    backendRoutes = new Set(
      [...serverText.matchAll(/app\.(get|put|post|patch|delete)\(\s*'(\/api\/[^']+)'/g)].map(
        (m) => `${m[1].toUpperCase()} ${m[2]}`,
      ),
    )
  })

  test('the frontend makes the 10 expected calls (GET + PUT for 5 resources)', () => {
    assert.deepEqual([...frontendCalls].sort(), [
      'GET /api/collections', 'GET /api/expenses', 'GET /api/matches', 'GET /api/players', 'GET /api/report-settings',
      'PUT /api/collections', 'PUT /api/expenses', 'PUT /api/matches', 'PUT /api/players', 'PUT /api/report-settings',
    ])
  })

  test('every frontend call has a backend route with the same method and path', () => {
    for (const call of frontendCalls) assert.ok(backendRoutes.has(call), `backend is missing: ${call}`)
  })

  test('no backend /api route is unused by the frontend (no dead endpoints)', () => {
    for (const route of backendRoutes) assert.ok(frontendCalls.has(route), `unused backend route: ${route}`)
  })

  test('every route the frontend uses actually answers over HTTP', async () => {
    for (const call of frontendCalls.values()) {
      if (!call.startsWith('GET ')) continue
      const r = await client.get(call.slice(4))
      assert.equal(r.status, 200, call)
    }
  })
})

describe('data-loss guard: saving must only be enabled after a SUCCESSFUL load', () => {
  test('no load effect marks data "loaded" in a .finally (a failed load must never enable saving)', async () => {
    const offenders = []
    let loadEffects = 0
    for (const file of await sourceFiles(path.join(feRoot, 'src'))) {
      if (path.basename(file) === 'api.js') continue // defines apiGet/apiPut rather than calling them
      const text = await readFile(file, 'utf-8')
      loadEffects += (text.match(/apiGet\(/g) || []).length
      if (/\.finally\(\s*\(\)\s*=>\s*\{[^}]*[lL]oadedRef\.current\s*=\s*true/.test(text)) offenders.push(path.basename(file))
    }
    assert.equal(loadEffects, 5, 'expected 5 load effects (players, matches, collections, expenses, report settings)')
    assert.deepEqual(offenders, [], `these files enable saving even when the load failed: ${offenders.join(', ')}`)
  })

  test('every save effect is gated on a loaded flag that is set inside the .then of the load', async () => {
    for (const file of await sourceFiles(path.join(feRoot, 'src'))) {
      if (path.basename(file) === 'api.js') continue
      const text = await readFile(file, 'utf-8')
      const puts = (text.match(/apiPut\(/g) || []).length
      const gates = (text.match(/if \(!(?:matches)?[lL]oadedRef\.current\) return/g) || []).length
      const sets = (text.match(/(?:matches)?[lL]oadedRef\.current = true/g) || []).length
      assert.equal(gates, puts, `${path.basename(file)}: every apiPut must be behind a loaded gate`)
      assert.equal(sets, puts, `${path.basename(file)}: the gate must be opened exactly where data is loaded`)
      // Each place the gate is opened must sit inside a .then (success), never a .finally.
      for (const m of text.matchAll(/(?:matches)?[lL]oadedRef\.current = true/g)) {
        const before = text.slice(0, m.index)
        assert.ok(
          before.lastIndexOf('.then(') > before.lastIndexOf('.finally('),
          `${path.basename(file)}: the loaded flag is set in a .finally, so a failed load would enable saving`,
        )
      }
    }
  })
})

describe('api.js against the real backend', () => {
  test('apiGet returns parsed JSON', async () => {
    const players = await api.apiGet('/api/players')
    assert.equal(players.length, 16)
  })

  test('apiPut sends a JSON body with a JSON content type (the backend rejects anything else)', async () => {
    const players = (await api.apiGet('/api/players')).map((p, i) => (i === 0 ? { ...p, batting: 25 } : p))
    assert.deepEqual(await api.apiPut('/api/players', players), { ok: true })
    assert.equal((await api.apiGet('/api/players'))[0].batting, 25)
  })

  test('a failed GET rejects with the method, path and status', async () => {
    await assert.rejects(() => api.apiGet('/api/nope'), /GET \/api\/nope failed: 404/)
  })

  test('a rejected PUT rejects with the 400 status instead of resolving', async () => {
    await assert.rejects(() => api.apiPut('/api/players', []), /PUT \/api\/players failed: 400/)
  })

  test('an unreachable backend rejects (the UI catches it and keeps defaults)', async () => {
    const dead = await createLoader({ env: { VITE_API_URL: 'http://127.0.0.1:9' } })
    try {
      const deadApi = await dead.load('/src/utils/api.js')
      await assert.rejects(() => deadApi.apiGet('/api/players'))
    } finally {
      await dead.close()
    }
  })

  test('a trailing slash on VITE_API_URL is tolerated (regression: "//api/players" was a 404 in production)', async () => {
    for (const suffix of ['/', '///']) {
      const slashed = await createLoader({ env: { VITE_API_URL: `${server.base}${suffix}` } })
      try {
        const slashedApi = await slashed.load('/src/utils/api.js')
        assert.equal((await slashedApi.apiGet('/api/players')).length, 16, JSON.stringify(suffix))
      } finally {
        await slashed.close()
      }
    }
  })
})

describe('payload contract: what the frontend builds is accepted by the backend validators', () => {
  test('players', async () => {
    const payload = mods.players.createInitialPlayers()
    assert.equal((await client.put('/api/players', payload)).status, 200)
    assert.deepEqual((await client.get('/api/players')).body, payload)
  })

  test('collections', async () => {
    const payload = mods.collections.createInitialCollections().map((c, i) => ({ ...c, amountPaid: i * 25 }))
    assert.equal((await client.put('/api/collections', payload)).status, 200)
    assert.deepEqual((await client.get('/api/collections')).body, payload)
  })

  test('expenses: periods built with createPeriod / nextPeriod / item builders', async () => {
    const { createPeriod, nextPeriod, newExpenseItem, newLineItem } = mods.expenses
    const october = createPeriod({
      label: "October '26", openingBalanceLabel: "September'26 balance", openingBalance: '300', editableOpening: true,
    })
    october.collectionAmount = 450
    october.income.push(newLineItem('Ball sold', '100'))
    october.expenses.push(newExpenseItem('Watercan', '50', '12/10/26'), newExpenseItem())
    const november = nextPeriod(october, "November '26")
    const payload = { periods: [october, november], activeId: november.id }
    assert.equal((await client.put('/api/expenses', payload)).status, 200)
    assert.deepEqual((await client.get('/api/expenses')).body, payload)
  })

  test('matches: records built with addMatchPoints / addMatchExpenses', async () => {
    let m = mods.matches.addMatchPoints([], '12/10/26', '1', 2, 'Nabeel', 'batting', 10)
    m = mods.matches.addMatchExpenses(m, '12/10/26', '1', [{ label: 'Watercan', amount: 50 }])
    m = mods.matches.addMatchPoints(m, '19/10/26', '2', 3, 'Tahir', 'fielding', 5)
    assert.equal((await client.put('/api/matches', m)).status, 200)
    assert.deepEqual((await client.get('/api/matches')).body, m)
  })

  test('report settings: the frontend default shape round-trips (including string wins/losses)', async () => {
    const settings = {
      monthLabel: "October '26", tillDate: '14/10/26', matchesPlayed: '3',
      wins: '2', losses: '1', showWinsLosses: true, customMessage: '',
    }
    assert.equal((await client.put('/api/report-settings', settings)).status, 200)
    assert.deepEqual((await client.get('/api/report-settings')).body, settings)
  })

  test("the backend's default report settings contain every field the frontend expects", async () => {
    const own = await startServer()
    try {
      const body = (await makeClient(own.base).get('/api/report-settings')).body
      for (const key of ['monthLabel', 'tillDate', 'matchesPlayed', 'wins', 'losses', 'showWinsLosses', 'customMessage']) {
        assert.ok(key in body, key)
      }
    } finally {
      await own.stop()
    }
  })
})

describe('end-to-end flow without a browser: load -> change -> save -> reload', () => {
  test('points added the way App.jsx does survive a reload, and the per-match log agrees', async () => {
    const { addMatchPoints } = mods.matches
    let players = await api.apiGet('/api/players')
    let matches = []
    await api.apiPut('/api/matches', matches)

    const give = (id, category, pts) => {
      const name = players.find((p) => p.id === id).name
      players = players.map((p) => (p.id === id ? { ...p, [category]: p[category] + pts } : p))
      matches = addMatchPoints(matches, '14/10/26', '4', id, name, category, pts)
    }
    give(2, 'batting', 10)
    give(2, 'batting', 20)
    give(6, 'bowling', 10)
    give(6, 'bowling', -10)

    await api.apiPut('/api/players', players)
    await api.apiPut('/api/matches', matches)

    const reloadedPlayers = await api.apiGet('/api/players')
    const reloadedMatches = await api.apiGet('/api/matches')
    assert.equal(reloadedPlayers.find((p) => p.id === 2).batting, 30)
    assert.equal(reloadedPlayers.find((p) => p.id === 6).bowling, 0)
    assert.equal(reloadedMatches.length, 1)
    assert.deepEqual(reloadedMatches[0].points.map((p) => p.playerId), [2], 'player 6 was fully undone')
  })
})

describe('CORS and configuration', () => {
  test('preflight succeeds from the local dev origin and the deployed Vercel origin', async () => {
    for (const origin of ['http://localhost:5173', 'https://dbcc-frontend.vercel.app']) {
      const res = await fetch(`${server.base}/api/expenses`, {
        method: 'OPTIONS',
        headers: {
          Origin: origin,
          'Access-Control-Request-Method': 'PUT',
          'Access-Control-Request-Headers': 'content-type',
        },
      })
      assert.equal(res.status, 204, origin)
      assert.equal(res.headers.get('access-control-allow-origin'), '*', origin)
    }
  })

  test('.env.example, api.js fallback and the backend default port all agree on localhost:4000', async () => {
    const example = await readFile(path.join(feRoot, '.env.example'), 'utf-8')
    assert.match(example, /^VITE_API_URL=http:\/\/localhost:4000\s*$/m)
    assert.match(await readFile(path.join(feRoot, 'src', 'utils', 'api.js'), 'utf-8'), /'http:\/\/localhost:4000'/)
    assert.match(await readFile(path.join(beRoot, 'server.js'), 'utf-8'), /process\.env\.PORT \|\| 4000/)
  })

  test('real env files and live data files are git-ignored; .env.example stays tracked', () => {
    const ignored = (cwd, file) => spawnSync('git', ['check-ignore', '-q', file], { cwd }).status === 0
    assert.equal(ignored(feRoot, '.env'), true)
    assert.equal(ignored(feRoot, '.env.local'), true)
    assert.equal(ignored(feRoot, '.env.example'), false)
    assert.equal(ignored(feRoot, 'dist/index.html'), true)
    assert.equal(ignored(beRoot, '.env'), true)
    assert.equal(ignored(beRoot, 'data/players.json'), true, 'real club data must never be committed')
    assert.equal(ignored(beRoot, 'server.js'), false)
  })

  test('index.html has a valid favicon that exists in public/ and leaks no local file path', async () => {
    const html = await readFile(path.join(feRoot, 'index.html'), 'utf-8')
    const href = html.match(/<link rel="icon"[^>]*\shref="([^"]*)"/)?.[1]
    assert.ok(href && href.startsWith('/'), `favicon href should be a site path, got: ${href}`)
    await access(path.join(feRoot, 'public', href))
    assert.doesNotMatch(html, /[A-Za-z]:\\|\\Users\\|WhatsApp/, 'no local Windows path in the shipped HTML')
    assert.doesNotMatch(html, /href=""/, 'no malformed doubled quotes')
  })

  test('the frontend source never references a database or a hard-coded production API', async () => {
    for (const file of await sourceFiles(path.join(feRoot, 'src'))) {
      const text = await readFile(file, 'utf-8')
      assert.doesNotMatch(text, /onrender\.com|vercel\.app|mongodb|mongoose|postgres|sqlite/i, file)
    }
  })
})
