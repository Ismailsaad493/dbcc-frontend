// Unit tests for the frontend's pure logic modules. They load the real source
// files via Vite's SSR loader (helpers.js) — no mocks, no network, no database.

import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createLoader } from './helpers.js'

let loader
let expenses, stats, matches, collections, order, actions, players, dateFormat

before(async () => {
  loader = await createLoader()
  ;[expenses, stats, matches, collections, order, actions, players, dateFormat] = await Promise.all([
    loader.load('/src/utils/expenses.js'),
    loader.load('/src/utils/stats.js'),
    loader.load('/src/utils/matches.js'),
    loader.load('/src/data/collections.js'),
    loader.load('/src/data/playerOrder.js'),
    loader.load('/src/data/actions.js'),
    loader.load('/src/data/players.js'),
    loader.load('/src/utils/dateFormat.js'),
  ])
})

after(async () => {
  await loader.close()
})

describe('utils/expenses — periods and totals', () => {
  test('defaultCollectionLabel builds "<Month> collection" and falls back when empty', () => {
    assert.equal(expenses.defaultCollectionLabel("October '26"), 'October collection')
    assert.equal(expenses.defaultCollectionLabel('September'), 'September collection')
    assert.equal(expenses.defaultCollectionLabel(''), 'This month collection')
    assert.equal(expenses.defaultCollectionLabel("'26"), 'This month collection')
  })

  test('createPeriod coerces the opening balance and never produces NaN', () => {
    const base = { label: "October '26", openingBalanceLabel: 'x', editableOpening: true }
    assert.equal(expenses.createPeriod({ ...base, openingBalance: '300' }).openingBalance, 300)
    assert.equal(expenses.createPeriod({ ...base, openingBalance: '' }).openingBalance, 0)
    assert.equal(expenses.createPeriod({ ...base, openingBalance: 'abc' }).openingBalance, 0)
    assert.equal(expenses.createPeriod({ ...base, openingBalance: undefined }).openingBalance, 0)
    const p = expenses.createPeriod({ ...base, openingBalance: 5 })
    assert.deepEqual([p.income, p.expenses, p.collectionAmount], [[], [], ''])
    assert.equal(p.collectionLabel, 'October collection')
    assert.equal(p.editableOpening, true)
  })

  test('generated ids are unique', () => {
    const ids = new Set(Array.from({ length: 500 }, () => expenses.newExpenseItem().id))
    assert.equal(ids.size, 500)
  })

  test('totals handles string amounts, blanks and junk without NaN', () => {
    const t = expenses.totals({
      openingBalance: 300,
      collectionAmount: '5100',
      income: [{ amount: '100' }, { amount: '' }, { amount: 'abc' }],
      expenses: [{ amount: '30' }, { amount: 100 }, { amount: 'x' }, {}],
    })
    assert.deepEqual(t, { incomeSum: 5200, expenseSum: 130, totalCollection: 5500, inHand: 5370 })
  })

  test('totals: an empty collection box counts as 0 and in-hand can go negative', () => {
    const t = expenses.totals({
      openingBalance: 0, collectionAmount: '', income: [], expenses: [{ amount: '50' }],
    })
    assert.equal(t.inHand, -50)
    assert.ok(Object.values(t).every(Number.isFinite))
  })

  test('nextPeriod carries last month in-hand forward as a locked opening balance', () => {
    const prev = {
      label: "October '26", openingBalance: 300, collectionAmount: '1000',
      income: [], expenses: [{ amount: '200' }],
    }
    const next = expenses.nextPeriod(prev, "November '26")
    assert.equal(next.openingBalance, 1100)
    assert.equal(next.openingBalanceLabel, "October '26 balance")
    assert.equal(next.editableOpening, false)
    assert.equal(next.label, "November '26")
    assert.equal(next.collectionLabel, 'November collection')
  })

  test('defaultMatchDayItems pre-fills Watercan and Banana', () => {
    assert.deepEqual(expenses.defaultMatchDayItems().map((i) => i.label), ['Watercan', 'Banana'])
  })
})

