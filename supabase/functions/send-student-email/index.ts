// @ts-nocheck — Deno edge function (URL imports + Deno global are valid)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail } from '../_shared/email.ts';
import { EMAIL_STYLES, getHeaderHTML, getFooterHTML } from '../_shared/email-template.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function substituteVariables(text: string, student: any): string {
  return text
    .replace(/\{\{full_name\}\}/g, student.full_name || '')
    .replace(/\{\{referral_code\}\}/g, student.referral_code || '');
}

// Resolve templating placeholders in marketing templates (__EMAIL_STYLES__,
// __HEADER__('title', 'subtitle'), __FOOTER__).
function resolveTemplate(body: string): string {
  let out = body.replace(/__EMAIL_STYLES__/g, EMAIL_STYLES);
  out = out.replace(/__HEADER__\(\s*'([^']*)'\s*,\s*'([^']*)'\s*\)/g, (_, title, subtitle) => getHeaderHTML(title, subtitle));
  out = out.replace(/__HEADER__\(\s*'([^']*)'\s*\)/g, (_, title) => getHeaderHTML(title));
  out = out.replace(/__FOOTER__/g, getFooterHTML());
  return out;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { studentIds, subject, message, isHtml = false } = await req.json();

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Student IDs are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!subject || !message) {
      return new Response(
        JSON.stringify({ error: 'Subject and message are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: students, error } = await supabase
      .from('students')
      .select('id, email, full_name, referral_code')
      .in('id', studentIds);

    if (error) {
      console.error('Error fetching students:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch student emails' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!students || students.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No students found with provided IDs' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const getEmailHtml = (student: any) => {
      if (isHtml) {
        // Template path: resolve shared shell placeholders + substitute variables.
        const resolved = resolveTemplate(message);
        return substituteVariables(resolved, student);
      }

      // Plain-text message — wrap in default shell.
      const personalisedMessage = substituteVariables(message, student);
      const personalisedSubject = substituteVariables(subject, student);
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
      ${getHeaderHTML(personalisedSubject)}

      <div class="content">
        <h2 class="greeting">As-salāmu ʿalaykum ${student.full_name},</h2>

        <div style="color: #4a5568; font-size: 16px; line-height: 1.8; white-space: pre-wrap;">${personalisedMessage}</div>

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
    };

    // Sequential send with 100ms delay to stay under Resend's 10/sec rate limit.
    // Previous Promise.all would 429 above ~10 recipients.
    const results: any[] = [];
    console.log(`Sending to ${students.length} students (sequential, 100ms spacing)...`);
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const personalisedSubject = substituteVariables(subject, student);
      try {
        const result = await sendEmail({
          to: student.email,
          subject: personalisedSubject,
          html: getEmailHtml(student),
        });
        results.push({
          email: student.email,
          name: student.full_name,
          success: result.success,
          error: result.error,
        });
        if (result.success) {
          console.log(`✅ ${i + 1}/${students.length} → ${student.email}`);
        } else {
          console.error(`❌ ${i + 1}/${students.length} → ${student.email}: ${result.error}`);
        }
      } catch (err: any) {
        console.error(`❌ ${i + 1}/${students.length} → ${student.email}:`, err.message);
        results.push({ email: student.email, name: student.full_name, success: false, error: err.message });
      }
      if (i < students.length - 1) {
        await delay(100);
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    console.log(`Done: ${successCount} successful, ${failureCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failureCount,
        results: results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-student-email function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
