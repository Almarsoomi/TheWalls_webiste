// Instagram feed (Reels) for the home page.
// Serves cached video posts from @the_walls_dubai via the Instagram Login API
// (graph.instagram.com). Caches results in the `ig_feed` table for 6h and
// auto-refreshes the long-lived access token before it expires.
//
// Public GET endpoint — deploy with:  supabase functions deploy instagram-feed --no-verify-jwt
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

const GRAPH = 'https://graph.instagram.com'
const MEDIA_TTL_MS = 6 * 60 * 60 * 1000          // refetch media every 6 hours
const TOKEN_REFRESH_MS = 30 * 24 * 60 * 60 * 1000 // refresh token if older than 30 days
const MEDIA_FIELDS = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp'
const MAX_ITEMS = 12

type Row = {
  access_token: string
  token_refreshed_at: string
  media: unknown[] | null
  media_fetched_at: string | null
}

// Refresh the long-lived token (no app secret required for ig_refresh_token).
async function maybeRefreshToken(row: Row): Promise<string> {
  const age = Date.now() - new Date(row.token_refreshed_at).getTime()
  if (age < TOKEN_REFRESH_MS) return row.access_token
  try {
    const r = await fetch(
      `${GRAPH}/refresh_access_token?grant_type=ig_refresh_token&access_token=${row.access_token}`
    )
    const j = await r.json()
    if (j.access_token) {
      await supabase.from('ig_feed')
        .update({ access_token: j.access_token, token_refreshed_at: new Date().toISOString() })
        .eq('id', 1)
      return j.access_token
    }
  } catch (_) { /* keep using the existing token */ }
  return row.access_token
}

async function fetchReels(token: string) {
  const url = `${GRAPH}/me/media?fields=${MEDIA_FIELDS}&limit=25&access_token=${token}`
  const r = await fetch(url)
  const j = await r.json()
  if (j.error) throw new Error(j.error.message || 'Instagram API error')
  const items = (j.data || [])
    .filter((m: any) => m.media_type === 'VIDEO')
    .slice(0, MAX_ITEMS)
    .map((m: any) => ({
      id: m.id,
      caption: m.caption || '',
      media_url: m.media_url || null,
      thumbnail_url: m.thumbnail_url || null,
      permalink: m.permalink || 'https://www.instagram.com/the_walls_dubai',
      timestamp: m.timestamp || null,
    }))
  return items
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin') ?? ''
  const cors = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : 'https://thewalls.ae',
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  }

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { data: row, error } = await supabase
      .from('ig_feed')
      .select('access_token, token_refreshed_at, media, media_fetched_at')
      .eq('id', 1)
      .single()

    if (error || !row) throw new Error('Instagram feed not configured')

    // Serve fresh cache without hitting the API.
    const cacheAge = row.media_fetched_at ? Date.now() - new Date(row.media_fetched_at).getTime() : Infinity
    if (row.media && Array.isArray(row.media) && row.media.length && cacheAge < MEDIA_TTL_MS) {
      return new Response(JSON.stringify({ items: row.media, cached: true }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    // Refresh token if needed, then refetch media.
    const token = await maybeRefreshToken(row as Row)
    let items: unknown[]
    try {
      items = await fetchReels(token)
    } catch (e) {
      // API failed — serve stale cache if we have any, otherwise surface the error.
      if (row.media && Array.isArray(row.media) && row.media.length) {
        return new Response(JSON.stringify({ items: row.media, cached: true, stale: true }), {
          headers: { ...cors, 'Content-Type': 'application/json' },
        })
      }
      throw e
    }

    await supabase.from('ig_feed')
      .update({ media: items, media_fetched_at: new Date().toISOString() })
      .eq('id', 1)

    return new Response(JSON.stringify({ items, cached: false }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message, items: [] }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
