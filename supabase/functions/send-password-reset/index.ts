// @ts-nocheck — Deno edge function (URL imports + Deno global are valid)
//
// Branded password-reset flow.
//
// The default Supabase Auth email goes through their built-in SMTP and
// looks generic. We already use Resend with a verified domain for every
// other transactional email, so this function:
//   1. Calls supabase.auth.admin.generateLink({ type: 'recovery' }) to
//      mint a recovery link for the user (no Supabase email is sent
//      because we use the admin generator, not resetPasswordForEmail)
//   2. Renders our branded email template (header + footer from
//      _shared/email-template) and sends it through Resend
//
// To prevent enumeration, we always return success — even when the
// email isn't on file.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail } from '../_shared/email.ts';
import { EMAIL_STYLES, getHeaderHTML, getFooterHTML } from '../_shared/email-template.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function buildEmailHTML({ recoveryLink, fullName, appUrl }: { recoveryLink: string; fullName?: string | null; appUrl: string }) {
  const greeting = fullName ? `As-salāmu ʿalaykum ${fullName},` : 'As-salāmu ʿalaykum,';
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
      ${getHeaderHTML('Reset your password', 'We received a request to reset your password')}

      <div class="content">
        <h2 class="greeting">${greeting}</h2>

        <p class="paragraph">We received a request to reset the password for your account. Click the button below to set a new password.</p>

        <div class="highlight-box">
          <h3>Set a new password</h3>
          <p style="margin: 16px 0; font-size: 15px; color: #92400e; line-height: 1.7;">
            Click the button below to set a new password. This link will expire in 1 hour.
          </p>
          <center style="margin: 24px 0;">
            <a href="${recoveryLink}" class="cta-button" style="background: #059669; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block;">Reset password →</a>
          </center>
          <p style="margin: 20px 0 0 0; font-size: 14px; color: #92400e; line-height: 1.7;">
            <strong>Security tip:</strong> Choose a strong password — at least 8 characters with a mix of letters, numbers, and symbols.
          </p>
        </div>

        <p class="paragraph" style="margin-top: 32px;">
          If you didn't request this reset, you can safely ignore this email — your password won't be changed.
        </p>

        <p class="paragraph" style="margin-top: 36px;">
          Need help? Reach out to <a href="mailto:salam@tftmadrasah.nz" style="color: #059669; text-decoration: none; font-weight: 600;">salam@tftmadrasah.nz</a>.
        </p>

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
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const appUrl = Deno.env.get('APP_URL') || 'https://www.tftmadrasah.nz';
    const redirectUrl = `${appUrl}/reset-password`;

    // Try to look up the student to personalise the greeting. If the email
    // isn't a student, fall back to teachers, then admins. Missing rows are
    // not surfaced to the caller (anti-enumeration).
    let fullName: string | null = null;
    const { data: studentRow } = await supabase
      .from('students')
      .select('full_name')
      .eq('email', trimmedEmail)
      .maybeSingle();
    if (studentRow?.full_name) fullName = studentRow.full_name;
    if (!fullName) {
      const { data: teacherRow } = await supabase
        .from('teachers')
        .select('full_name')
        .eq('email', trimmedEmail)
        .maybeSingle();
      if (teacherRow?.full_name) fullName = teacherRow.full_name;
    }

    // Mint a recovery link. If the user doesn't exist, Supabase returns an
    // error — we swallow it to avoid email enumeration and still return
    // the same "we sent it if you're registered" response.
    const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: trimmedEmail,
      options: { redirectTo: redirectUrl },
    });

    if (linkErr || !linkData?.properties?.action_link) {
      console.warn('Recovery link not generated (probably no account):', linkErr?.message);
      return new Response(
        JSON.stringify({ success: true, message: 'If an account exists for that email, a reset link has been sent.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = buildEmailHTML({
      recoveryLink: linkData.properties.action_link,
      fullName,
      appUrl,
    });

    const result = await sendEmail({
      to: trimmedEmail,
      subject: 'Reset your password — The FastTrack Madrasah',
      html,
    });

    if (!result.success) {
      console.error('Resend send failed:', result.error);
      // Still return success to the client to avoid enumeration; the user
      // will retry from the form if they don't get the email.
      return new Response(
        JSON.stringify({ success: true, message: 'If an account exists for that email, a reset link has been sent.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Password reset email sent' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('send-password-reset error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
