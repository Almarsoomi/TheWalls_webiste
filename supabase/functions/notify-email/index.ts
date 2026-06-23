const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const TEAM_EMAIL = Deno.env.get('TEAM_EMAIL') || 'info@thewalls.ae'
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'The Walls <donotreply@contact.thewalls.ae>'
const PORTAL_URL = 'https://thewalls.ae/pages/portal-project.html'

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
    const body = await req.json()
    const type = body.type || 'quote'
    const d = body.data

    // ── QUOTE REQUEST (existing) ──────────────────────────────
    if (type === 'quote') {
      await sendEmail(TEAM_EMAIL, `New Quote Request — ${d.name}`, quoteTeamHtml(d), ['ahmed@thewalls.ae'])
      if (d.email) await sendEmail(d.email, 'We received your request — The Walls', quoteClientHtml(d))
    }

    // ── SHOP ORDER (Stripe paid or Cash on Delivery) ──────────
    else if (type === 'order') {
      const isCod = (d.payment_method || 'cod') === 'cod'
      await sendEmail(
        TEAM_EMAIL,
        `New ${isCod ? 'COD' : 'paid'} order — ${d.name}`,
        orderTeamHtml(d),
        ['ahmed@thewalls.ae']
      )
      if (d.email) await sendEmail(d.email, 'Your order — The Walls', orderClientHtml(d))
    }

    // ── TEAM → CLIENT: new project update posted ──────────────
    else if (type === 'team-message') {
      await sendEmail(
        d.client_email,
        `New update on your project — The Walls`,
        teamMessageClientHtml(d)
      )
    }

    // ── TEAM → CLIENT: milestone marked done ──────────────────
    else if (type === 'milestone-update') {
      await sendEmail(
        d.client_email,
        `Milestone complete: ${d.milestone_title} — The Walls`,
        milestoneUpdateClientHtml(d)
      )
    }

    // ── TEAM → CLIENT: new photos uploaded ───────────────────
    else if (type === 'new-photos') {
      await sendEmail(
        d.client_email,
        `New site photos added to your project — The Walls`,
        newPhotosClientHtml(d)
      )
    }

    // ── CLIENT → TEAM: client sent a message ─────────────────
    else if (type === 'client-message') {
      await sendEmail(
        TEAM_EMAIL,
        `New message from ${d.client_name} — ${d.project_name}`,
        clientMessageTeamHtml(d),
        ['ahmed@thewalls.ae']
      )
    }

    // ── CLIENT → TEAM: milestone approved / changes requested ─
    else if (type === 'milestone-approval') {
      const verb = d.approved ? 'approved' : 'requested changes on'
      await sendEmail(
        TEAM_EMAIL,
        `${d.client_name} ${verb} "${d.milestone_title}" — ${d.project_name}`,
        milestoneApprovalTeamHtml(d),
        ['ahmed@thewalls.ae']
      )
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

// ── SHARED HELPERS ────────────────────────────────────────────

function row(label: string, value: string | null | undefined) {
  if (!value) return ''
  return `
    <tr>
      <td style="padding:10px 16px;font-size:11px;letter-spacing:.07em;text-transform:uppercase;color:#8a7253;white-space:nowrap;width:130px;vertical-align:top;">${label}</td>
      <td style="padding:10px 16px;font-size:14px;color:#e8e0d0;border-left:1px solid rgba(201,169,110,.1);">${value}</td>
    </tr>`
}

function emailWrap(headerLabel: string, body: string) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head><body style="margin:0;padding:0;background:#0c0c0b;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0c0c0b;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#141413;border:1px solid rgba(201,169,110,.15);border-radius:8px;overflow:hidden;">

        <tr><td style="background:#0c0c0b;padding:28px 32px;border-bottom:1px solid rgba(201,169,110,.15);">
          <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;font-weight:300;color:#c9a96e;letter-spacing:.04em;">The Walls</div>
          <div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#8a7253;margin-top:4px;">${headerLabel}</div>
        </td></tr>

        ${body}

        <tr><td style="padding:16px 32px;border-top:1px solid rgba(201,169,110,.1);">
          <div style="font-size:11px;color:rgba(138,114,83,.5);">The Walls · Dubai, UAE · <a href="mailto:info@thewalls.ae" style="color:rgba(138,114,83,.5);">info@thewalls.ae</a></div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`
}

// ── QUOTE (existing templates) ────────────────────────────────

function quoteTeamHtml(d: Record<string, any>) {
  const fileNote = d.file_paths?.length
    ? `${d.file_paths.length} file(s) uploaded to Supabase storage (quote-uploads bucket)`
    : 'No files attached'

  const tableRows = `
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
    ${row('Files', fileNote)}`

  const body = `
    <tr><td style="padding:24px 32px 8px;">
      <div style="font-size:13px;color:#8a7253;margin-bottom:20px;">Received ${new Date().toLocaleString('en-AE',{timeZone:'Asia/Dubai',dateStyle:'full',timeStyle:'short'})}</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(201,169,110,.1);border-radius:6px;overflow:hidden;">${tableRows}</table>
    </td></tr>
    <tr><td style="padding:24px 32px 32px;">
      <a href="https://app.supabase.com" style="display:inline-block;background:#c9a96e;color:#0c0c0b;padding:11px 22px;border-radius:4px;font-size:11px;letter-spacing:.09em;text-transform:uppercase;text-decoration:none;font-weight:500;">View in Dashboard</a>
      <a href="https://wa.me/${d.phone?.replace(/[\s+\-()]/g,'')}" style="display:inline-block;margin-left:10px;background:transparent;color:#c9a96e;padding:10px 22px;border-radius:4px;font-size:11px;letter-spacing:.09em;text-transform:uppercase;text-decoration:none;border:1px solid rgba(201,169,110,.3);">WhatsApp Client</a>
    </td></tr>`

  return emailWrap('New Quote Request', body)
}

function quoteClientHtml(d: Record<string, any>) {
  const hasConsultation = d.preferred_date || d.preferred_time !== 'Flexible'
  const consultNote = hasConsultation
    ? `<tr><td style="padding:10px 0;font-size:13px;color:#e8e0d0;border-bottom:1px solid rgba(255,255,255,.04);">We've also noted your consultation preference for <strong style="color:#c9a96e;">${d.preferred_date || ''}${d.preferred_date && d.preferred_time !== 'Flexible' ? ' at ' : ''}${d.preferred_time !== 'Flexible' ? d.preferred_time : ''}</strong> (${d.consultation_format}). We'll confirm this slot separately.</td></tr>`
    : ''

  const body = `
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
    <tr><td style="padding:28px 32px 32px;">
      <p style="font-size:13px;color:#8a7253;margin:0 0 20px;line-height:1.7;">In the meantime, feel free to reach us directly on WhatsApp — we typically respond within minutes during business hours (Mon–Sat, 9 AM – 6 PM GST).</p>
      <a href="https://wa.me/971544996788" style="display:inline-block;background:#25D366;color:#fff;padding:12px 24px;border-radius:4px;font-size:12px;letter-spacing:.07em;text-transform:uppercase;text-decoration:none;font-weight:500;">Chat on WhatsApp</a>
      <a href="https://thewalls.ae/pages/portfolio.html" style="display:inline-block;margin-left:10px;background:transparent;color:#c9a96e;padding:11px 24px;border-radius:4px;font-size:12px;letter-spacing:.07em;text-transform:uppercase;text-decoration:none;border:1px solid rgba(201,169,110,.3);">View Our Work</a>
    </td></tr>`

  return emailWrap('Dubai · Premium Fit-Out &amp; Interior Design', body)
}

// ── SHOP ORDER templates ──────────────────────────────────────

function orderItemsTable(d: Record<string, any>) {
  const items = Array.isArray(d.items) ? d.items : []
  const rows = items.map((it: any) => `
    <tr>
      <td style="padding:10px 16px;font-size:14px;color:#e8e0d0;">${it.name_en || it.id || 'Item'}</td>
      <td style="padding:10px 16px;font-size:14px;color:#8a7253;text-align:center;width:60px;">×${it.qty}</td>
      <td style="padding:10px 16px;font-size:14px;color:#e8e0d0;text-align:right;white-space:nowrap;">AED ${Number((it.price_aed || 0) * (it.qty || 1)).toLocaleString('en-AE')}</td>
    </tr>`).join('')
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(201,169,110,.1);border-radius:6px;overflow:hidden;">
      ${rows}
      <tr><td colspan="2" style="padding:12px 16px;font-size:11px;letter-spacing:.07em;text-transform:uppercase;color:#8a7253;border-top:1px solid rgba(201,169,110,.15);">Total (excl. delivery)</td>
        <td style="padding:12px 16px;font-size:16px;color:#c9a96e;text-align:right;border-top:1px solid rgba(201,169,110,.15);white-space:nowrap;">AED ${Number(d.total_aed || 0).toLocaleString('en-AE')}</td></tr>
    </table>`
}

