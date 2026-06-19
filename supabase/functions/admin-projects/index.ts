import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-key, x-turnstile-token',
}

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

function unauthorized() {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  // Cloudflare Turnstile gate for interactive logins. The login page sends a
  // turnstile token; data calls from the dashboard (already authenticated) do not.
  const turnstileToken = req.headers.get('x-turnstile-token')
  if (turnstileToken && !(await verifyTurnstile(turnstileToken))) {
    return json({ error: 'Bot verification failed' }, 403)
  }

  const adminKey = req.headers.get('x-admin-key')
  if (!adminKey || adminKey !== Deno.env.get('ADMIN_PASSWORD')) return unauthorized()

  const url = new URL(req.url)
  const projectId = url.searchParams.get('id')

  try {
    // GET /admin-projects?id=xxx — full project with all content
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

    // GET /admin-projects — list all projects
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return json(data)
    }

    // POST /admin-projects — create or update project
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
