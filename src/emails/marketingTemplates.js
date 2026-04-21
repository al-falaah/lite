// Marketing email templates used by the admin bulk-email modal.
// Each template returns { subject, body } where body is the full inner HTML
// that will be placed inside the shared email template (header/footer added
// by the edge function via EMAIL_STYLES + getHeaderHTML/getFooterHTML).
//
// Supported variables (replaced per-recipient in send-student-email):
//   {{full_name}}      — recipient's full name
//   {{referral_code}}  — recipient's unique referral code
//
// The edge function wraps `body` with a greeting + sign-off when isHtml=false.
// When a template is chosen we send with isHtml=true so the template controls
// its own structure (still uses shared EMAIL_STYLES since the outer shell
// applies those styles).

export const MARKETING_TEMPLATES = [
  {
    key: 'referral_announcement',
    label: 'Referral program announcement',
    description: 'Introduces the $50/3-referrals program + their personal code',
    subject: 'A way to say thank you — introducing our referral program',
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>__EMAIL_STYLES__</style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      __HEADER__('A way to say thank you', 'Introducing our referral program')

      <div class="content">
        <h2 class="greeting">As-salāmu ʿalaykum {{full_name}},</h2>

        <p class="paragraph">Jazaakumullaahu khayran for being part of The FastTrack Madrasah from the very beginning. Your trust in us means a great deal.</p>

        <p class="paragraph">As we continue to grow, we'd love for you to help us reach other families who would benefit from authentic Islamic learning. And we'd like to reward you for doing so.</p>

        <div class="info-box" style="background: #ecfdf5; border-left: 4px solid #059669;">
          <div class="info-box-title" style="color: #065f46;">Your personal referral code</div>
          <p style="margin: 12px 0; text-align: center;">
            <span style="display: inline-block; background: white; border: 2px dashed #059669; padding: 12px 20px; border-radius: 8px; font-family: monospace; font-size: 20px; font-weight: 700; color: #059669; letter-spacing: 1px;">{{referral_code}}</span>
          </p>
        </div>

        <p class="paragraph" style="margin-top: 32px;"><strong style="font-size: 18px; color: #1a202c;">How it works:</strong></p>
        <ul style="margin: 16px 0; padding-left: 28px; color: #4a5568;">
          <li style="margin-bottom: 12px; line-height: 1.7;">Share your code with friends or family who might benefit.</li>
          <li style="margin-bottom: 12px; line-height: 1.7;">When they use it at checkout, they get <strong>25% off</strong> their enrollment.</li>
          <li style="margin-bottom: 12px; line-height: 1.7;">For every <strong>3 friends</strong> who enroll using your code, we'll send you a <strong>$50 NZD</strong> transfer as a thank-you.</li>
        </ul>

        <p class="paragraph" style="margin-top: 32px;">No cap, no fine print — the more people benefit from your referral, the more we'll send your way.</p>

        <p class="paragraph" style="margin-top: 36px;">If you have any questions, just reply to this email or reach out to <a href="mailto:admin@tftmadrasah.nz" style="color: #059669; text-decoration: none; font-weight: 600;">admin@tftmadrasah.nz</a>.</p>

        <p class="paragraph" style="margin-top: 32px; font-style: italic; color: #6b7280;">May Allah reward you for sharing knowledge with others.</p>

        <p class="paragraph" style="margin-top: 36px; padding-top: 24px; border-top: 2px solid #e5e7eb;">
          Jazaakumullaahu Khayran,<br>
          <strong style="color: #059669;">The FastTrack Madrasah Team</strong>
        </p>
      </div>

      __FOOTER__
    </div>
  </div>
</body>
</html>`,
  },
  {
    key: 'cohort_launch',
    label: 'New cohort / program launch',
    description: 'Announce a new program or cohort opening enrolments',
    subject: '[Program] enrolments are now open',
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>__EMAIL_STYLES__</style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      __HEADER__('Enrolments are now open', 'A new cohort begins soon')

      <div class="content">
        <h2 class="greeting">As-salāmu ʿalaykum {{full_name}},</h2>

        <p class="paragraph">We're opening enrolments for our next cohort and wanted you to know first.</p>

        <div class="info-box">
          <div class="info-box-title">Program details</div>
          <p style="color: #4a5568; font-size: 15px; line-height: 1.7;">
            [Edit this section — program name, start date, schedule, price. Keep it short.]
          </p>
        </div>

        <p class="paragraph">If you know someone who might benefit, feel free to share your referral code <strong style="color: #059669; font-family: monospace;">{{referral_code}}</strong> — they get 25% off.</p>

        <center style="margin: 32px 0;">
          <a href="https://www.tftmadrasah.nz/programs" class="cta-button" style="background: #059669; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block;">View programs</a>
        </center>

        <p class="paragraph" style="margin-top: 32px;">Reply to this email with any questions.</p>

        <p class="paragraph" style="margin-top: 36px; padding-top: 24px; border-top: 2px solid #e5e7eb;">
          Jazaakumullaahu Khayran,<br>
          <strong style="color: #059669;">The FastTrack Madrasah Team</strong>
        </p>
      </div>

      __FOOTER__
    </div>
  </div>
</body>
</html>`,
  },
  {
    key: 'check_in',
    label: 'Student check-in',
    description: 'Gentle reminder / motivation mid-program',
    subject: 'Checking in on your progress',
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>__EMAIL_STYLES__</style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      __HEADER__('How are your studies going?', 'A quick check-in from the team')

      <div class="content">
        <h2 class="greeting">As-salāmu ʿalaykum {{full_name}},</h2>

        <p class="paragraph">We wanted to check in and see how you're finding your classes so far. If anything is unclear, or if you've missed sessions and want to catch up, please let us know — we're here to help.</p>

        <p class="paragraph">A few things that help most students stay on track:</p>
        <ul style="margin: 16px 0; padding-left: 28px; color: #4a5568;">
          <li style="margin-bottom: 12px; line-height: 1.7;">Review notes shortly after each class, while the material is fresh.</li>
          <li style="margin-bottom: 12px; line-height: 1.7;">Do the practice drills in the student portal between sessions.</li>
          <li style="margin-bottom: 12px; line-height: 1.7;">Reach out to your teacher if something is unclear — don't wait.</li>
        </ul>

        <p class="paragraph" style="margin-top: 24px;">Reply to this email if you want to share feedback or raise anything with us directly.</p>

        <p class="paragraph" style="margin-top: 32px; font-style: italic; color: #6b7280;">May Allah make your studies light and beneficial.</p>

        <p class="paragraph" style="margin-top: 36px; padding-top: 24px; border-top: 2px solid #e5e7eb;">
          Jazaakumullaahu Khayran,<br>
          <strong style="color: #059669;">The FastTrack Madrasah Team</strong>
        </p>
      </div>

      __FOOTER__
    </div>
  </div>
</body>
</html>`,
  },
];

export function getTemplate(key) {
  return MARKETING_TEMPLATES.find((t) => t.key === key) || null;
}
