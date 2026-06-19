const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const TEAM_EMAIL = Deno.env.get('TEAM_EMAIL') || 'info@thewalls.ae'
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'The Walls <donotreply@contact.thewalls.ae>'

async function sendEmail(to: string, subject: string, html: string, cc?: string[]) {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — email skipped')
    return
  }
  const payload: Record<string, unknown> = { from: FROM_EMAIL, to, subject, html }
  if (cc?.length) payload.cc = cc
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.text()
    console.error('Resend error:', err)
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { formType, data } = await req.json()

    // Team notification
    await sendEmail(TEAM_EMAIL, `New Quote Request — ${data.name}`, teamHtml(data), ['ahmed@thewalls.ae'])

    // Client confirmation
    if (data.email) {
      await sendEmail(data.email, 'We received your request — The Walls', clientHtml(data))
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error(e)
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

function row(label: string, value: string | null | undefined) {
  if (!value) return ''
  return `
    <tr>
      <td style="padding:10px 16px;font-size:11px;letter-spacing:.07em;text-transform:uppercase;color:#8a7253;white-space:nowrap;width:130px;vertical-align:top;">${label}</td>
      <td style="padding:10px 16px;font-size:14px;color:#e8e0d0;border-left:1px solid rgba(201,169,110,.1);">${value}</td>
    </tr>`
}

function teamHtml(d: Record<string, any>) {
  const fileNote = d.file_paths?.length
    ? `${d.file_paths.length} file(s) uploaded to Supabase storage (quote-uploads bucket)`
    : 'No files attached'

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head><body style="margin:0;padding:0;background:#0c0c0b;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0c0c0b;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#141413;border:1px solid rgba(201,169,110,.15);border-radius:8px;overflow:hidden;">

        <!-- Header -->
        <tr><td style="background:#0c0c0b;padding:28px 32px;border-bottom:1px solid rgba(201,169,110,.15);">
          <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;font-weight:300;color:#c9a96e;letter-spacing:.04em;">The Walls</div>
          <div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#8a7253;margin-top:4px;">New Quote Request</div>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:24px 32px 8px;">
          <div style="font-size:13px;color:#8a7253;margin-bottom:20px;">Received ${new Date().toLocaleString('en-AE',{timeZone:'Asia/Dubai',dateStyle:'full',timeStyle:'short'})}</div>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(201,169,110,.1);border-radius:6px;overflow:hidden;">
            ${row('Name', d.name)}
            ${row('Phone', d.phone)}
            ${row('Email', d.email)}
            ${row('Project', d.project_types)}
            ${row('Space', d.space_type)}
            ${row('Area', d.area_display || (d.area_sqm ? d.area_sqm + ' m²' : null))}
            ${row('Budget', d.budget_range)}
            ${row('Preferred Date', d.preferred_date)}
            ${row('Preferred Time', d.preferred_time)}
            ${row('Format', d.consultation_format)}
            ${row('Notes', d.description)}
            ${row('Files', fileNote)}
          </table>
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:24px 32px 32px;">
          <a href="https://app.supabase.com" style="display:inline-block;background:#c9a96e;color:#0c0c0b;padding:11px 22px;border-radius:4px;font-size:11px;letter-spacing:.09em;text-transform:uppercase;text-decoration:none;font-weight:500;">View in Dashboard</a>
          <a href="https://wa.me/${d.phone?.replace(/[\s+\-()]/g,'')}" style="display:inline-block;margin-left:10px;background:transparent;color:#c9a96e;padding:10px 22px;border-radius:4px;font-size:11px;letter-spacing:.09em;text-transform:uppercase;text-decoration:none;border:1px solid rgba(201,169,110,.3);">WhatsApp Client</a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:16px 32px;border-top:1px solid rgba(201,169,110,.1);">
          <div style="font-size:11px;color:rgba(138,114,83,.5);">This is an automated notification from The Walls website.</div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`
}

function clientHtml(d: Record<string, any>) {
  const hasConsultation = d.preferred_date || d.preferred_time !== 'Flexible'
  const consultNote = hasConsultation
    ? `<tr><td style="padding:10px 0;font-size:13px;color:#e8e0d0;border-bottom:1px solid rgba(255,255,255,.04);">We've also noted your consultation preference for <strong style="color:#c9a96e;">${d.preferred_date || ''}${d.preferred_date && d.preferred_time !== 'Flexible' ? ' at ' : ''}${d.preferred_time !== 'Flexible' ? d.preferred_time : ''}</strong> (${d.consultation_format}). We'll confirm this slot separately.</td></tr>`
    : ''

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head><body style="margin:0;padding:0;background:#0c0c0b;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0c0c0b;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#141413;border:1px solid rgba(201,169,110,.15);border-radius:8px;overflow:hidden;">

        <!-- Header -->
        <tr><td style="background:#0c0c0b;padding:28px 32px;border-bottom:1px solid rgba(201,169,110,.15);">
          <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;font-weight:300;color:#c9a96e;letter-spacing:.04em;">The Walls</div>
          <div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#8a7253;margin-top:4px;">Dubai · Premium Fit-Out &amp; Interior Design</div>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px 32px 8px;">
          <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:300;color:#f5f0e8;margin:0 0 8px;">Thank you, ${d.name}.</h1>
          <p style="font-size:14px;color:#8a7253;line-height:1.7;margin:0 0 24px;">We've received your quote request and our team is already reviewing your details. You'll receive a comprehensive, itemised quote by email within <strong style="color:#c9a96e;">24 hours</strong> during business days.</p>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:10px 0;font-size:13px;color:#e8e0d0;border-bottom:1px solid rgba(255,255,255,.04);">
              <strong style="color:#8a7253;font-size:10px;letter-spacing:.08em;text-transform:uppercase;display:block;margin-bottom:3px;">Your project</strong>
              ${d.project_types || '—'}${d.space_type ? ' · ' + d.space_type : ''}${d.area_display ? ' · ' + d.area_display : ''}${d.budget_range ? ' · ' + d.budget_range : ''}
            </td></tr>
            ${consultNote}
          </table>
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:28px 32px 32px;">
          <p style="font-size:13px;color:#8a7253;margin:0 0 20px;line-height:1.7;">In the meantime, feel free to reach us directly on WhatsApp — we typically respond within minutes during business hours (Mon–Sat, 9 AM – 6 PM GST).</p>
          <a href="https://wa.me/971544996788" style="display:inline-block;background:#25D366;color:#fff;padding:12px 24px;border-radius:4px;font-size:12px;letter-spacing:.07em;text-transform:uppercase;text-decoration:none;font-weight:500;">Chat on WhatsApp</a>
          <a href="https://thewalls.ae/pages/portfolio.html" style="display:inline-block;margin-left:10px;background:transparent;color:#c9a96e;padding:11px 24px;border-radius:4px;font-size:12px;letter-spacing:.07em;text-transform:uppercase;text-decoration:none;border:1px solid rgba(201,169,110,.3);">View Our Work</a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 32px;border-top:1px solid rgba(201,169,110,.1);">
          <div style="font-size:11px;color:rgba(138,114,83,.5);line-height:1.8;">
            The Walls · Dubai, UAE<br/>
            <a href="mailto:info@thewalls.ae" style="color:rgba(138,114,83,.5);">info@thewalls.ae</a> ·
            <a href="https://thewalls.ae" style="color:rgba(138,114,83,.5);">thewalls.ae</a>
          </div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`
}