function orderTeamHtml(d: Record<string, any>) {
  const isCod = (d.payment_method || 'cod') === 'cod'
  const body = `
    <tr><td style="padding:24px 32px 8px;">
      <div style="font-size:13px;color:#8a7253;margin-bottom:8px;">Received ${new Date().toLocaleString('en-AE',{timeZone:'Asia/Dubai',dateStyle:'full',timeStyle:'short'})}</div>
      <div style="display:inline-block;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:${isCod ? '#e8a84e' : '#7acc7a'};border:1px solid ${isCod ? 'rgba(232,168,78,.4)' : 'rgba(122,204,122,.4)'};padding:4px 10px;border-radius:3px;margin-bottom:16px;">${isCod ? 'Cash on Delivery' : 'Paid online'}</div>
      ${orderItemsTable(d)}
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(201,169,110,.1);border-radius:6px;overflow:hidden;margin-top:16px;">
        ${row('Name', d.name)}
        ${row('Phone', d.phone)}
        ${row('Email', d.email)}
        ${row('Address', d.address)}
        ${row('Emirate', d.emirate)}
        ${row('Order ID', d.order_id)}
      </table>
    </td></tr>
    <tr><td style="padding:24px 32px 32px;">
      <a href="https://wa.me/${d.phone?.replace(/[\s+\-()]/g,'')}" style="display:inline-block;background:#25D366;color:#fff;padding:11px 22px;border-radius:4px;font-size:11px;letter-spacing:.09em;text-transform:uppercase;text-decoration:none;font-weight:500;">WhatsApp Customer</a>
      <a href="https://app.supabase.com" style="display:inline-block;margin-left:10px;background:transparent;color:#c9a96e;padding:10px 22px;border-radius:4px;font-size:11px;letter-spacing:.09em;text-transform:uppercase;text-decoration:none;border:1px solid rgba(201,169,110,.3);">View in Dashboard</a>
    </td></tr>`
  return emailWrap('New Shop Order', body)
}

