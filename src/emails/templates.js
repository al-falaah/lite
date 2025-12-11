// Modern Email templates for Al-Falaah Academy with logo and branding

const EMAIL_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #1f2937;
    background-color: #f9fafb;
  }
  .email-wrapper {
    background-color: #f9fafb;
    padding: 40px 20px;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  .header {
    background: white;
    padding: 32px 40px 24px;
    text-align: center;
    border-bottom: 1px solid #e5e7eb;
  }
  .logo-container {
    margin-bottom: 16px;
  }
  .logo {
    width: 56px;
    height: 56px;
    margin: 0 auto;
  }
  .brand-name {
    font-size: 24px;
    font-weight: 700;
    color: #059669;
    margin: 8px 0 4px;
  }
  .brand-tagline {
    font-size: 13px;
    color: #6b7280;
    font-weight: 400;
  }
  .header-title {
    font-size: 28px;
    font-weight: 700;
    color: #111827;
    margin: 20px 0 8px;
  }
  .header-subtitle {
    font-size: 15px;
    color: #6b7280;
  }
  .content {
    padding: 40px;
  }
  .greeting {
    font-size: 20px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 16px;
  }
  .paragraph {
    margin-bottom: 16px;
    color: #374151;
    font-size: 15px;
    line-height: 1.6;
  }
  .button {
    display: inline-block;
    background: #059669;
    color: white !important;
    padding: 14px 32px;
    text-decoration: none;
    border-radius: 8px;
    margin: 24px 0;
    font-weight: 600;
    font-size: 15px;
    transition: all 0.2s;
  }
  .button:hover {
    background: #047857;
    transform: translateY(-1px);
  }
  .footer {
    text-align: center;
    padding: 32px 40px;
    background: #f9fafb;
    border-top: 1px solid #e5e7eb;
  }
  .footer-text {
    color: #6b7280;
    font-size: 13px;
    margin: 4px 0;
  }
  .footer-link {
    color: #059669;
    text-decoration: none;
  }
  .info-box {
    background: #f0fdf4;
    border: 1px solid #a7f3d0;
    border-radius: 8px;
    padding: 20px;
    margin: 24px 0;
  }
  .info-box-title {
    font-size: 16px;
    font-weight: 600;
    color: #065f46;
    margin-bottom: 12px;
  }
  .warning-box {
    background: #fffbeb;
    border: 1px solid #fcd34d;
    border-radius: 8px;
    padding: 20px;
    margin: 24px 0;
  }
  .warning-box-title {
    font-size: 16px;
    font-weight: 600;
    color: #92400e;
    margin-bottom: 8px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
  }
  td {
    padding: 10px 0;
    border-bottom: 1px solid #e5e7eb;
    font-size: 14px;
  }
  td:last-child {
    text-align: right;
  }
  .label {
    font-weight: 500;
    color: #6b7280;
  }
  .value {
    font-weight: 600;
    color: #111827;
  }
  ol, ul {
    margin: 16px 0;
    padding-left: 24px;
  }
  li {
    margin: 8px 0;
    color: #374151;
    font-size: 15px;
  }
  a {
    color: #059669;
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }
  .highlight {
    background: #fef3c7;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 600;
  }
  .divider {
    height: 1px;
    background: #e5e7eb;
    margin: 24px 0;
  }
  strong {
    color: #111827;
    font-weight: 600;
  }
  .center {
    text-align: center;
  }
`;

const getLogoSvg = () => `
<svg width="56" height="56" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="64" height="64" rx="12" fill="#059669"/>

  <!-- Open Book Shape -->
  <!-- Left page -->
  <path d="M 16 18 L 30 20 L 30 46 L 16 44 Z" fill="white" opacity="0.95"/>
  <!-- Right page -->
  <path d="M 34 20 L 48 18 L 48 44 L 34 46 Z" fill="white" opacity="0.95"/>
  <!-- Center binding -->
  <rect x="31" y="18" width="2" height="28" fill="#047857"/>

  <!-- AFA Text centered on both pages with stroke -->
  <text x="32" y="37" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#059669" stroke="white" stroke-width="0.5" text-anchor="middle">
    AFA
  </text>
</svg>
`;

const getEmailHeader = (title, subtitle = '') => `
<div class="header">
  <div class="logo-container">
    ${getLogoSvg()}
  </div>
  <div class="brand-name">Al-Falaah Academy</div>
  <div class="brand-tagline">الفلاح • Authentic Islamic Education</div>
  ${title ? `<h1 class="header-title">${title}</h1>` : ''}
  ${subtitle ? `<p class="header-subtitle">${subtitle}</p>` : ''}
</div>
`;

const getEmailFooter = () => `
<div class="footer">
  <p class="footer-text"><strong>Al-Falaah Academy</strong></p>
  <p class="footer-text">Authentic Islamic Education Rooted in the Qur'an and Sunnah</p>
  <p class="footer-text" style="margin-top: 16px;">
    <a href="mailto:admin@alfalaah-academy.nz" class="footer-link">admin@alfalaah-academy.nz</a>
  </p>
  <p class="footer-text" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
    © ${new Date().getFullYear()} Al-Falaah Academy. All rights reserved.
  </p>
  <p class="footer-text">New Zealand</p>
</div>
`;

const getProgramName = (program) => {
  return program === 'tajweed'
    ? 'Tajweed Program'
    : 'Essential Arabic & Islamic Studies Program';
};

const getProgramDuration = (program) => {
  return program === 'tajweed' ? '6 months' : '2 years';
};

// Generic email template for admin dashboard custom emails
export const genericEmail = (recipientName, subject, message) => {
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
          ${getEmailHeader(subject)}

          <div class="content">
            <h2 class="greeting">As-salāmu ʿalaykum ${recipientName},</h2>

            <div style="color: #374151; line-height: 1.6; white-space: pre-wrap;">${message}</div>

            <p class="paragraph" style="margin-top: 32px;">
              JazakAllah Khair,<br>
              <strong>Al-Falaah Academy Team</strong>
            </p>
          </div>

          ${getEmailFooter()}
        </div>
      </div>
    </body>
    </html>
  `;
};

