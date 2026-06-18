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

// Decode base64 data URI to Uint8Array
function decodeBase64File(dataUri: string): { bytes: Uint8Array; mime: string } {
  const [header, b64] = dataUri.split(',')
  const mime = header.match(/:(.*?);/)?.[1] ?? 'application/octet-stream'
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return { bytes, mime }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const adminKey = req.headers.get('x-admin-key')
  if (!adminKey || adminKey !== Deno.env.get('ADMIN_PASSWORD')) return unauthorized()

  try {
    const body = await req.json()
    const { action } = body

    // ── MILESTONES ────────────────────────────────────────────

    if (action === 'add-milestone') {
      const { project_id, title, position } = body
      const { data, error } = await supabase
        .from('milestones')
        .insert({ project_id, title, position: position ?? 0, status: 'pending' })
        .select()
        .single()
      if (error) throw error
      return json({ success: true, milestone: data })
    }

    if (action === 'update-milestone') {
      const { id, status, title, position } = body
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (status !== undefined) updates.status = status
      if (title !== undefined) updates.title = title
      if (position !== undefined) updates.position = position
      const { error } = await supabase.from('milestones').update(updates).eq('id', id)
      if (error) throw error
      return json({ success: true })
    }

    if (action === 'delete-milestone') {
      const { id } = body
      const { error } = await supabase.from('milestones').delete().eq('id', id)
      if (error) throw error
      return json({ success: true })
    }

    // ── MESSAGES ──────────────────────────────────────────────

    if (action === 'add-message') {
      const { project_id, message } = body
      const { data, error } = await supabase
        .from('project_updates')
        .insert({ project_id, message })
        .select()
        .single()
      if (error) throw error
      return json({ success: true, update: data })
    }

    if (action === 'delete-message') {
      const { id } = body
      const { error } = await supabase.from('project_updates').delete().eq('id', id)
      if (error) throw error
      return json({ success: true })
    }

    // ── PHOTOS ────────────────────────────────────────────────

    if (action === 'upload-photo') {
      const { project_id, file, caption, filename } = body
      const { bytes, mime } = decodeBase64File(file)
      const path = `${project_id}/${Date.now()}-${filename}`
      const { error: upErr } = await supabase.storage
        .from('project-photos')
        .upload(path, bytes, { contentType: mime, upsert: false })
      if (upErr) throw upErr
      const { data, error } = await supabase
        .from('project_photos')
        .insert({ project_id, storage_path: path, caption: caption || null })
        .select()
        .single()
      if (error) throw error
      return json({ success: true, photo: data })
    }

    if (action === 'delete-photo') {
      const { id } = body
      const { data: photo } = await supabase.from('project_photos').select('storage_path').eq('id', id).single()
      if (photo) await supabase.storage.from('project-photos').remove([photo.storage_path])
      const { error } = await supabase.from('project_photos').delete().eq('id', id)
      if (error) throw error
      return json({ success: true })
    }

    // ── DOCUMENTS ─────────────────────────────────────────────

    if (action === 'upload-document') {
      const { project_id, file, name, filename } = body
      const { bytes, mime } = decodeBase64File(file)
      const path = `${project_id}/${Date.now()}-${filename}`
      const { error: upErr } = await supabase.storage
        .from('project-documents')
        .upload(path, bytes, { contentType: mime, upsert: false })
      if (upErr) throw upErr
      const { data, error } = await supabase
        .from('project_documents')
        .insert({ project_id, name, storage_path: path })
        .select()
        .single()
      if (error) throw error
      return json({ success: true, document: data })
    }

    if (action === 'delete-document') {
      const { id } = body
      const { data: doc } = await supabase.from('project_documents').select('storage_path').eq('id', id).single()
      if (doc) await supabase.storage.from('project-documents').remove([doc.storage_path])
      const { error } = await supabase.from('project_documents').delete().eq('id', id)
      if (error) throw error
      return json({ success: true })
    }

    return json({ error: 'Unknown action' }, 400)
  } catch (e) {
    return json({ error: e.message }, 500)
  }
})
