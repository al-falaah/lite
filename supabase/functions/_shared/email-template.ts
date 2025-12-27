// Professional Email Template Styles for The FastTrack Madrasah
// Modern, clean design with improved branding

export const EMAIL_STYLES = `
  /* Reset and base styles */
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.7;
    color: #2d3748;
    background-color: #f7fafc;
    -webkit-font-smoothing: antialiased;
  }

  /* Email wrapper with gradient background */
  .email-wrapper {
    background: #f7fafc;
    padding: 32px 16px;
    min-height: 100vh;
  }

  /* Main container */
  .container {
    max-width: 600px;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  /* Header section with logo */
  .header {
    background: #ffffff;
    padding: 32px 32px 24px;
    text-align: center;
    border-bottom: 1px solid #e5e7eb;
  }

  /* Logo container with proper spacing */
  .logo-container {
    margin-bottom: 20px;
  }

  .logo-box {
    display: inline-block;
    background: #f0fdf4;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid #d1fae5;
  }

  .logo-box img {
    display: block;
    width: 48px;
    height: 48px;
  }

  /* Brand name styling */
  .brand-name {
    font-size: 20px;
    font-weight: 600;
    color: #059669;
    margin: 12px 0 4px;
  }

  .brand-tagline {
    font-size: 12px;
    color: #6b7280;
    font-weight: 400;
    margin-bottom: 0;
  }

  /* Header title */
  .header-title {
    font-size: 22px;
    font-weight: 600;
    color: #1a202c;
    margin: 24px 0 6px;
  }

  .header-subtitle {
    font-size: 14px;
    color: #6b7280;
    margin: 0;
    font-weight: 400;
  }

  /* Content section */
  .content {
    padding: 32px;
    background: #ffffff;
  }

  .greeting {
    font-size: 16px;
    font-weight: 500;
    color: #1a202c;
    margin-bottom: 20px;
  }

  .paragraph {
    margin-bottom: 16px;
    color: #4a5568;
    font-size: 15px;
    line-height: 1.6;
  }

  /* Info boxes */
  .info-box {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    padding: 20px;
    margin: 24px 0;
    border-radius: 8px;
  }

  .info-box-title {
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 12px;
  }

  .info-box table {
    width: 100%;
    border-collapse: collapse;
  }

  .info-box td {
    padding: 10px 0;
    border-bottom: 1px solid #e5e7eb;
  }

  .info-box tr:last-child td {
    border-bottom: none;
  }

  .label {
    font-weight: 500;
    color: #6b7280;
    width: 40%;
    font-size: 14px;
  }

  .value {
    color: #1f2937;
    font-size: 14px;
  }

  /* Call-to-action button */
  .cta-button {
    display: inline-block;
    background: #059669;
    color: #ffffff;
    padding: 12px 28px;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 500;
    font-size: 15px;
    margin: 20px 0;
  }

  .cta-button:hover {
    background: #047857;
  }

  /* Highlight boxes */
  .highlight-box {
    background: #fffbeb;
    border: 1px solid #fcd34d;
    padding: 16px;
    margin: 20px 0;
    border-radius: 6px;
  }

  .highlight-box h3 {
    margin: 0 0 8px 0;
    color: #92400e;
    font-size: 15px;
    font-weight: 600;
  }

  .highlight-box p {
    margin: 0;
    color: #78350f;
    font-size: 14px;
    line-height: 1.6;
  }

  /* Lists */
  ol, ul {
    margin: 16px 0;
    padding-left: 24px;
    color: #4a5568;
  }

  ol li, ul li {
    margin-bottom: 8px;
    line-height: 1.6;
    font-size: 15px;
  }

  /* Message box */
  .message-box {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    padding: 16px;
    margin: 20px 0;
    border-radius: 6px;
  }

  .message-title {
    font-size: 15px;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 12px;
  }

  .message-content {
    font-size: 15px;
    color: #4a5568;
    line-height: 1.6;
    white-space: pre-wrap;
  }

  /* From box (for messages) */
  .from-box {
    background: #f0fdf4;
    border: 1px solid #d1fae5;
    padding: 16px;
    margin: 20px 0;
    border-radius: 6px;
  }

  .from-title {
    font-size: 12px;
    font-weight: 600;
    color: #059669;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .from-info {
    font-size: 14px;
    color: #047857;
    line-height: 1.6;
  }

  /* Footer */
  .footer {
    text-align: center;
    padding: 32px;
    background: #f9fafb;
    border-top: 1px solid #e5e7eb;
  }

  .footer-text {
    color: #6b7280;
    font-size: 13px;
    margin: 4px 0;
    line-height: 1.5;
  }

  .footer-link {
    color: #059669;
    text-decoration: none;
    font-weight: 600;
    transition: color 0.2s ease;
  }

  .footer-link:hover {
    color: #047857;
    text-decoration: underline;
  }

  /* Responsive design */
  @media only screen and (max-width: 600px) {
    .email-wrapper {
      padding: 20px 10px;
    }

    .container {
      border-radius: 12px;
    }

    .header {
      padding: 32px 24px 24px;
    }

    .content {
      padding: 32px 24px;
    }

    .footer {
      padding: 32px 24px;
    }

    .brand-name {
      font-size: 24px;
    }

    .header-title {
      font-size: 26px;
    }

    .greeting {
      font-size: 20px;
    }

    .cta-button {
      padding: 14px 32px;
      font-size: 15px;
    }
  }
`;

// Logo HTML with base64 fallback
export function getLogoHTML(): string {
  return `
    <div class="logo-container">
      <div class="logo-box">
        <img
          src="https://tftmadrasah.nz/favicon.png"
          alt="The FastTrack Madrasah"
          width="48"
          height="48"
          style="display: block; width: 48px; height: 48px;"
        />
      </div>
    </div>
  `;
}

// Header HTML generator
export function getHeaderHTML(title: string, subtitle?: string): string {
  return `
    <div class="header">
      ${getLogoHTML()}
      <div class="brand-name">The FastTrack Madrasah</div>
      <div class="brand-tagline">Authentic Islamic Education</div>
      <h1 class="header-title">${title}</h1>
      ${subtitle ? `<p class="header-subtitle">${subtitle}</p>` : ''}
    </div>
  `;
}

// Footer HTML
export function getFooterHTML(): string {
  const currentYear = new Date().getFullYear();
  return `
    <div class="footer">
      <p class="footer-text"><strong>The FastTrack Madrasah</strong></p>
      <p class="footer-text">Authentic Islamic Education Rooted in the Qur'an and Sunnah</p>
      <p class="footer-text" style="margin-top: 16px;">
        <a href="mailto:admin@tftmadrasah.nz" class="footer-link">admin@tftmadrasah.nz</a>
      </p>
      <p class="footer-text" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
        © ${currentYear} The FastTrack Madrasah. All rights reserved.
      </p>
      <p class="footer-text">New Zealand</p>
    </div>
  `;
}
