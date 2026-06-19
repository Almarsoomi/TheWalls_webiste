import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const NOTIFY_URL = `${Deno.env.get('SUPABASE_URL')}/functions/v1/notify-email`
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

async function notify(type: string, data: Record<string, unknown>) {
  try {
    await fetch(NOTIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ type, data }),
    })
  } catch (e) {
    console.error('notify failed:', e)
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Unauthorized' }, 401)

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  )
  if (authError || !user) return json({ error: 'Unauthorized' }, 401)

  const userEmail = user.email!

  try {
    const body = await req.json()
    const { action } = body

    // ── SEND CLIENT MESSAGE ───────────────────────────────────

    if (action === 'send-message') {
      const { project_id, message } = body
      if (!project_id || !message?.trim()) return json({ error: 'Missing fields' }, 400)

      const { data: project } = await supabase
        .from('projects')
        .select('id, name, client_name, client_email')
        .eq('id', project_id)
        .eq('client_email', userEmail)
        .single()
      if (!project) return json({ error: 'Project not found' }, 404)

      const { data: msg, error } = await supabase
        .from('client_messages')
        .insert({ project_id, message: message.trim(), author_email: userEmail })
        .select()
        .single()
      if (error) throw error

      await notify('client-message', {
        project_name: project.name,
        client_name: project.client_name,
        client_email: userEmail,
        message: message.trim(),
      })

      return json({ success: true, message: msg })
    }

    // ── APPROVE / REQUEST CHANGES ON MILESTONE ────────────────

    if (action === 'approve-milestone') {
      const { milestone_id, approved, comment } = body
      if (milestone_id === undefined || approved === undefined) return json({ error: 'Missing fields' }, 400)

      const { data: milestone } = await supabase
        .from('milestones')
        .select('id, title, project_id, status')
        .eq('id', milestone_id)
        .single()
      if (!milestone) return json({ error: 'Milestone not found' }, 404)

      const { data: project } = await supabase
        .from('projects')
        .select('id, name, client_name, client_email')
        .eq('id', milestone.project_id)
        .eq('client_email', userEmail)
        .single()
      if (!project) return json({ error: 'Unauthorized' }, 401)

      const { error } = await supabase
        .from('milestones')
        .update({
          client_approved: approved,
          client_comment: comment?.trim() || null,
          approved_at: new Date().toISOString(),
        })
        .eq('id', milestone_id)
      if (error) throw error

      await notify('milestone-approval', {
        project_name: project.name,
        client_name: project.client_name,
        client_email: userEmail,
        milestone_title: milestone.title,
        approved,
        comment: comment?.trim() || null,
      })

      return json({ success: true })
    }

    return json({ error: 'Unknown action' }, 400)
  } catch (e) {
    return json({ error: e.message }, 500)
  }
})