export const applicationConfirmationEmail = (applicantData) => {
  const { full_name, email, program } = applicantData;
  const programName = getProgramName(program);
  const programDuration = getProgramDuration(program);

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
          ${getEmailHeader('Application Received', 'We have received your application')}

          <div class="content">
            <h2 class="greeting">As-salāmu ʿalaykum ${full_name},</h2>

            <p class="paragraph">Jazākumullāhu Khayran for your interest in Al-Falaah Academy. We have received your application and are excited about the possibility of welcoming you to our learning community.</p>

            <div class="info-box">
              <div class="info-box-title">Application Summary</div>
              <table>
                <tr>
                  <td class="label">Applicant Name</td>
                  <td class="value">${full_name}</td>
                </tr>
                <tr>
                  <td class="label">Email Address</td>
                  <td class="value">${email}</td>
                </tr>
                <tr>
                  <td class="label">Program</td>
                  <td class="value">${programName}</td>
                </tr>
                <tr>
                  <td class="label">Duration</td>
                  <td class="value">${programDuration}</td>
                </tr>
              </table>
            </div>

            <p class="paragraph"><strong>What happens next?</strong></p>
            <ol>
              <li>Our admissions team will carefully review your application</li>
              <li>You will receive an email within 3-5 business days with a decision</li>
              <li>If approved, you'll receive an enrollment link to complete your registration</li>
              <li>After enrollment, you'll gain access to your student portal and class schedule</li>
            </ol>

            <div class="divider"></div>

            <p class="paragraph">If you have any questions or need assistance, please don't hesitate to contact us at <a href="mailto:admin@alfalaah-academy.nz">admin@alfalaah-academy.nz</a>.</p>

            <p class="paragraph">May Allah bless your journey of seeking knowledge and make it a means of closeness to Him.</p>

            <p class="paragraph" style="margin-top: 32px;">
              Best regards,<br>
              <strong>Al-Falaah Admissions Team</strong>
            </p>
          </div>

          ${getEmailFooter()}
        </div>
      </div>
    </body>
    </html>
  `;
};

export const inviteEmail = (applicantData, inviteToken, baseUrl = 'http://localhost:5173') => {
  const { full_name, program } = applicantData;
  const programName = getProgramName(program);
  const signupUrl = `${baseUrl}/signup?token=${inviteToken}`;

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
          ${getEmailHeader('Congratulations! 🎉', 'Your application has been approved')}

          <div class="content">
            <h2 class="greeting">As-salāmu ʿalaykum ${full_name},</h2>

            <p class="paragraph">We are delighted to inform you that your application to Al-Falaah Academy has been <strong>approved</strong>!</p>

            <div class="info-box">
              <div class="info-box-title">Your Program</div>
              <p class="paragraph" style="margin: 0;"><strong>${programName}</strong></p>
              <p class="paragraph" style="margin-top: 8px; margin-bottom: 0;">You are now ready to complete your enrollment and begin your journey in authentic Islamic education.</p>
            </div>

            <p class="paragraph"><strong>Complete Your Enrollment:</strong></p>
            <ol>
              <li>Click the button below to access the enrollment page</li>
              <li>Create your account with a secure password</li>
              <li>Review and confirm your enrollment details</li>
              <li>Complete the payment process</li>
              <li>Access your personalized student portal</li>
            </ol>

            <div class="center">
              <a href="${signupUrl}" class="button">Complete Enrollment →</a>
            </div>

            <div class="warning-box">
              <div class="warning-box-title">⏰ Important Notice</div>
              <p class="paragraph" style="margin: 0;">This invitation link will expire in <strong>7 days</strong>. Please complete your enrollment as soon as possible to secure your place in the program.</p>
            </div>

            <p class="paragraph" style="font-size: 13px; color: #6b7280;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p class="paragraph" style="word-break: break-all; font-size: 13px; color: #059669; background: #f0fdf4; padding: 12px; border-radius: 6px;">${signupUrl}</p>

            <div class="divider"></div>

            <p class="paragraph">If you have any questions or need assistance with the enrollment process, please contact us at <a href="mailto:admin@alfalaah-academy.nz">admin@alfalaah-academy.nz</a>.</p>

            <p class="paragraph">We look forward to having you join our community of learners!</p>

            <p class="paragraph" style="margin-top: 32px;">
              Best regards,<br>
              <strong>Al-Falaah Admissions Team</strong>
            </p>
          </div>

          ${getEmailFooter()}
        </div>
      </div>
    </body>
    </html>
  `;
};