describe('utils/expenses — first-month labels (describeFirstMonth)', () => {
  const d = (monthIndex, year) => expenses.describeFirstMonth({ monthIndex, year })

  test('derives this month, last month balance and collection labels', () => {
    assert.deepEqual(d(9, '26'), {
      monthLabel: "October '26",
      lastMonthLabel: "September'26 balance",
      collectionLabel: 'October collection',
    })
    assert.equal(d(11, '26').lastMonthLabel, "November'26 balance")
    assert.equal(expenses.MONTHS.length, 12)
  })

  test('January rolls back to December of the previous year, including 00 -> 99 and zero padding', () => {
    assert.equal(d(0, '26').lastMonthLabel, "December'25 balance")
    assert.equal(d(0, '10').lastMonthLabel, "December'09 balance")
    assert.equal(d(0, '00').lastMonthLabel, "December'99 balance")
  })

  test('a blank or non-numeric year never produces a negative-year label', () => {
    for (const bad of ['', 'abc']) {
      assert.doesNotMatch(d(0, bad).lastMonthLabel, /-\d/, JSON.stringify(bad))
    }
  })
})

describe('loading saved data — malformed shapes must not crash the app', () => {
  test('migrateState repairs a period with no income/expenses arrays (the white-screen case)', () => {
    const state = expenses.migrateState({ periods: [{ id: 'p', label: "October '26" }], activeId: 'p' })
    const [p] = state.periods
    assert.deepEqual([p.income, p.expenses], [[], []])
    assert.equal(p.openingBalance, 0)
    assert.equal(p.collectionLabel, 'October collection')
    assert.doesNotThrow(() => expenses.totals(p))
    assert.ok(Object.values(expenses.totals(p)).every(Number.isFinite))
  })

  test('migrateState drops junk entries and coerces wrong types', () => {
    const state = expenses.migrateState({
      periods: [null, 5, 'x', [], { id: 'a', label: 7, openingBalance: 'abc', income: 'none', expenses: [null, { amount: '5' }] }],
      activeId: 'gone',
    })
    assert.equal(state.periods.length, 1)
    const [p] = state.periods
    assert.deepEqual([p.label, p.openingBalance, p.income], ['', 0, []])
    assert.deepEqual(p.expenses, [{ amount: '5' }])
    assert.equal(state.activeId, 'gone', 'the UI falls back to the last period when activeId is stale')
  })

  test('migrateState keeps valid data exactly as saved, and fills in older periods', () => {
    const saved = {
      id: 'p1', label: "October '26", openingBalanceLabel: 'x', openingBalance: 300, editableOpening: true,
      collectionLabel: 'Custom label', collectionAmount: 450,
      income: [{ id: 'i', label: 'Ball sold', amount: '100' }], expenses: [{ id: 'e', label: 'W', amount: '5', date: '12/10' }],
    }
    assert.deepEqual(expenses.migrateState({ periods: [saved], activeId: 'p1' }), { periods: [saved], activeId: 'p1' })
    const old = { id: 'o', label: "September '26", openingBalanceLabel: 'b', openingBalance: 1, editableOpening: false, income: [], expenses: [] }
    const [migrated] = expenses.migrateState({ periods: [old], activeId: 'o' }).periods
    assert.equal(migrated.collectionLabel, 'September collection')
    assert.equal(migrated.collectionAmount, '')
  })

  test('migrateState handles garbage input', () => {
    for (const bad of [null, undefined, 5, 'x', {}, { periods: 'nope' }]) {
      assert.deepEqual(expenses.migrateState(bad), { periods: [], activeId: null })
    }
  })

  test('mergeReportSettings ignores wrong-typed saved fields instead of crashing the report', async () => {
    const { mergeReportSettings } = await loader.load('/src/utils/reportSettings.js')
    const defaults = {
      monthLabel: "October '26", tillDate: '14/10/26', matchesPlayed: 1, wins: '', losses: '',
      showWinsLosses: false, customMessage: '',
    }
    const merged = mergeReportSettings(defaults, {
      monthLabel: 5, tillDate: null, matchesPlayed: { a: 1 }, wins: [1], losses: true, showWinsLosses: 'yes', customMessage: 42,
    })
    assert.deepEqual(merged, defaults)
    assert.equal(typeof merged.monthLabel.toUpperCase(), 'string')
    for (const bad of [null, undefined, 'x', 5, []]) assert.deepEqual(mergeReportSettings(defaults, bad), defaults)
  })

  test('mergeReportSettings keeps valid saved values (numeric or text counts)', async () => {
    const { mergeReportSettings } = await loader.load('/src/utils/reportSettings.js')
    const defaults = { monthLabel: 'a', tillDate: 'b', matchesPlayed: 1, wins: '', losses: '', showWinsLosses: false, customMessage: '' }
    const saved = { monthLabel: "Nov '26", tillDate: '05/11/26', matchesPlayed: '7', wins: 4, losses: '2', showWinsLosses: true, customMessage: 'hi' }
    assert.deepEqual(mergeReportSettings(defaults, saved), saved)
  })

  test('normalizeMatches repairs the malformed match that crashed Match History', () => {
    const out = matches.normalizeMatches([
      { id: 'x__1', date: '12/10/26', matchNumber: '1', points: [null, 'junk', { playerId: 2, batting: '7' }], expenses: [{ label: 5 }, null, { label: 'Ice', amount: '20' }] },
      null,
      { noId: true },
    ])
    assert.equal(out.length, 1)
    assert.deepEqual(out[0].points, [{ playerId: 2, batting: 7, bowling: 0, fielding: 0 }])
    assert.deepEqual(out[0].expenses, [{ label: '5', amount: 0 }, { label: 'Ice', amount: 20 }])
  })

  test('normalizeMatches leaves valid records unchanged and tolerates non-arrays', () => {
    const good = [{
      id: '12/10/26__1', date: '12/10/26', matchNumber: '1',
      points: [{ playerId: 2, playerName: 'Nabeel', batting: 10, bowling: 0, fielding: 5 }],
      expenses: [{ label: 'Watercan', amount: 50 }],
    }]
    assert.deepEqual(matches.normalizeMatches(good), good)
    for (const bad of [null, undefined, {}, 'x', 5]) assert.deepEqual(matches.normalizeMatches(bad), [])
  })
})