function orderClientHtml(d: Record<string, any>) {
  const isCod = (d.payment_method || 'cod') === 'cod'
  const body = `
    <tr><td style="padding:32px 32px 8px;">
      <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:300;color:#f5f0e8;margin:0 0 8px;">Thank you, ${d.name}.</h1>
      <p style="font-size:14px;color:#8a7253;line-height:1.7;margin:0 0 24px;">${isCod
        ? 'We\'ve received your cash-on-delivery order. Our team will contact you shortly to confirm delivery details and timing.'
        : 'We\'ve received your order and payment. Our team will be in touch with delivery details and timing.'}</p>
      ${orderItemsTable(d)}
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(201,169,110,.1);border-radius:6px;overflow:hidden;margin-top:16px;">
        ${row('Deliver to', d.address)}
        ${row('Emirate', d.emirate)}
        ${row('Payment', isCod ? 'Cash on delivery' : 'Paid online')}
      </table>
    </td></tr>
    <tr><td style="padding:28px 32px 32px;">
      <p style="font-size:13px;color:#8a7253;margin:0 0 20px;line-height:1.7;">Questions about your order? Reach us on WhatsApp — we typically respond within minutes during business hours (Mon–Sat, 9 AM – 6 PM GST).</p>
      <a href="https://wa.me/971544996788" style="display:inline-block;background:#25D366;color:#fff;padding:12px 24px;border-radius:4px;font-size:12px;letter-spacing:.07em;text-transform:uppercase;text-decoration:none;font-weight:500;">Chat on WhatsApp</a>
    </td></tr>`
  return emailWrap('Order Confirmation', body)
}

