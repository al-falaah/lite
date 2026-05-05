// @ts-nocheck — Deno edge function (URL imports + Deno global are valid)
// Edge Function: Send Store Order Confirmation Email to the Customer

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail } from '../_shared/email.ts';
import { EMAIL_STYLES, getHeaderHTML, getFooterHTML } from '../_shared/email-template.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const formatNZD = (n) => `NZ$${Number(n || 0).toFixed(2)}`;

const escapeHtml = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

function paymentInstructions(method) {
  if (method === 'bank_transfer') {
    return `
      <p class="paragraph"><strong>How to pay:</strong> Please make a bank transfer using your order number as the reference. Our team will email you the bank details and confirm receipt as soon as the transfer arrives.</p>
    `;
  }
  if (method === 'cash_on_delivery') {
    return `
      <p class="paragraph"><strong>How to pay:</strong> Payment is due in cash when your order is delivered.</p>
    `;
  }
  return `
    <p class="paragraph"><strong>What happens next:</strong> Our team will be in touch shortly with payment and delivery details.</p>
  `;
}

function generateEmailHTML(order, items) {
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
  `).join('');

  const addressLines = [
    order.delivery_address_line1,
    order.delivery_address_line2,
    [order.delivery_city, order.delivery_postal_code].filter(Boolean).join(' '),
    order.delivery_country,
  ].filter(Boolean).map(escapeHtml).join('<br>');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${EMAIL_STYLES}</style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="container">
          ${getHeaderHTML('Order Received', `Order #${escapeHtml(order.order_number)}`)}

          <div class="content">
            <h2 class="greeting">As-salāmu ʿalaykum ${escapeHtml(order.customer_name)},</h2>

            <p class="paragraph">Jazaakumullaahu Khayran for your order. We've received it and will be in touch shortly.</p>

            <div class="info-box">
              <div class="info-box-title">Order Summary</div>
              <table>
                ${itemRows}
                <tr>
                  <td class="label">Subtotal</td>
                  <td class="value" style="text-align: right;">${formatNZD(order.subtotal_nzd)}</td>
                </tr>
                <tr>
                  <td class="label">Shipping</td>
                  <td class="value" style="text-align: right;">${formatNZD(order.shipping_cost_nzd)}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0 0; color: #1f2937; font-weight: 700; border-top: 2px solid #e5e7eb; font-size: 15px;">Total</td>
                  <td style="padding: 12px 0 0; text-align: right; color: #059669; font-weight: 700; font-size: 16px; border-top: 2px solid #e5e7eb;">${formatNZD(order.total_nzd)}</td>
                </tr>
              </table>
            </div>

            <div class="info-box">
              <div class="info-box-title">Delivery Address</div>
              <p style="margin: 0; line-height: 1.6; color: #1f2937; font-size: 14px;">${addressLines || '<em>No address provided</em>'}</p>
            </div>

            ${paymentInstructions(order.payment_method)}

            <p class="paragraph">If you have any questions, reply to this email or contact us at <a href="mailto:admin@tftmadrasah.nz" style="color: #059669; text-decoration: none; font-weight: 600;">admin@tftmadrasah.nz</a>. Please quote your order number <strong>#${escapeHtml(order.order_number)}</strong>.</p>

            <p class="paragraph" style="margin-top: 36px; padding-top: 24px; border-top: 2px solid #e5e7eb;">
              Jazaakumullaahu Khayran,<br>
              <strong style="color: #059669;">The FastTrack Madrasah Team</strong>
            </p>
          </div>

          ${getFooterHTML()}
        </div>
      </div>
    </body>
    </html>
  `;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Order ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: order, error: orderErr } = await supabaseClient
      .from('store_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      throw new Error('Order not found');
    }

    if (!order.customer_email) {
      throw new Error('Order has no customer email');
    }

    const { data: items, error: itemsErr } = await supabaseClient
      .from('store_order_items')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (itemsErr) {
      throw new Error(`Failed to load order items: ${itemsErr.message}`);
    }

    const emailHTML = generateEmailHTML(order, items || []);

    const result = await sendEmail({
      to: order.customer_email,
      subject: `Order Received - #${order.order_number} - The FastTrack Madrasah`,
      html: emailHTML,
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to send email');
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Customer confirmation sent' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-store-order-confirmation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