describe('money rounding — no floating-point noise in totals', () => {
  test('roundMoney rounds to 2 decimals and tolerates junk', async () => {
    const { roundMoney } = await loader.load('/src/utils/money.js')
    assert.equal(0.1 + 0.2, 0.30000000000000004, 'sanity: the raw JS sum really is noisy')
    assert.equal(roundMoney(0.1 + 0.2), 0.3)
    assert.equal(roundMoney(150.5 + 149.6), 300.1)
    assert.equal(roundMoney(2.005 * 100), 200.5)
    assert.equal(roundMoney('abc'), 0)
    assert.equal(roundMoney(undefined), 0)
    assert.equal(roundMoney(-5), -5)
  })

  test('expense totals and group subtotals are clean for decimal amounts', () => {
    const t = expenses.totals({
      openingBalance: 0.1, collectionAmount: '0.2', income: [{ amount: '0.7' }],
      expenses: [{ amount: '0.1' }, { amount: '0.2' }],
    })
    assert.deepEqual(t, { incomeSum: 0.9, expenseSum: 0.3, totalCollection: 1, inHand: 0.7 })
    const [g] = expenses.groupExpensesByDate([{ amount: '0.1', date: '01/01' }, { amount: '0.2', date: '01/01' }])
    assert.equal(g.subtotal, 0.3)
  })

  test('pending list shows a clean amount still owed for decimal payments', () => {
    const text = collections.formatPendingText([{ id: 1, name: 'Bilal', amountPaid: 0.1 + 0.2 }])
    assert.match(text, /1\. Bilal\(₹299\.7\)/)
  })
})

describe('utils/expenses — grouping by match day', () => {
  const item = (date, amount, label = 'x') => ({ id: Math.random(), label, amount, date })

  test('groups by date, sorts chronologically, undated goes last, subtotals add up', () => {
    const groups = expenses.groupExpensesByDate([
      item('05/11', '10'), item('28/10', '20'), item('', '5'), item('12/10', '1'),
      item(' 12/10 ', '2'), item(undefined, '4'), item('12/10/26', '3'),
    ])
    assert.deepEqual(groups.map((g) => g.date), ['12/10', '12/10/26', '28/10', '05/11', ''])
    assert.deepEqual(groups.map((g) => g.subtotal), [3, 3, 20, 10, 9])
  })

  test('returns nothing for no expenses', () => {
    assert.deepEqual(expenses.groupExpensesByDate([]), [])
  })
})

