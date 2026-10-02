/*
 * The Worker in Miniflare: KV keeps a signup, the IP limit cuts in on the
 * sixth. Run with `bun run test` from apps/web.
 */
import assert from 'node:assert/strict'
import { devWorker } from './worker.dev.ts'

const mf = await devWorker()

const post = (email, ip = '1.1.1.1') =>
  mf.dispatchFetch('http://peek.test/api/notify', {
    method: 'POST',
    headers: { 'cf-connecting-ip': ip },
    body: JSON.stringify({ email }),
  })

try {
  assert.equal((await post(' Hi@Example.com ')).status, 204)
  const kv = await mf.getKVNamespace('NOTIFY')
  const first = await kv.get('hi@example.com')
  assert.ok(first, 'kept, trimmed and lowercased')
  assert.equal((await post('hi@example.com')).status, 200, 'already there')
  assert.equal(await kv.get('hi@example.com'), first, 'first date stands')

  assert.equal((await post('nope')).status, 400)
  for (let i = 0; i < 2; i++)
    assert.equal((await post(`a${i}@b.co`)).status, 204)
  // five spent on 1.1.1.1: the sixth is cut, another IP is not
  assert.equal((await post('late@b.co')).status, 429)
  assert.equal(await kv.get('late@b.co'), null, 'a limited send is not kept')
  assert.equal((await post('other@b.co', '2.2.2.2')).status, 204)

  assert.equal(
    (await mf.dispatchFetch('http://peek.test/api/notify')).status,
    405,
  )
  assert.equal((await mf.dispatchFetch('http://peek.test/nope')).status, 404)
  console.log('worker ok')
} finally {
  await mf.dispose()
}
