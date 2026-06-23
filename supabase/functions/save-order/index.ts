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
const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET_KEY')

// Retrieve a Stripe Price by ID — the authoritative source of truth for amount.
async function priceAed(priceId: string): Promise<number> {
  const res = await fetch(`https://api.stripe.com/v1/prices/${priceId}`, {
    headers: { 'Authorization': `Bearer ${STRIPE_SECRET}` },
  })
  if (!res.ok) throw new Error(`Stripe price lookup failed for ${priceId}`)
  const price = await res.json()
  // unit_amount is in the currency's smallest unit (fils for AED).
  return (price.unit_amount ?? 0) / 100
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin') ?? ''
  const cors = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : 'https://thewalls.ae',
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { turnstileToken, customer, items } = await req.json()

    // 1) Bot check first
    const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: TURNSTILE_SECRET, response: turnstileToken }),
    }).then(r => r.json())

    if (!verify.success) {
      return new Response(JSON.stringify({ error: 'Bot check failed' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    // 2) Validate input
    if (!customer?.name || !customer?.phone || !customer?.email || !customer?.address) {
      return new Response(JSON.stringify({ error: 'Missing customer details' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }
    if (!Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: 'Cart is empty' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    // 3) Recompute total server-side from Stripe (never trust client prices)
    let total = 0
    const lineItems = []
    for (const it of items) {
      const qty = Math.max(1, parseInt(it.qty, 10) || 1)
      const unit = await priceAed(it.stripePriceId)
      total += unit * qty
      lineItems.push({ id: it.id, name_en: it.name_en, qty, price_aed: unit })
    }

    // 4) Persist
    const { data, error } = await supabase.from('orders').insert({
      payment_method: 'cod',
      status: 'pending',
      customer_name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      emirate: customer.emirate || null,
      items: lineItems,
      total_aed: total,
    }).select('id').single()

    if (error) throw error

    return new Response(JSON.stringify({ ok: true, orderId: data.id, total_aed: total }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