describe('utils/expenses — WhatsApp summary text', () => {
  test('matches the exact format the club asked for', () => {
    const text = expenses.formatSummaryText({
      label: "October '26",
      openingBalanceLabel: "September'26 balance",
      openingBalance: 300,
      collectionLabel: 'October collection',
      collectionAmount: '5100',
      income: [],
      expenses: [
        { label: 'Watercan', amount: '30', date: '12/10' },
        { label: 'Banana', amount: '100', date: '12/10' },
        { label: 'juice', amount: '200', date: '12/10' },
      ],
    })
    assert.equal(
      text,
      [
        'FYI:-',
        "September'26 balance - 300",
        'October collection - 5100',
        'Total collection - 5400',
        '',
        "October '26 expenses:",
        '12/10',
        'Watercan - 30',
        'Banana - 100',
        'juice - 200',
        'Total expense - 330',
        '',
        '= 5400 - 330 = 5070',
        '',
        '₹5070 in-hand till now.',
      ].join('\n'),
    )
  })

  test('blank-labelled items are skipped, blank amounts print 0, other income is listed', () => {
    const text = expenses.formatSummaryText({
      label: "Nov '26", openingBalanceLabel: 'Open', openingBalance: 0,
      collectionLabel: 'Nov collection', collectionAmount: '',
      income: [{ label: 'Ball sold', amount: '' }, { label: '', amount: '9' }],
      expenses: [{ label: '', amount: '7', date: '01/11' }, { label: 'Ice', amount: '', date: '01/11' }],
    })
    assert.match(text, /Ball sold - 0/)
    assert.match(text, /Nov collection - 0/)
    assert.match(text, /\n01\/11\nIce - 0\n/)
    assert.doesNotMatch(text, /^ - 7$/m, 'an item with no label gets no line of its own')
  })
})

describe('utils/stats — leaderboard', () => {
  const P = (name, batting, bowling, fielding) => ({ name, batting, bowling, fielding })

  test('getRanked sorts by total, adds total, and does not mutate its input', () => {
    const input = [P('a', 5, 5, 0), P('b', 1, 1, 1), P('c', 20, 0, 0)]
    const copy = JSON.stringify(input)
    const ranked = stats.getRanked(input)
    assert.deepEqual(ranked.map((p) => [p.name, p.total]), [['c', 20], ['a', 10], ['b', 3]])
    assert.equal(JSON.stringify(input), copy)
  })

  test('topBy returns the leader, the first on a tie, and null when nobody has points', () => {
    assert.equal(stats.topBy([P('a', 5, 0, 0), P('b', 9, 0, 0)], 'batting').name, 'b')
    assert.equal(stats.topBy([P('a', 5, 0, 0), P('b', 5, 0, 0)], 'batting').name, 'a')
    assert.equal(stats.topBy([P('a', 0, 0, 0)], 'batting'), null)
    assert.equal(stats.topBy([P('a', -5, 0, 0)], 'batting'), null)
    assert.equal(stats.topBy([], 'batting'), null)
  })

  test('getLeaders: no overall leader when every total is zero or negative', () => {
    assert.equal(stats.getLeaders([P('a', 0, 0, 0)]).overallLeader, null)
    assert.equal(stats.getLeaders([P('a', -10, 0, 0)]).overallLeader, null)
    assert.equal(stats.getLeaders([P('a', 5, 5, 5)]).overallLeader.name, 'a')
    assert.equal(stats.getLeaders([]).overallLeader, null)
  })
})

