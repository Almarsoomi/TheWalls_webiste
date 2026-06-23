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
const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET_KEY')!
const SITE_URL = Deno.env.get('SITE_URL') || 'https://thewalls.ae'

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin') ?? ''
  const cors = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : 'https://thewalls.ae',
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { items } = await req.json()
    if (!Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: 'Cart is empty' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    // Build Stripe Checkout Session via REST API (form-encoded).
    // line_items use Stripe Price IDs — the amount is enforced by Stripe,
    // so a tampered client cart cannot change what is charged.
    const params = new URLSearchParams()
    params.set('mode', 'payment')
    params.set('success_url', `${SITE_URL}/pages/shop-success.html?session_id={CHECKOUT_SESSION_ID}`)
    params.set('cancel_url', `${SITE_URL}/pages/shop.html`)
    params.set('billing_address_collection', 'required')
    params.append('shipping_address_collection[allowed_countries][]', 'AE')
    params.set('phone_number_collection[enabled]', 'true')

    items.forEach((it: any, i: number) => {
      if (!it.stripePriceId) throw new Error('Missing stripePriceId')
      const qty = Math.max(1, parseInt(it.qty, 10) || 1)
      params.set(`line_items[${i}][price]`, it.stripePriceId)
      params.set(`line_items[${i}][quantity]`, String(qty))
    })

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })
    const session = await res.json()
    if (!res.ok) throw new Error(session?.error?.message || 'Stripe session failed')

    // Record a pending order; the webhook flips it to "paid".
    await supabase.from('orders').insert({
      payment_method: 'stripe',
      status: 'pending',
      customer_name: 'Pending (Stripe)',
      phone: '-',
      email: '-',
      items: items.map((it: any) => ({ stripePriceId: it.stripePriceId, qty: it.qty })),
      total_aed: session.amount_total != null ? session.amount_total / 100 : null,
      stripe_session_id: session.id,
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
