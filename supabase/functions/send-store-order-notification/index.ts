// @ts-nocheck — Deno edge function (URL imports + Deno global are valid)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'admin@tftmadrasah.nz'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const formatNZD = (n) =>
  `NZ$${Number(n || 0).toFixed(2)}`

const escapeHtml = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { orderId } = await req.json()

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Order ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: order, error: orderErr } = await supabaseClient
      .from('store_orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderErr || !order) {
      throw new Error('Order not found')
    }

    const { data: items, error: itemsErr } = await supabaseClient
      .from('store_order_items')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })

    if (itemsErr) {
      throw new Error(`Failed to load order items: ${itemsErr.message}`)
    }

    const itemRows = (items || []).map((it) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
          <div style="font-weight: 500; color: #1f2937;">${escapeHtml(it.product_name)}</div>
          <div style="font-size: 13px; color: #6b7280;">Qty ${it.quantity} × ${formatNZD(it.product_price_nzd)}</div>
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right; color: #1f2937; font-weight: 500; white-space: nowrap;">
          ${formatNZD(it.subtotal_nzd)}
        </td>
      </tr>
    `).join('')

    const addressLines = [
      order.delivery_address_line1,
      order.delivery_address_line2,
      [order.delivery_city, order.delivery_postal_code].filter(Boolean).join(' '),
      order.delivery_country,
    ].filter(Boolean).map(escapeHtml).join('<br>')

    const appUrl = Deno.env.get('APP_URL') || 'https://tftmadrasah.nz'

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'The FastTrack Madrasah <noreply@tftmadrasah.nz>',
        to: [ADMIN_EMAIL],
        subject: `New Store Order: #${order.order_number} — ${order.customer_name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">New Store Order</h2>

            <p>A new order has been placed and is awaiting your review.</p>

            <div style="background-color: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
              <p style="margin: 0; font-size: 16px; font-weight: 600; color: #065f46;">
                Order #${escapeHtml(order.order_number)}
              </p>
              <p style="margin: 4px 0 0; font-size: 14px; color: #047857;">
                Total: <strong>${formatNZD(order.total_nzd)}</strong> · ${escapeHtml(order.payment_method || 'Payment method not set')}
              </p>
            </div>

            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Customer</h3>
              <p><strong>Name:</strong> ${escapeHtml(order.customer_name)}</p>
              <p><strong>Email:</strong> ${escapeHtml(order.customer_email)}</p>
              ${order.customer_phone ? `<p><strong>Phone:</strong> ${escapeHtml(order.customer_phone)}</p>` : ''}
              ${order.customer_whatsapp ? `<p><strong>WhatsApp:</strong> ${escapeHtml(order.customer_whatsapp)}</p>` : ''}
            </div>

            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Delivery Address</h3>
              <p style="line-height: 1.6;">${addressLines || '<em>No address provided</em>'}</p>
            </div>

            <div style="background-color: #ffffff; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Items</h3>
              <table style="width: 100%; border-collapse: collapse;">
                ${itemRows || '<tr><td><em>No items</em></td></tr>'}
                <tr>
                  <td style="padding: 12px 0 4px; color: #6b7280; font-size: 14px;">Subtotal</td>
                  <td style="padding: 12px 0 4px; text-align: right; color: #1f2937; font-size: 14px;">${formatNZD(order.subtotal_nzd)}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #6b7280; font-size: 14px;">Shipping</td>
                  <td style="padding: 4px 0; text-align: right; color: #1f2937; font-size: 14px;">${formatNZD(order.shipping_cost_nzd)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0 0; color: #1f2937; font-weight: 600; border-top: 2px solid #e5e7eb;">Total</td>
                  <td style="padding: 8px 0 0; text-align: right; color: #059669; font-weight: 700; font-size: 16px; border-top: 2px solid #e5e7eb;">${formatNZD(order.total_nzd)}</td>
                </tr>
              </table>
            </div>

            ${order.customer_notes ? `
              <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Customer Notes</h3>
                <p style="white-space: pre-wrap; margin: 0;">${escapeHtml(order.customer_notes)}</p>
              </div>
            ` : ''}

            <div style="margin: 30px 0;">
              <p><strong>Placed:</strong> ${new Date(order.created_at).toLocaleString()}</p>
            </div>

            <div style="margin: 30px 0; text-align: center;">
              <a href="${appUrl}/admin"
                 style="display: inline-block; background-color: #059669; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                Manage Orders in Admin Dashboard
              </a>
            </div>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #6b7280;">
              This is an automated notification. Update fulfilment status from the admin dashboard.
            </p>
          </div>
        `,
      }),
    })

    if (!emailRes.ok) {
      const errText = await emailRes.text()
      throw new Error(`Failed to send email: ${errText}`)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Admin notification sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