describe('utils/dateFormat — auto-inserted slashes', () => {
  const f = (s) => dateFormat.formatDateInput(s)

  test('formats digits into dd/mm/yy as they are typed', () => {
    const typed = ['1', '12', '12/1', '12/10', '12/10/2', '12/10/26']
    assert.deepEqual(['1', '12', '121', '1210', '12102', '121026'].map(f), typed)
  })
  test('is idempotent on already formatted input', () => {
    assert.equal(f('12/10/26'), '12/10/26')
    assert.equal(f(f('12/10/26')), '12/10/26')
  })
  test('strips letters and symbols, and handles empty input', () => {
    assert.equal(f(''), '')
    assert.equal(f('ab12cd'), '12')
    assert.equal(f('//--'), '')
    assert.equal(f('12-10-26'), '12/10/26')
  })
  test('never exceeds dd/mm/yy (8 characters)', () => {
    assert.equal(f('1210269999').length, 8)
  })
  test('backspacing over an auto-inserted slash still yields a clean value', () => {
    assert.equal(f('12/1'.slice(0, -1)), '12')
  })
  test('a 4-digit year is not mangled into the wrong year', { todo: 'known limitation: 12/10/2026 becomes 12/10/20 (see report)' }, () => {
    assert.equal(f('12102026'), '12/10/26')
  })
})

describe('utils/dateFormat — isValidDate (mandatory Match Date check)', () => {
  const v = (s) => dateFormat.isValidDate(s)

  test('accepts complete, real dates', () => {
    for (const ok of ['12/10/26', '01/01/26', '31/12/26', '29/02/28', '30/04/26']) assert.equal(v(ok), true, ok)
  })
  test('rejects partial input', () => {
    for (const bad of ['', '1', '12', '12/1', '12/10', '12/10/2', '12/10/266', '1/1/26']) assert.equal(v(bad), false, bad)
  })
  test('rejects impossible dates, including leap-day and month-length cases', () => {
    for (const bad of ['00/00/00', '32/13/26', '31/02/26', '29/02/26', '31/04/26', '00/10/26', '12/00/26', '12/13/26']) {
      assert.equal(v(bad), false, bad)
    }
  })
  test('rejects non-date text and other separators', () => {
    for (const bad of ['ab/cd/ef', '12-10-26', '12.10.26', ' 12/10/26', '12/10/26 ', '12/10/2026']) assert.equal(v(bad), false, bad)
  })
  test('whatever formatDateInput produces from 6 digits is valid when the digits form a real date', () => {
    assert.equal(v(dateFormat.formatDateInput('121026')), true)
    assert.equal(v(dateFormat.formatDateInput('319926')), false)
  })
})

