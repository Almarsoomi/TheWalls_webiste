import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGINS = new Set([
  'https://thewalls.ae',
  'https://www.thewalls.ae',
  'https://almarsoomi.github.io',
])

const ALLOWED_STATUS = new Set(['pending', 'paid', 'out_for_delivery', 'delivered', 'cancelled'])

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin') ?? ''
  const cors = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : 'https://thewalls.ae',
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-key',
  }

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const adminKey = req.headers.get('x-admin-key')
  if (!adminKey || adminKey !== Deno.env.get('ADMIN_PASSWORD')) {
    return json({ error: 'Unauthorized' }, 401)
  }

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return json(data)
    }

    if (req.method === 'POST') {
      const { action, id, status } = await req.json()

      if (action === 'set-status') {
        if (!ALLOWED_STATUS.has(status)) return json({ error: 'Invalid status' }, 400)
        const { error } = await supabase.from('orders').update({ status }).eq('id', id)
        if (error) throw error
        return json({ success: true })
      }

      if (action === 'delete') {
        const { error } = await supabase.from('orders').delete().eq('id', id)
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
