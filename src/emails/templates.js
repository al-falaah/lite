// Email templates for Al-Falaah notifications

const EMAIL_STYLES = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
  .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
  .button { display: inline-block; background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
  .button:hover { background: #047857; }
  .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  .info-box { background: #f0fdf4; border-left: 4px solid #059669; padding: 15px; margin: 20px 0; }
  .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
  .label { font-weight: 600; color: #6b7280; }
`;

export const applicationConfirmationEmail = (applicantData) => {
  const { full_name, email, program_type, class_format } = applicantData;

  const programName = program_type === 'foundational'
    ? '1-Year Foundational Certificate'
    : '3-Year Essentials Program';

  const formatName = class_format === 'one-on-one'
    ? 'One-on-One'
    : 'Cohort-Based';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>${EMAIL_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🕌 Al-Falaah Islamic Institute</h1>
          <p>Application Received</p>
        </div>

        <div class="content">
          <h2>Assalamu Alaikum ${full_name},</h2>

          <p>Thank you for your interest in Al-Falaah Islamic Institute. We have received your application and will review it shortly.</p>

          <div class="info-box">
            <h3>Application Summary</h3>
            <table>
              <tr>
                <td class="label">Name:</td>
                <td>${full_name}</td>
              </tr>
              <tr>
                <td class="label">Email:</td>
                <td>${email}</td>
              </tr>
              <tr>
                <td class="label">Program:</td>
                <td>${programName}</td>
              </tr>
              <tr>
                <td class="label">Format:</td>
                <td>${formatName}</td>
              </tr>
            </table>
          </div>

          <p><strong>What happens next?</strong></p>
          <ol>
            <li>Our admissions team will review your application</li>
            <li>You will receive an email within 3-5 business days</li>
            <li>If approved, you'll receive an invitation link to complete your enrollment</li>
          </ol>

          <p>If you have any questions, please don't hesitate to contact us at <a href="mailto:admin@alfalaah.co.nz">admin@alfalaah.co.nz</a>.</p>

          <p>May Allah bless your journey of seeking knowledge.</p>

          <p>Best regards,<br>
          <strong>Al-Falaah Admissions Team</strong></p>
        </div>

        <div class="footer">
          <p>© ${new Date().getFullYear()} Al-Falaah Islamic Institute. All rights reserved.</p>
          <p>New Zealand</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const inviteEmail = (applicantData, inviteToken, baseUrl = 'http://localhost:5173') => {
  const { full_name, email, program_type } = applicantData;

  const programName = program_type === 'foundational'
    ? '1-Year Foundational Certificate'
    : '3-Year Essentials Program';

  const signupUrl = `${baseUrl}/signup?token=${inviteToken}`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>${EMAIL_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Congratulations!</h1>
          <p>Your Application Has Been Approved</p>
        </div>

        <div class="content">
          <h2>Assalamu Alaikum ${full_name},</h2>

          <p>We are delighted to inform you that your application to Al-Falaah Islamic Institute has been <strong>approved</strong>!</p>

          <div class="info-box">
            <p><strong>Program:</strong> ${programName}</p>
            <p>You are now ready to complete your enrollment and begin your journey in Islamic education.</p>
          </div>

          <p><strong>Next Steps:</strong></p>
          <ol>
            <li>Click the button below to create your account</li>
            <li>Set up your password</li>
            <li>Complete your enrollment</li>
            <li>Access your student dashboard</li>
          </ol>

          <center>
            <a href="${signupUrl}" class="button">Complete Enrollment →</a>
          </center>

          <div class="warning-box">
            <p><strong>⏰ Important:</strong> This invitation link will expire in 7 days. Please complete your enrollment as soon as possible.</p>
          </div>

          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #059669;">${signupUrl}</p>

          <p>If you have any questions or need assistance, please contact us at <a href="mailto:admin@alfalaah.co.nz">admin@alfalaah.co.nz</a>.</p>

          <p>We look forward to having you join our learning community!</p>

          <p>Best regards,<br>
          <strong>Al-Falaah Team</strong></p>
        </div>

        <div class="footer">
          <p>© ${new Date().getFullYear()} Al-Falaah Islamic Institute. All rights reserved.</p>
          <p>New Zealand</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const welcomeEmail = (studentData) => {
  const { full_name, student_number, program_type } = studentData;

  const programName = program_type === 'foundational'
    ? '1-Year Foundational Certificate'
    : '3-Year Essentials Program';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>${EMAIL_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌟 Welcome to Al-Falaah!</h1>
          <p>Your Journey Begins Now</p>
        </div>

        <div class="content">
          <h2>Assalamu Alaikum ${full_name},</h2>

          <p>Welcome to Al-Falaah Islamic Institute! We are thrilled to have you join our community of learners.</p>

          <div class="info-box">
            <h3>Your Enrollment Details</h3>
            <table>
              <tr>
                <td class="label">Student ID:</td>
                <td><strong>${student_number}</strong></td>
              </tr>
              <tr>
                <td class="label">Program:</td>
                <td>${programName}</td>
              </tr>
              <tr>
                <td class="label">Status:</td>
                <td>✅ Active</td>
              </tr>
            </table>
          </div>

          <p><strong>What You Can Do Now:</strong></p>
          <ul>
            <li>Access your student dashboard at any time</li>
            <li>View your payment schedule</li>
            <li>Download lesson materials (once available)</li>
            <li>Track your attendance and progress</li>
            <li>Update your profile information</li>
          </ul>

          <center>
            <a href="http://localhost:5173/dashboard" class="button">Go to Dashboard →</a>
          </center>

          <p><strong>Important Reminders:</strong></p>
          <ul>
            <li>Check your payment schedule in the dashboard</li>
            <li>Complete payments before the due dates</li>
            <li>Attend all scheduled classes</li>
            <li>Keep your contact information up to date</li>
          </ul>

          <p>If you have any questions or need support, please don't hesitate to reach out to us at <a href="mailto:admin@alfalaah.co.nz">admin@alfalaah.co.nz</a>.</p>

          <p>May Allah make this journey beneficial for you and grant you success in your studies.</p>

          <p>Best regards,<br>
          <strong>Al-Falaah Team</strong></p>
        </div>

        <div class="footer">
          <p>© ${new Date().getFullYear()} Al-Falaah Islamic Institute. All rights reserved.</p>
          <p>New Zealand</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const paymentReminderEmail = (studentData, paymentData) => {
  const { full_name, student_number } = studentData;
  const { amount, due_date, installment_number, total_installments } = paymentData;

  const dueDate = new Date(due_date).toLocaleDateString('en-NZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const daysUntilDue = Math.ceil((new Date(due_date) - new Date()) / (1000 * 60 * 60 * 24));

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>${EMAIL_STYLES}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💳 Payment Reminder</h1>
          <p>Al-Falaah Islamic Institute</p>
        </div>

        <div class="content">
          <h2>Assalamu Alaikum ${full_name},</h2>

          <p>This is a friendly reminder about your upcoming payment for Al-Falaah Islamic Institute.</p>

          <div class="warning-box">
            <h3>Payment Due ${daysUntilDue > 0 ? `in ${daysUntilDue} day(s)` : 'Today'}</h3>
            <table>
              <tr>
                <td class="label">Student ID:</td>
                <td>${student_number}</td>
              </tr>
              <tr>
                <td class="label">Amount Due:</td>
                <td><strong style="font-size: 20px; color: #059669;">$${amount}</strong></td>
              </tr>
              <tr>
                <td class="label">Due Date:</td>
                <td>${dueDate}</td>
              </tr>
              <tr>
                <td class="label">Installment:</td>
                <td>${installment_number} of ${total_installments}</td>
              </tr>
            </table>
          </div>

          <center>
            <a href="http://localhost:5173/dashboard" class="button">Make Payment →</a>
          </center>

          <p><strong>Payment Methods:</strong></p>
          <ul>
            <li>Online payment via your student dashboard</li>
            <li>Bank transfer (contact admin for details)</li>
            <li>Contact us for alternative payment arrangements if needed</li>
          </ul>

          <p>If you have already made this payment, please disregard this reminder. It may take 1-2 business days for payments to reflect in our system.</p>

          <p>If you have any questions or are experiencing financial difficulties, please contact us immediately at <a href="mailto:admin@alfalaah.co.nz">admin@alfalaah.co.nz</a>. We're here to help!</p>

          <p>JazakAllah Khair,<br>
          <strong>Al-Falaah Finance Team</strong></p>
        </div>

        <div class="footer">
          <p>© ${new Date().getFullYear()} Al-Falaah Islamic Institute. All rights reserved.</p>
          <p>New Zealand</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