describe('utils/matches — per-match points and expenses log', () => {
  const add = (m, date, num, id, name, cat, d) => matches.addMatchPoints(m, date, num, id, name, cat, d)

  test('matchId trims whitespace so the same match is never split in two', () => {
    assert.equal(matches.matchId(' 12/10/26 ', ' 1 '), '12/10/26__1')
  })

  test('creates a match and a player entry on first points', () => {
    const m = add([], '12/10/26', '1', 2, 'Nabeel', 'batting', 10)
    assert.deepEqual(m, [{
      id: '12/10/26__1', date: '12/10/26', matchNumber: '1', expenses: [],
      points: [{ playerId: 2, playerName: 'Nabeel', batting: 10, bowling: 0, fielding: 0 }],
    }])
  })

  test('accumulates per category, per player, per match', () => {
    let m = add([], '12/10/26', '1', 2, 'Nabeel', 'batting', 10)
    m = add(m, '12/10/26', '1', 2, 'Nabeel', 'batting', 20)
    m = add(m, '12/10/26', '1', 2, 'Nabeel', 'bowling', 5)
    m = add(m, '12/10/26', '1', 3, 'Tahir', 'fielding', 10)
    m = add(m, '19/10/26', '2', 2, 'Nabeel', 'batting', 7)
    assert.equal(m.length, 2)
    const first = m.find((x) => x.id === '12/10/26__1')
    assert.deepEqual(first.points.find((p) => p.playerId === 2), {
      playerId: 2, playerName: 'Nabeel', batting: 30, bowling: 5, fielding: 0,
    })
    assert.equal(first.points.length, 2)
    assert.equal(m.find((x) => x.id === '19/10/26__2').points[0].batting, 7)
  })

  test('does not mutate the array it is given', () => {
    const original = add([], '12/10/26', '1', 2, 'Nabeel', 'batting', 10)
    const snapshot = JSON.stringify(original)
    add(original, '12/10/26', '1', 2, 'Nabeel', 'batting', 99)
    assert.equal(JSON.stringify(original), snapshot)
  })

  test('undoing the only points a player got removes them from that match', () => {
    let m = add([], '12/10/26', '1', 2, 'Nabeel', 'batting', 10)
    m = add(m, '12/10/26', '1', 2, 'Nabeel', 'batting', -10)
    assert.equal(m.length, 1, 'the match record itself is kept')
    assert.deepEqual(m[0].points, [], 'a player with all-zero points must not count as having scored')
  })

  test('a player with some points left stays after a partial undo', () => {
    let m = add([], '12/10/26', '1', 2, 'Nabeel', 'batting', 10)
    m = add(m, '12/10/26', '1', 2, 'Nabeel', 'bowling', 5)
    m = add(m, '12/10/26', '1', 2, 'Nabeel', 'batting', -10)
    assert.equal(m[0].points.length, 1)
    assert.equal(m[0].points[0].bowling, 5)
  })

  test('clearMatchPlayerCategory zeroes one category for one player in one match only', () => {
    let m = add([], '12/10/26', '1', 2, 'Nabeel', 'batting', 30)
    m = add(m, '12/10/26', '1', 2, 'Nabeel', 'bowling', 5)
    m = add(m, '12/10/26', '1', 3, 'Tahir', 'batting', 8)
    m = add(m, '19/10/26', '2', 2, 'Nabeel', 'batting', 7)
    const cleared = matches.clearMatchPlayerCategory(m, '12/10/26', '1', 2, 'batting')
    const first = cleared.find((x) => x.id === '12/10/26__1')
    assert.deepEqual(first.points.find((p) => p.playerId === 2), {
      playerId: 2, playerName: 'Nabeel', batting: 0, bowling: 5, fielding: 0,
    })
    assert.equal(first.points.find((p) => p.playerId === 3).batting, 8, 'other players untouched')
    assert.equal(cleared.find((x) => x.id === '19/10/26__2').points[0].batting, 7, 'other matches untouched')
  })

  test('clearMatchPlayerCategory drops a player left with no points, and ignores unknown matches', () => {
    const m = add([], '12/10/26', '1', 2, 'Nabeel', 'batting', 30)
    assert.deepEqual(matches.clearMatchPlayerCategory(m, '12/10/26', '1', 2, 'batting')[0].points, [])
    assert.equal(matches.clearMatchPlayerCategory(m, '01/01/26', '9', 2, 'batting'), m)
  })

  test('addMatchExpenses appends, creates the match when needed, ignores empty lists', () => {
    const items = [{ label: 'Watercan', amount: 50 }]
    const created = matches.addMatchExpenses([], '12/10/26', '1', items)
    assert.deepEqual(created[0].expenses, items)
    const appended = matches.addMatchExpenses(created, '12/10/26', '1', [{ label: 'Banana', amount: 20 }])
    assert.equal(appended.length, 1)
    assert.equal(appended[0].expenses.length, 2)
    const same = []
    assert.equal(matches.addMatchExpenses(same, '12/10/26', '1', []), same)
  })
})

describe('data/collections — payment status and pending list', () => {
  test('paymentStatus boundaries around the ₹300 contribution', () => {
    const s = collections.paymentStatus
    assert.equal(collections.FULL_AMOUNT, 300)
    assert.deepEqual([0, 1, 150, 299, 300, 301, 1000].map(s), [
      'Not Paid', 'Partially Paid', 'Partially Paid', 'Partially Paid', 'Paid', 'Paid', 'Paid',
    ])
    assert.equal(s(-5), 'Not Paid')
    assert.equal(s(NaN), 'Not Paid')
  })

  test('createInitialCollections lists the 16 players at ₹0', () => {
    const c = collections.createInitialCollections()
    assert.equal(c.length, 16)
    assert.deepEqual(c.map((x) => x.id), Array.from({ length: 16 }, (_, i) => i + 1))
    assert.ok(c.every((x) => x.amountPaid === 0))
  })

  test('formatPendingText: numbered, partial payers show the amount still owed', () => {
    const text = collections.formatPendingText([
      { id: 1, name: 'Bilal', amountPaid: 150 },
      { id: 2, name: 'Danish', amountPaid: 0 },
      { id: 3, name: 'Eathu', amountPaid: 300 },
      { id: 4, name: 'Faizal', amountPaid: 350 },
      { id: 5, name: 'Saif', amountPaid: 1 },
    ])
    assert.equal(
      text,
      ['Awaiting contribution from the below.', '', '1. Bilal(₹150)', '2. Danish', '3. Saif(₹299)'].join('\n'),
    )
  })

  test('formatPendingText when everyone has paid', () => {
    const text = collections.formatPendingText([{ id: 1, name: 'A', amountPaid: 300 }])
    assert.match(text, /Everyone has paid in full/)
    assert.doesNotMatch(text, /^\d\./m)
  })
})

