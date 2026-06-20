import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGINS = new Set([
  'https://thewalls.ae',
  'https://www.thewalls.ae',
  'https://almarsoomi.github.io',
])

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)
const TURNSTILE_SECRET = Deno.env.get('TURNSTILE_SECRET_KEY')

// Tier config: [max_attempts, block_duration_ms, label]
const TIERS = [
  { limit: 5, ms: 15 * 60 * 1000,       label: '15 minutes' },
  { limit: 2, ms: 60 * 60 * 1000,       label: '1 hour'     },
  { limit: 0, ms: 24 * 60 * 60 * 1000,  label: '24 hours'   }, // limit 0 = any wrong = instant block
]

async function verifyTurnstile(token: string): Promise<boolean> {
  if (!TURNSTILE_SECRET) return false
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: TURNSTILE_SECRET, response: token }),
    }).then(r => r.json())
    return r.success === true
  } catch { return false }
}

async function getBlockStatus(ip: string): Promise<{ blocked: boolean; blocked_until?: string }> {
  const { data } = await supabase
    .from('admin_login_attempts')
    .select('blocked_until')
    .eq('ip', ip)
    .maybeSingle()
  if (data?.blocked_until && new Date(data.blocked_until) > new Date()) {
    return { blocked: true, blocked_until: data.blocked_until }
  }
  return { blocked: false }
}

async function recordWrongPassword(ip: string) {
  const { data: record } = await supabase
    .from('admin_login_attempts')
    .select('*')
    .eq('ip', ip)
    .maybeSingle()

  const now = new Date()

  // If a previous block has expired, advance to the next tier and reset attempt count
  const blockExpired = record?.blocked_until && new Date(record.blocked_until) <= now
  let tier = Math.min(record?.block_tier ?? 0, 2)
  let attempts: number

  if (blockExpired) {
    tier = Math.min(tier + 1, 2)
    attempts = 1
  } else {
    attempts = (record?.attempts ?? 0) + 1
  }

  const { limit, ms, label } = TIERS[tier]
  const shouldBlock = tier >= 2 || attempts >= limit

  if (shouldBlock) {
    const blocked_until = new Date(now.getTime() + ms).toISOString()
    await supabase.from('admin_login_attempts').upsert({
      ip, attempts, blocked_until, block_tier: tier, last_attempt: now.toISOString(),
    })
    return { blocked: true, blocked_until, block_duration: label }
  } else {
    await supabase.from('admin_login_attempts').upsert({
      ip, attempts, blocked_until: null, block_tier: tier, last_attempt: now.toISOString(),
    })
    return { blocked: false, remaining: limit - attempts, block_duration: label }
  }
}

async function clearAttempts(ip: string) {
  // Only lift an active block — preserve attempt history for monitoring
  const { data: record } = await supabase
    .from('admin_login_attempts')
    .select('blocked_until')
    .eq('ip', ip)
    .maybeSingle()
  if (record?.blocked_until && new Date(record.blocked_until) > new Date()) {
    await supabase.from('admin_login_attempts')
      .update({ blocked_until: null })
      .eq('ip', ip)
  }
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin') ?? ''
  const cors = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : 'https://thewalls.ae',
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-key, x-turnstile-token',
  }

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  // Turnstile gate — only enforced when a token is present (login page sends it; dashboard calls do not)
  const turnstileToken = req.headers.get('x-turnstile-token')
  if (turnstileToken && !(await verifyTurnstile(turnstileToken))) {
    return json({ error: 'Bot verification failed' }, 403)
  }

  const ip = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for') ?? 'unknown'
  const adminKey = req.headers.get('x-admin-key')
  const isCorrectPassword = adminKey && adminKey === Deno.env.get('ADMIN_PASSWORD')

  if (!isCorrectPassword) {
    // Wrong password — check and update rate limit
    const blockStatus = await getBlockStatus(ip)
    if (blockStatus.blocked) {
      return json({ error: 'blocked', blocked_until: blockStatus.blocked_until }, 429)
    }
    const result = await recordWrongPassword(ip)
    if (result.blocked) {
      return json({ error: 'blocked', blocked_until: result.blocked_until, block_duration: result.block_duration }, 429)
    }
    return json({ error: 'Wrong password', remaining_attempts: result.remaining, block_duration: result.block_duration }, 401)
  }

  // Correct password — clear any previous attempt record
  await clearAttempts(ip)

  const url = new URL(req.url)
  const projectId = url.searchParams.get('id')

  try {
    if (req.method === 'GET' && projectId) {
      const [{ data: project, error: pErr }, { data: milestones }, { data: updates }, { data: photos }, { data: documents }] =
        await Promise.all([
          supabase.from('projects').select('*').eq('id', projectId).single(),
          supabase.from('milestones').select('*').eq('project_id', projectId).order('position'),
          supabase.from('project_updates').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
          supabase.from('project_photos').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
          supabase.from('project_documents').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
        ])
      if (pErr) throw pErr
      return json({ project, milestones, updates, photos, documents })
    }

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return json(data)
    }

    if (req.method === 'POST') {
      const body = await req.json()
      const { action, id, name, client_name, client_email, status, start_date, expected_completion } = body

      if (action === 'create') {
        const { data, error } = await supabase
          .from('projects')
          .insert({ name, client_name, client_email: client_email.toLowerCase(), status: status || 'active', start_date: start_date || null, expected_completion: expected_completion || null })
          .select().single()
        if (error) throw error
        return json({ success: true, project: data })
      }

      if (action === 'update') {
        const { error } = await supabase
          .from('projects')
          .update({ name, client_name, client_email: client_email.toLowerCase(), status, start_date: start_date || null, expected_completion: expected_completion || null })
          .eq('id', id)
        if (error) throw error
        return json({ success: true })
      }

      if (action === 'delete') {
        const { error } = await supabase.from('projects').delete().eq('id', id)
        if (error) throw error
        return json({ success: true })
      }

      return json({ error: 'Unknown action' }, 400)
    }

    return json({ error: 'Method not allowed' }, 405)
  } catch (e) {
    return json({ error: e.message }, 500)
  }
})
