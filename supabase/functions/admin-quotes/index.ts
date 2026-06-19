import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-key',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

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

  const adminKey = req.headers.get('x-admin-key')
  if (!adminKey || adminKey !== Deno.env.get('ADMIN_PASSWORD')) return unauthorized()

  const url = new URL(req.url)

  try {
    if (req.method === 'GET') {
      // Signed URL for a private file
      const filePath = url.searchParams.get('file')
      if (filePath) {
        const { data, error } = await supabase.storage
          .from('quote-uploads')
          .createSignedUrl(filePath, 3600)
        if (error) throw error
        return json({ url: data.signedUrl })
      }

      // List all quotes
      const { data, error } = await supabase
        .from('quote_requests')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return json(data)
    }

    if (req.method === 'POST') {
      const { action, id } = await req.json()

      if (action === 'delete') {
        const { error } = await supabase.from('quote_requests').delete().eq('id', id)
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
