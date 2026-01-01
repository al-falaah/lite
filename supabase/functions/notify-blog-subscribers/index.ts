import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  author_name: string
  published_at: string
  featured_image?: string
}

interface Subscriber {
  id: string
  email: string
  full_name?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { post_id } = await req.json()

    if (!post_id) {
      return new Response(
        JSON.stringify({ error: 'post_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client with service role
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // Fetch the blog post
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', post_id)
      .eq('status', 'published')
      .single<BlogPost>()

    if (postError || !post) {
      console.error('Error fetching post:', postError)
      return new Response(
        JSON.stringify({ error: 'Blog post not found or not published' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch all active subscribers
    const { data: subscribers, error: subsError } = await supabase
      .from('blog_subscribers')
      .select('id, email, full_name')
      .eq('is_active', true)

    if (subsError) {
      console.error('Error fetching subscribers:', subsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscribers' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!subscribers || subscribers.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active subscribers to notify' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare email data
    const siteUrl = 'https://www.tftmadrasah.nz'
    const postUrl = `${siteUrl}/blog/${post.slug}`
    const unsubscribeBaseUrl = `${siteUrl}/unsubscribe`

    // Send emails via Resend
    const emailPromises = subscribers.map(async (subscriber: Subscriber) => {
      const unsubscribeUrl = `${unsubscribeBaseUrl}?email=${encodeURIComponent(subscriber.email)}`

      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${post.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background: linear-gradient(to right, #059669, #0d9488); padding: 40px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
        The FastTrack Madrasah
      </h1>
      <p style="color: #ecfdf5; margin: 10px 0 0 0; font-size: 14px;">
        New Blog Post Published
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px;">
      ${subscriber.full_name ? `<p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">As-salāmu ʿalaykum ${subscriber.full_name},</p>` : '<p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">As-salāmu ʿalaykum,</p>'}

      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        We've just published a new article that you might find beneficial:
      </p>

      ${post.featured_image ? `
      <div style="margin-bottom: 30px; border-radius: 12px; overflow: hidden;">
        <img src="${post.featured_image}" alt="${post.title}" style="width: 100%; height: auto; display: block;" />
      </div>
      ` : ''}

      <h2 style="color: #111827; font-size: 24px; font-weight: bold; margin: 0 0 15px 0; line-height: 1.3;">
        ${post.title}
      </h2>

      ${post.excerpt ? `
      <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
        ${post.excerpt}
      </p>
      ` : ''}

      <div style="margin: 30px 0;">
        <a href="${postUrl}" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Read Full Article
        </a>
      </div>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 25px; margin-top: 40px;">
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;">
          <strong>Author:</strong> ${post.author_name}<br>
          <strong>Published:</strong> ${new Date(post.published_at).toLocaleDateString('en-NZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 15px 0;">
        You're receiving this email because you subscribed to The FastTrack Madrasah blog updates.
      </p>
      <p style="margin: 0;">
        <a href="${postUrl}" style="color: #059669; text-decoration: none; font-size: 14px; margin-right: 15px;">Visit Blog</a>
        <a href="${unsubscribeUrl}" style="color: #9ca3af; text-decoration: none; font-size: 14px;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>
`

      const emailText = `
The FastTrack Madrasah - New Blog Post

${post.title}

${post.excerpt || ''}

Read the full article: ${postUrl}

Author: ${post.author_name}
Published: ${new Date(post.published_at).toLocaleDateString('en-NZ')}

---
You're receiving this email because you subscribed to The FastTrack Madrasah blog updates.
Unsubscribe: ${unsubscribeUrl}
`

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'The FastTrack Madrasah <blog@tftmadrasah.nz>',
          to: [subscriber.email],
          subject: `New Article: ${post.title}`,
          html: emailHtml,
          text: emailText,
        }),
      })

      if (!res.ok) {
        const error = await res.text()
        console.error(`Failed to send email to ${subscriber.email}:`, error)
        throw new Error(`Failed to send email: ${error}`)
      }

      return await res.json()
    })

    const results = await Promise.allSettled(emailPromises)

    const successCount = results.filter(r => r.status === 'fulfilled').length
    const failCount = results.filter(r => r.status === 'rejected').length

    // Log detailed failure information
    const failures = results
      .map((result, index) => {
        if (result.status === 'rejected') {
          return {
            email: subscribers[index].email,
            error: result.reason?.message || String(result.reason)
          }
        }
        return null
      })
      .filter(Boolean)

    console.log(`Emails sent: ${successCount} successful, ${failCount} failed`)
    if (failures.length > 0) {
      console.error('Failed email details:', JSON.stringify(failures, null, 2))
    }

    return new Response(
      JSON.stringify({
        message: `Notification emails sent to ${successCount} subscribers`,
        total: subscribers.length,
        successful: successCount,
        failed: failCount,
        failures: failures.length > 0 ? failures : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in notify-blog-subscribers function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
