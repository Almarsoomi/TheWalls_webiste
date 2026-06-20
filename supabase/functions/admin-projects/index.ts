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

async function verifyTurnstile(token: string): Promise<boolean> {
  if (!TURNSTILE_SECRET) return false
  try {
    const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: TURNSTILE_SECRET, response: token }),
    }).then(r => r.json())
    return verify.success === true
  } catch {
    return false
  }
}

async function checkRateLimit(ip: string): Promise<boolean> {
  const { data } = await supabase
    .from('admin_login_attempts')
    .select('blocked_until')
    .eq('ip', ip)
    .maybeSingle()
  if (data?.blocked_until && new Date(data.blocked_until) > new Date()) return false
  return true
}

async function recordFailedAttempt(ip: string) {
  const { data } = await supabase
    .from('admin_login_attempts')
    .select('attempts')
    .eq('ip', ip)
    .maybeSingle()
  const attempts = (data?.attempts ?? 0) + 1
  const blocked_until = attempts >= 5
    ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
    : null
  await supabase.from('admin_login_attempts').upsert({
    ip, attempts, blocked_until, last_attempt: new Date().toISOString(),
  })
}

async function resetAttempts(ip: string) {
  await supabase.from('admin_login_attempts').upsert({
    ip, attempts: 0, blocked_until: null, last_attempt: new Date().toISOString(),
  })
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

  // Turnstile gate (login page sends this; dashboard data calls do not)
  const turnstileToken = req.headers.get('x-turnstile-token')
  if (turnstileToken && !(await verifyTurnstile(turnstileToken))) {
    return json({ error: 'Bot verification failed' }, 403)
  }

  // Rate limiting — block IPs with too many recent failures
  const ip = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for') ?? 'unknown'
  if (!(await checkRateLimit(ip))) {
    return json({ error: 'Too many failed attempts. Try again in 15 minutes.' }, 429)
  }

  const adminKey = req.headers.get('x-admin-key')
  if (!adminKey || adminKey !== Deno.env.get('ADMIN_PASSWORD')) {
    await recordFailedAttempt(ip)
    return json({ error: 'Unauthorized' }, 401)
  }
  await resetAttempts(ip)

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
          .select()
          .single()
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