export const welcomeEmail = (studentData, baseUrl = 'http://localhost:5173') => {
  const { full_name, student_id, program } = studentData;
  const programName = getProgramName(program);
  const programDuration = getProgramDuration(program);
  const dashboardUrl = `${baseUrl}/student`;

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
          ${getEmailHeader('Welcome to Al-Falaah! 🌟', 'Your journey of knowledge begins now')}

          <div class="content">
            <h2 class="greeting">As-salāmu ʿalaykum ${full_name},</h2>

            <p class="paragraph">Welcome to Al-Falaah Academy! We are thrilled to have you join our community of dedicated learners on the path of authentic Islamic knowledge.</p>

            <div class="info-box">
              <div class="info-box-title">Your Enrollment Details</div>
              <table>
                <tr>
                  <td class="label">Student ID</td>
                  <td class="value" style="color: #059669; font-size: 16px;">${student_id}</td>
                </tr>
                <tr>
                  <td class="label">Program</td>
                  <td class="value">${programName}</td>
                </tr>
                <tr>
                  <td class="label">Duration</td>
                  <td class="value">${programDuration}</td>
                </tr>
                <tr>
                  <td class="label">Status</td>
                  <td class="value" style="color: #059669;">✓ Active</td>
                </tr>
              </table>
            </div>

            <p class="paragraph"><strong>Access Your Student Portal:</strong></p>
            <p class="paragraph">Your personalized student portal is now ready! Use your <span class="highlight">Student ID: ${student_id}</span> to log in and access:</p>

            <ul>
              <li>Your weekly class schedule with meeting links</li>
              <li>Enrollment and payment details</li>
              <li>Track your progress and attendance</li>
              <li>Important announcements and updates</li>
            </ul>

            <div class="center">
              <a href="${dashboardUrl}" class="button">Access Student Portal →</a>
            </div>

            <div class="divider"></div>

            <p class="paragraph"><strong>Important Reminders:</strong></p>
            <ul>
              <li>Keep your Student ID safe - you'll need it to access your portal</li>
              <li>Check your class schedule regularly for meeting times and links</li>
              <li>Attend all scheduled classes punctually</li>
              <li>Keep your contact information up to date</li>
            </ul>

            <p class="paragraph">If you have any questions or need support, please don't hesitate to reach out to us at <a href="mailto:admin@alfalaah-academy.nz">admin@alfalaah-academy.nz</a>.</p>

            <p class="paragraph">May Allah make this journey beneficial for you, grant you success in your studies, and make this knowledge a means of drawing closer to Him.</p>

            <p class="paragraph" style="margin-top: 32px;">
              JazakAllah Khair,<br>
              <strong>Al-Falaah Academy Team</strong>
            </p>
          </div>

          ${getEmailFooter()}
        </div>
      </div>
    </body>
    </html>
  `;
};