describe('data/playerOrder — custom ordering', () => {
  const initial = () => players.createInitialPlayers()

  test('batting and bowling orders are each exactly the 16 roster names', () => {
    const roster = [...players.PLAYER_NAMES].sort()
    assert.deepEqual([...order.BATTING_ORDER].sort(), roster)
    assert.deepEqual([...order.BOWLING_ORDER].sort(), roster)
  })

  test('sortByNameOrder applies the batting and bowling orders', () => {
    assert.deepEqual(order.sortByNameOrder(initial(), order.BATTING_ORDER).map((p) => p.name), order.BATTING_ORDER)
    assert.deepEqual(order.sortByNameOrder(initial(), order.BOWLING_ORDER).map((p) => p.name), order.BOWLING_ORDER)
  })

  test('is case-insensitive, puts unknown names last, and does not mutate', () => {
    const input = [{ name: 'ZZZ' }, { name: 'NABEEL' }, { name: 'mujahid' }]
    const snapshot = JSON.stringify(input)
    const out = order.sortByNameOrder(input, order.BATTING_ORDER).map((p) => p.name)
    assert.deepEqual(out, ['NABEEL', 'mujahid', 'ZZZ'])
    assert.equal(JSON.stringify(input), snapshot)
  })

  test('sortAlphabetical gives the order shown in Attendance / Collections', () => {
    assert.deepEqual(order.sortAlphabetical(initial()).map((p) => p.name), [
      'Bilal', 'Danish', 'Eathu', 'Faizal', 'Firdose', 'Fouzan', 'Irfan', 'Mujahid',
      'Muzammil', 'Nabeel', 'Nathiq', 'Pk', 'Saif', 'Sanaulla', 'Sharu', 'Tahir',
    ])
  })
})

describe('data/actions and data/players', () => {
  const all = () => actions.ACTION_GROUPS.flatMap((g) => g.actions.map((a) => ({ ...a, group: g.key })))

  test('every action has a unique id, a label and a numeric point value', () => {
    const list = all()
    assert.equal(new Set(list.map((a) => a.id)).size, list.length)
    for (const a of list) {
      assert.equal(typeof a.label, 'string')
      assert.ok(a.label.length > 0)
      assert.ok(Number.isFinite(a.points) && a.points !== 0, a.id)
    }
  })

  test('actions only target the three scoring categories', () => {
    assert.ok(actions.ACTION_GROUPS.every((g) => ['batting', 'bowling', 'fielding'].includes(g.key)))
  })

  test('point values match the club rules', () => {
    const byId = Object.fromEntries(all().map((a) => [a.id, a]))
    const expected = {
      runs50: 10, runs100: 20, duck: -15, wicket1: 10, maiden: 5, wickets3: 10, wickets5: 20,
      extra: -3, catch: 10, runout: 10, dropCatch: -10, attendance: 5,
    }
    for (const [id, pts] of Object.entries(expected)) {
      assert.equal(byId[id]?.points, pts, id)
    }
    assert.equal(byId.wicket1.group, 'bowling')
    assert.equal(byId.attendance.group, 'fielding')
  })

  test('createInitialPlayers: 16 unique players, ids 1..16, all zero', () => {
    const p = players.createInitialPlayers()
    assert.equal(p.length, 16)
    assert.equal(new Set(p.map((x) => x.name)).size, 16)
    assert.deepEqual(p.map((x) => x.id), Array.from({ length: 16 }, (_, i) => i + 1))
    assert.ok(p.every((x) => x.batting === 0 && x.bowling === 0 && x.fielding === 0))
  })

  test('createInitialPlayers returns a fresh copy each call', () => {
    const a = players.createInitialPlayers()
    a[0].batting = 99
    assert.equal(players.createInitialPlayers()[0].batting, 0)
  })
})
