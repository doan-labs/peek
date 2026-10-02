/*
 * The one thing on the site that runs: POST /api/notify keeps an email in
 * KV, keyed by the address. 204 is a new signup; 200 means it was already
 * on the list, and its first date stands. Read the list
 * with `wrangler kv key list --binding NOTIFY --remote`.
 */
interface Env {
  NOTIFY: {
    get(key: string): Promise<string | null>
    put(key: string, value: string): Promise<void>
  }
  LIMIT: { limit(o: { key: string }): Promise<{ success: boolean }> }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default {
  async fetch(req: Request, env: Env) {
    if (new URL(req.url).pathname !== '/api/notify') {
      return new Response('Not found', { status: 404 })
    }
    if (req.method !== 'POST') {
      return new Response(null, { status: 405, headers: { allow: 'POST' } })
    }
    // per IP, counted at the Cloudflare location that took the request
    const ip = req.headers.get('cf-connecting-ip') ?? 'unknown'
    if (!(await env.LIMIT.limit({ key: ip })).success) {
      return new Response('Slow down', { status: 429 })
    }
    const body = (await req.json().catch(() => null)) as {
      email?: unknown
    } | null
    const email =
      typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    if (email.length > 254 || !EMAIL.test(email)) {
      return new Response('Bad email', { status: 400 })
    }
    if (await env.NOTIFY.get(email)) return new Response(null, { status: 200 })
    // ponytail: no captcha, add Turnstile if the list fills with junk
    await env.NOTIFY.put(email, new Date().toISOString())
    return new Response(null, { status: 204 })
  },
}