// ── TEAM → CLIENT: new update ─────────────────────────────────

function teamMessageClientHtml(d: Record<string, any>) {
  const body = `
    <tr><td style="padding:32px 32px 8px;">
      <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:300;color:#f5f0e8;margin:0 0 8px;">Your team has posted an update.</h1>
      <p style="font-size:12px;color:#8a7253;letter-spacing:.08em;text-transform:uppercase;margin:0 0 24px;">${d.project_name}</p>
      <div style="background:#0c0c0b;border-left:2px solid rgba(201,169,110,.4);padding:16px 20px;font-size:14px;color:#e8e0d0;line-height:1.75;white-space:pre-wrap;">${d.message}</div>
    </td></tr>
    <tr><td style="padding:24px 32px 32px;">
      <a href="${PORTAL_URL}" style="display:inline-block;background:#c9a96e;color:#0c0c0b;padding:12px 24px;border-radius:4px;font-size:11px;letter-spacing:.09em;text-transform:uppercase;text-decoration:none;font-weight:500;">View in Your Portal</a>
    </td></tr>`
  return emailWrap('Project Update', body)
}

// ── TEAM → CLIENT: milestone done ────────────────────────────

function milestoneUpdateClientHtml(d: Record<string, any>) {
  const body = `
    <tr><td style="padding:32px 32px 8px;">
      <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:300;color:#f5f0e8;margin:0 0 8px;">A milestone has been completed.</h1>
      <p style="font-size:12px;color:#8a7253;letter-spacing:.08em;text-transform:uppercase;margin:0 0 24px;">${d.project_name}</p>
      <div style="display:flex;align-items:center;gap:12px;padding:16px 20px;background:#0c0c0b;border:.5px solid rgba(201,169,110,.2);">
        <div style="width:10px;height:10px;border-radius:50%;background:rgba(201,169,110,.6);flex-shrink:0;"></div>
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;font-weight:300;color:#f5f0e8;">${d.milestone_title}</div>
        <div style="margin-left:auto;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:rgba(201,169,110,.6);">Done</div>
      </div>
      <p style="font-size:13px;color:#8a7253;line-height:1.7;margin:20px 0 0;">Log in to your portal to review and approve this milestone, or leave a note for the team.</p>
    </td></tr>
    <tr><td style="padding:24px 32px 32px;">
      <a href="${PORTAL_URL}" style="display:inline-block;background:#c9a96e;color:#0c0c0b;padding:12px 24px;border-radius:4px;font-size:11px;letter-spacing:.09em;text-transform:uppercase;text-decoration:none;font-weight:500;">Review Milestone</a>
    </td></tr>`
  return emailWrap('Milestone Complete', body)
}

// ── TEAM → CLIENT: new photos ─────────────────────────────────

