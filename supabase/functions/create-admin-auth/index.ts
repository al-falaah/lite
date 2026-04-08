// @ts-nocheck — Deno edge function (URL imports + Deno global are valid)
// Edge Function: Create Admin Auth User
// Called by director to invite a new admin (madrasah_admin, blog_admin, store_admin, research_admin)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail } from '../_shared/email.ts'
import { EMAIL_STYLES, getHeaderHTML, getFooterHTML } from '../_shared/email-template.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const VALID_ADMIN_ROLES = ['madrasah_admin', 'blog_admin', 'store_admin', 'research_admin']

const ROLE_LABELS: Record<string, string> = {
  madrasah_admin: 'Madrasah Administrator',
  blog_admin: 'Blog Administrator',
  store_admin: 'Store Administrator',
  research_admin: 'Research Administrator',
}

const ROLE_DASHBOARDS: Record<string, string> = {
  madrasah_admin: '/admin',
  blog_admin: '/blog/admin',
  store_admin: '/store/admin',
  research_admin: '/research',
}

function generateEmailHTML(adminData: { full_name: string; email: string; role: string }, inviteLink: string): string {
  const roleLabel = ROLE_LABELS[adminData.role] || adminData.role
  const dashboard = ROLE_DASHBOARDS[adminData.role] || '/admin'

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
          ${getHeaderHTML('Welcome to The FastTrack Madrasah', `You've been invited as ${roleLabel}`)}

          <div class="content">
            <h2 class="greeting">As-salāmu ʿalaykum ${adminData.full_name},</h2>

            <p class="paragraph">You have been invited to join The FastTrack Madrasah as a <strong>${roleLabel}</strong>. We are glad to have you on the team!</p>

            <div class="info-box">
              <div class="info-box-title">Your Account Details</div>
              <table>
                <tr>
                  <td class="label">Email</td>
                  <td class="value">${adminData.email}</td>
                </tr>
                <tr>
                  <td class="label">Role</td>
                  <td class="value"><strong>${roleLabel}</strong></td>
                </tr>
                <tr>
                  <td class="label">Status</td>
                  <td class="value" style="color: #059669; font-weight: 700;">✓ Active</td>
                </tr>
              </table>
            </div>

            <div class="highlight-box">
              <h3>Activate Your Account</h3>
              <p style="margin: 16px 0; font-size: 15px; color: #92400e; line-height: 1.7;">
                Click the button below to set up your password and activate your account. This link will expire in 24 hours.
              </p>
              <center style="margin: 24px 0;">
                <a href="${inviteLink}" class="cta-button" style="background: #059669; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block;">Set Up Your Account →</a>
              </center>
              <p style="margin: 20px 0 0 0; font-size: 14px; color: #92400e; line-height: 1.7;">
                <strong>Security Tip:</strong> Choose a strong password (minimum 8 characters) that includes letters, numbers, and special characters.
              </p>
            </div>

            <p class="paragraph" style="margin-top: 32px;">Once your account is set up, you can sign in at <a href="https://www.tftmadrasah.nz/login" style="color: #059669; text-decoration: none; font-weight: 600;">tftmadrasah.nz/login</a> and you will be directed to your dashboard.</p>

            <p class="paragraph" style="margin-top: 32px;">If you have any questions, please reach out to us at <a href="mailto:admin@tftmadrasah.nz" style="color: #059669; text-decoration: none; font-weight: 600;">admin@tftmadrasah.nz</a>.</p>

            <p class="paragraph" style="margin-top: 32px; font-style: italic; color: #6b7280;">May Allah bless your efforts in serving this community.</p>

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
  `
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: { ...corsHeaders, 'Access-Control-Allow-Methods': 'POST' },
    })
  }

  try {
    const { email, full_name, role } = await req.json()

    if (!email || !full_name || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, full_name, role' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    if (!VALID_ADMIN_ROLES.includes(role)) {
      return new Response(
        JSON.stringify({ error: `Invalid role. Must be one of: ${VALID_ADMIN_ROLES.join(', ')}` }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Create auth user
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email: email,
      email_confirm: false,
      user_metadata: { full_name, role },
    })

    if (authError) {
      // Handle existing user
      if (authError.message?.includes('already been registered') || authError.message?.includes('already exists')) {
        console.log('User already exists, looking up...')
        const { data: { users } } = await supabaseClient.auth.admin.listUsers()
        const existingUser = users?.find(u => u.email === email)

        if (existingUser) {
          // Update their profile to the new admin role
          await supabaseClient
            .from('profiles')
            .upsert({
              id: existingUser.id,
              email,
              full_name,
              role,
              is_admin: true,
            })

          // Generate invite link (try invite, fall back to recovery for confirmed users)
          const existingRedirectUrl = `${Deno.env.get('APP_URL') || 'https://www.tftmadrasah.nz'}/reset-password`
          let resetData: any = null
          let resetError: any = null

          const existingInviteResult = await supabaseClient.auth.admin.generateLink({
            type: 'invite',
            email,
            options: { redirectTo: existingRedirectUrl },
          })
          resetData = existingInviteResult.data
          resetError = existingInviteResult.error

          if (resetError) {
            console.log('Invite link failed for existing user, trying recovery:', resetError.message)
            const existingRecoveryResult = await supabaseClient.auth.admin.generateLink({
              type: 'recovery',
              email,
              options: { redirectTo: existingRedirectUrl },
            })
            resetData = existingRecoveryResult.data
            resetError = existingRecoveryResult.error
          }

          if (resetError) {
            return new Response(
              JSON.stringify({ error: 'User exists but failed to generate invite link', auth_user_id: existingUser.id }),
              { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
            )
          }

          // Send welcome email
          const inviteLink = resetData.properties.action_link
          const emailHTML = generateEmailHTML({ full_name, email, role }, inviteLink)
          await sendEmail({ to: email, subject: `You're Invited — The FastTrack Madrasah`, html: emailHTML })

          return new Response(
            JSON.stringify({ success: true, auth_user_id: existingUser.id, message: 'Existing user updated and invite sent' }),
            { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          )
        }
      }

      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    console.log('✅ Admin auth user created:', authData.user.id)

    // Create/update profile with admin role
    await supabaseClient
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email,
        full_name,
        role,
        is_admin: true,
      })

    // Generate invite link (try invite, fall back to recovery for confirmed users)
    const redirectUrl = `${Deno.env.get('APP_URL') || 'https://www.tftmadrasah.nz'}/reset-password`
    let resetData: any = null
    let resetError: any = null

    // Try invite first
    const inviteResult = await supabaseClient.auth.admin.generateLink({
      type: 'invite',
      email,
      options: { redirectTo: redirectUrl },
    })
    resetData = inviteResult.data
    resetError = inviteResult.error

    // If invite fails (e.g. user already confirmed), try recovery
    if (resetError) {
      console.log('Invite link failed, trying recovery link:', resetError.message)
      const recoveryResult = await supabaseClient.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: { redirectTo: redirectUrl },
      })
      resetData = recoveryResult.data
      resetError = recoveryResult.error
    }

    if (resetError) {
      return new Response(
        JSON.stringify({ error: 'User created but failed to generate setup link', auth_user_id: authData.user.id }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // Send welcome email via Resend
    const inviteLink = resetData.properties.action_link
    const emailHTML = generateEmailHTML({ full_name, email, role }, inviteLink)
    const emailResult = await sendEmail({
      to: email,
      subject: `You're Invited — The FastTrack Madrasah`,
      html: emailHTML,
    })

    if (!emailResult.success) {
      console.error('Failed to send invite email:', emailResult.error)
    }

    return new Response(
      JSON.stringify({
        success: true,
        auth_user_id: authData.user.id,
        invite_link: inviteLink,
        email_sent: emailResult.success,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  } catch (error) {
    console.error('Error in create-admin-auth:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }
})
