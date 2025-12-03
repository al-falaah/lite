import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail } from '../_shared/email.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch student emails
    const { data: students, error } = await supabase
      .from('students')
      .select('email, full_name')
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

    // Prepare email HTML
    const emailHtml = isHtml ? message : `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                Al-Falaah Academy
              </h1>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
              <div style="color: #1f2937; line-height: 1.6; white-space: pre-wrap;">${message}</div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                Al-Falaah Academy
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                This email was sent from Al-Falaah Academy. Please do not reply to this email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send emails to all students
    const results = await Promise.all(
      students.map(async (student) => {
        const result = await sendEmail({
          to: student.email,
          subject: subject,
          html: emailHtml,
        });
        return {
          email: student.email,
          name: student.full_name,
          success: result.success,
          error: result.error,
        };
      })
    );

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`Email sending completed: ${successCount} successful, ${failureCount} failed`);

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