function newPhotosClientHtml(d: Record<string, any>) {
  const count = d.photo_count || 'New'
  const body = `
    <tr><td style="padding:32px 32px 8px;">
      <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:300;color:#f5f0e8;margin:0 0 8px;">${count === 1 ? 'A new photo has' : `${count} new photos have`} been added.</h1>
      <p style="font-size:12px;color:#8a7253;letter-spacing:.08em;text-transform:uppercase;margin:0 0 24px;">${d.project_name}</p>
      <p style="font-size:14px;color:#8a7253;line-height:1.7;margin:0;">Your project portal has been updated with the latest site photography. Log in to view progress and download images.</p>
    </td></tr>
    <tr><td style="padding:24px 32px 32px;">
      <a href="${PORTAL_URL}" style="display:inline-block;background:#c9a96e;color:#0c0c0b;padding:12px 24px;border-radius:4px;font-size:11px;letter-spacing:.09em;text-transform:uppercase;text-decoration:none;font-weight:500;">View Photos</a>
    </td></tr>`
  return emailWrap('New Site Photos', body)
}

// ── CLIENT → TEAM: client sent a message ─────────────────────

function clientMessageTeamHtml(d: Record<string, any>) {
  const body = `
    <tr><td style="padding:24px 32px 8px;">
      <div style="font-size:13px;color:#8a7253;margin-bottom:20px;">Received ${new Date().toLocaleString('en-AE',{timeZone:'Asia/Dubai',dateStyle:'full',timeStyle:'short'})}</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(201,169,110,.1);border-radius:6px;overflow:hidden;margin-bottom:20px;">
        ${row('Project', d.project_name)}
        ${row('Client', d.client_name)}
        ${row('Email', d.client_email)}
      </table>
      <div style="background:#0c0c0b;border-left:2px solid rgba(201,169,110,.4);padding:16px 20px;font-size:14px;color:#e8e0d0;line-height:1.75;white-space:pre-wrap;">${d.message}</div>
    </td></tr>
    <tr><td style="padding:24px 32px 32px;">
      <a href="https://wa.me/${d.client_email?.replace(/[^0-9]/g,'')}" style="display:inline-block;background:#25D366;color:#fff;padding:11px 22px;border-radius:4px;font-size:11px;letter-spacing:.09em;text-transform:uppercase;text-decoration:none;font-weight:500;">WhatsApp Client</a>
      <a href="mailto:${d.client_email}" style="display:inline-block;margin-left:10px;background:transparent;color:#c9a96e;padding:10px 22px;border-radius:4px;font-size:11px;letter-spacing:.09em;text-transform:uppercase;text-decoration:none;border:1px solid rgba(201,169,110,.3);">Reply by Email</a>
    </td></tr>`
  return emailWrap('New Client Message', body)
}

// ── CLIENT → TEAM: milestone approval ────────────────────────

function milestoneApprovalTeamHtml(d: Record<string, any>) {
  const approved = d.approved
  const statusColor = approved ? '#7acc7a' : '#e8a84e'
  const statusLabel = approved ? 'Approved' : 'Changes Requested'

  const body = `
    <tr><td style="padding:24px 32px 8px;">
      <div style="font-size:13px;color:#8a7253;margin-bottom:20px;">Received ${new Date().toLocaleString('en-AE',{timeZone:'Asia/Dubai',dateStyle:'full',timeStyle:'short'})}</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(201,169,110,.1);border-radius:6px;overflow:hidden;margin-bottom:20px;">
        ${row('Project', d.project_name)}
        ${row('Client', d.client_name)}
        ${row('Milestone', d.milestone_title)}
        ${row('Decision', `<span style="color:${statusColor};font-weight:500;">${statusLabel}</span>`)}
      </table>
      ${d.comment ? `<div style="background:#0c0c0b;border-left:2px solid rgba(201,169,110,.4);padding:16px 20px;font-size:14px;color:#e8e0d0;line-height:1.75;white-space:pre-wrap;">${d.comment}</div>` : ''}
    </td></tr>
    <tr><td style="padding:24px 32px 32px;">
      <a href="mailto:${d.client_email}" style="display:inline-block;background:#c9a96e;color:#0c0c0b;padding:11px 22px;border-radius:4px;font-size:11px;letter-spacing:.09em;text-transform:uppercase;text-decoration:none;font-weight:500;">Reply to Client</a>
    </td></tr>`
  return emailWrap('Milestone Sign-Off', body)
}
