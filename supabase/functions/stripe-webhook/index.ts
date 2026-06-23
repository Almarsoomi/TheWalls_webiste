import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)
const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET_KEY')!
const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')!
const FN_BASE = `${Deno.env.get('SUPABASE_URL')}/functions/v1`

const stripe = new Stripe(STRIPE_SECRET, { apiVersion: '2024-06-20' })
const cryptoProvider = Stripe.createSubtleCryptoProvider()

Deno.serve(async (req: Request) => {
  const sig = req.headers.get('stripe-signature')
  const body = await req.text()

  let event
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig!, WEBHOOK_SECRET, undefined, cryptoProvider)
  } catch (e) {
    console.error('Signature verification failed:', e.message)
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session: any = event.data.object
      const cd = session.customer_details || {}

      // Flip the pending order to paid + fill in customer details.
      const { data: order } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          customer_name: cd.name || 'Stripe Customer',
          email: cd.email || '-',
          phone: cd.phone || '-',
          address: cd.address ? [cd.address.line1, cd.address.line2, cd.address.city].filter(Boolean).join(', ') : null,
          emirate: cd.address?.state || null,
          total_aed: session.amount_total != null ? session.amount_total / 100 : null,
        })
        .eq('stripe_session_id', session.id)
        .select('id, items, total_aed')
        .single()

      // Notify team + customer (best-effort).
      if (cd.email) {
        await fetch(`${FN_BASE}/notify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'order',
            data: {
              payment_method: 'stripe',
              name: cd.name || 'Stripe Customer',
              email: cd.email,
              phone: cd.phone || '',
              address: order ? null : null,
              items: order?.items || [],
              total_aed: order?.total_aed,
              order_id: order?.id,
            },
          }),
        }).catch(() => {})
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('Webhook handler error:', e)
    return new Response(JSON.stringify({ error: e.message }), { status: 500 })
  }
})
