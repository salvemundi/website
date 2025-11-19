// Email notification service
// This service handles sending email notifications for various events

export interface EmailConfig {
  apiEndpoint: string;
  fromEmail: string;
  fromName: string;
  useMicrosoftGraph: boolean;
}

export interface EventSignupEmailData {
  recipientEmail: string;
  recipientName: string;
  eventName: string;
  eventDate: string;
  eventPrice: number;
  phoneNumber?: string;
  userName: string;
  qrCodeDataUrl?: string; // Base64 QR code image
}

export interface MembershipSignupEmailData {
  recipientEmail: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dateOfBirth?: string;
  favoriteGif?: string;
}

export interface IntroSignupEmailData {
  participantEmail: string;
  participantFirstName: string;
  participantLastName: string;
  dateOfBirth?: string;
  phoneNumber: string;
  favoriteGif?: string;
}

// Get email configuration from environment variables
function getEmailConfig(): EmailConfig {
  const apiEndpoint = import.meta.env.VITE_EMAIL_API_ENDPOINT || '';
  const fromEmail = import.meta.env.VITE_EMAIL_FROM || 'info@salvemundi.nl';
  
  // Check if using Microsoft Graph API
  const useMicrosoftGraph = apiEndpoint.includes('graph.microsoft.com');
  
  return {
    apiEndpoint,
    fromEmail,
    fromName: import.meta.env.VITE_EMAIL_FROM_NAME || 'Salve Mundi',
    useMicrosoftGraph,
  };
}

/**
 * Send email using the configured email service
 */
async function sendEmail(config: EmailConfig, to: string, subject: string, htmlBody: string): Promise<void> {
  if (config.useMicrosoftGraph) {
    console.warn('⚠️ Microsoft Graph API requires backend authentication. Email functionality is disabled.');
    console.warn('ℹ️ Please use Directus email endpoint or another email service.');
    console.warn('ℹ️ See readme/EMAIL_SETUP.md for configuration options.');
    return;
  }

  // Use standard email API
  const response = await fetch(config.apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to,
      from: config.fromEmail,
      fromName: config.fromName,
      subject,
      html: htmlBody,
    }),
  });

  if (!response.ok) {
    throw new Error(`Email API responded with status ${response.status}`);
  }
}

/**
 * Send event signup confirmation email to the user
 * And notification email to the organization
 */
export async function sendEventSignupEmail(data: EventSignupEmailData): Promise<void> {
  const config = getEmailConfig();
  
  if (!config.apiEndpoint) {
    console.warn('Email API endpoint not configured. Skipping email notification.');
    return;
  }

  try {
    // Format the event date nicely
    const formattedDate = new Date(data.eventDate).toLocaleDateString('nl-NL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Email to the user
    const userEmailBody = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #7B2CBF;">Bevestiging Aanmelding Activiteit</h1>
            <p>Beste ${data.recipientName},</p>
            <p>Je bent succesvol ingeschreven voor de volgende activiteit:</p>
            
            <div style="background-color: #F5F5DC; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #FF6B35; margin-top: 0;">${data.eventName}</h2>
              <p><strong>Datum en tijd:</strong> ${formattedDate}</p>
              <p><strong>Prijs:</strong> €${data.eventPrice.toFixed(2)}</p>
              ${data.phoneNumber ? `<p><strong>Telefoonnummer:</strong> ${data.phoneNumber}</p>` : ''}
            </div>
            
            ${data.qrCodeDataUrl ? `
              <div style="background-color: #F5F5DC; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <h3 style="color: #7B2CBF; margin-top: 0;">Jouw Toegangscode</h3>
                <p style="margin-bottom: 15px;">Laat deze QR code zien bij de ingang van de activiteit:</p>
                <img src="${data.qrCodeDataUrl}" alt="QR Code" style="max-width: 250px; border: 3px solid #7B2CBF; border-radius: 8px;" />
                <p style="margin-top: 15px; font-size: 12px; color: #666;">
                  <em>Bewaar deze email of maak een screenshot van de QR code</em>
                </p>
              </div>
            ` : ''}
            
            <p>We kijken ernaar uit om je te zien bij deze activiteit!</p>
            <p>Heb je vragen? Neem dan contact met ons op.</p>
            
            <p style="margin-top: 30px;">
              Met vriendelijke groet,<br>
              <strong>Het Salve Mundi Team</strong>
            </p>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
              <p>Dit is een automatisch gegenereerde email. Reageer niet op deze email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Email to the organization
    const orgEmailBody = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #7B2CBF;">Nieuwe Aanmelding: ${data.eventName}</h1>
            <p>Er is een nieuwe aanmelding voor een activiteit:</p>
            
            <div style="background-color: #F5F5DC; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #FF6B35; margin-top: 0;">${data.eventName}</h2>
              <p><strong>Naam:</strong> ${data.recipientName}</p>
              <p><strong>Email:</strong> ${data.recipientEmail}</p>
              ${data.phoneNumber ? `<p><strong>Telefoonnummer:</strong> ${data.phoneNumber}</p>` : ''}
              <p><strong>Datum en tijd:</strong> ${formattedDate}</p>
              <p><strong>Prijs:</strong> €${data.eventPrice.toFixed(2)}</p>
              <p><strong>Aangemeld door:</strong> ${data.userName}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send emails sequentially to avoid race conditions
    try {
      await sendEmail(config, data.recipientEmail, `Bevestiging aanmelding: ${data.eventName}`, userEmailBody);
      console.log('✅ Participant email sent');
    } catch (err) {
      console.error('❌ Failed to send participant email:', err);
    }

    try {
      await sendEmail(config, config.fromEmail, `Nieuwe aanmelding: ${data.eventName} - ${data.recipientName}`, orgEmailBody);
      console.log('✅ Organization notification email sent');
    } catch (err) {
      console.error('❌ Failed to send organization email:', err);
    }

    console.log('✅ Event signup email process completed');
  } catch (error) {
    console.error('❌ Failed to send event signup email:', error);
    // Don't throw error - we don't want to fail the signup if email fails
  }
}

/**
 * Send membership signup notification email to the organization
 */
export async function sendMembershipSignupEmail(data: MembershipSignupEmailData): Promise<void> {
  const config = getEmailConfig();
  
  if (!config.apiEndpoint) {
    console.warn('Email API endpoint not configured. Skipping email notification.');
    return;
  }

  try {
    const emailBody = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #7B2CBF;">Nieuwe Lidmaatschap Aanmelding</h1>
            <p>Er is een nieuwe aanmelding voor lidmaatschap:</p>
            
            <div style="background-color: #F5F5DC; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #FF6B35; margin-top: 0;">${data.firstName} ${data.lastName}</h2>
              <p><strong>Email:</strong> ${data.recipientEmail}</p>
              <p><strong>Telefoonnummer:</strong> ${data.phoneNumber}</p>
              ${data.dateOfBirth ? `<p><strong>Geboortedatum:</strong> ${data.dateOfBirth}</p>` : ''}
            </div>
            
            ${data.favoriteGif ? `
              <div style="margin: 20px 0;">
                <p><strong>Favoriete GIF:</strong></p>
                <img src="${data.favoriteGif}" alt="Favorite GIF" style="max-width: 300px; border-radius: 8px;" />
              </div>
            ` : ''}
            
            <p style="margin-top: 30px; color: #666;">
              <em>Aangemeld op: ${new Date().toLocaleDateString('nl-NL', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</em>
            </p>
          </div>
        </body>
      </html>
    `;

    await sendEmail(
      config, 
      config.fromEmail, 
      `Nieuwe lidmaatschap aanmelding: ${data.firstName} ${data.lastName}`,
      emailBody
    );

    console.log('✅ Membership signup email sent successfully');
  } catch (error) {
    console.error('❌ Failed to send membership signup email:', error);
    // Don't throw error - we don't want to fail the signup if email fails
  }
}

/**
 * Send a generic notification email
 */
export async function sendNotificationEmail(
  to: string,
  subject: string,
  htmlBody: string
): Promise<void> {
  const config = getEmailConfig();
  
  if (!config.apiEndpoint) {
    console.warn('Email API endpoint not configured. Skipping email notification.');
    return;
  }

  try {
    await sendEmail(config, to, subject, htmlBody);
    console.log('✅ Notification email sent successfully');
  } catch (error) {
    console.error('❌ Failed to send notification email:', error);
    throw error;
  }
}

/**
 * Send intro week signup confirmation email to the participant
 * and a notification email to the organization mailbox.
 */
export async function sendIntroSignupEmail(data: IntroSignupEmailData): Promise<void> {
  const config = getEmailConfig();

  if (!config.apiEndpoint) {
    console.warn('Email API endpoint not configured. Skipping intro signup email.');
    return;
  }

  try {
    const participantName = `${data.participantFirstName} ${data.participantLastName}`.trim();
    const userEmailBody = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #7B2CBF;">Bevestiging inschrijving intro week</h1>
            <p>Hoi ${data.participantFirstName},</p>
            <p>Wat leuk dat je je hebt aangemeld voor de introweek! We hebben je gegevens ontvangen:</p>
            <ul>
              <li><strong>Naam:</strong> ${participantName}</li>
              ${data.dateOfBirth ? `<li><strong>Geboortedatum:</strong> ${data.dateOfBirth}</li>` : ''}
              <li><strong>Telefoonnummer:</strong> ${data.phoneNumber}</li>
            </ul>
            ${data.favoriteGif ? `
              <p>Je favoriete GIF kon ons erg bekoren 🎉</p>
              <img src="${data.favoriteGif}" alt="Favoriete GIF" style="max-width: 240px; border-radius: 12px;" />
            ` : ''}
            <p>We sturen je binnenkort meer informatie, maar zet de introweek alvast in je agenda.</p>
            <p style="margin-top: 30px;">Tot snel!<br/><strong>Het Salve Mundi team</strong></p>
          </div>
        </body>
      </html>
    `;

    const orgEmailBody = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #7B2CBF;">Nieuwe intro aanmelding</h1>
            <p>Er is een nieuwe inschrijving voor de introweek:</p>
            <ul>
              <li><strong>Naam:</strong> ${participantName}</li>
              <li><strong>Email:</strong> ${data.participantEmail}</li>
              <li><strong>Telefoonnummer:</strong> ${data.phoneNumber}</li>
              ${data.dateOfBirth ? `<li><strong>Geboortedatum:</strong> ${data.dateOfBirth}</li>` : ''}
            </ul>
            ${data.favoriteGif ? `
              <p><strong>Favoriete GIF:</strong></p>
              <img src="${data.favoriteGif}" alt="Favoriete GIF" style="max-width: 300px; border-radius: 12px;" />
            ` : ''}
          </div>
        </body>
      </html>
    `;

    // Send emails sequentially to avoid race conditions
    try {
      await sendEmail(config, data.participantEmail, 'Bevestiging introweek aanmelding', userEmailBody);
      console.log('✅ Participant email sent');
    } catch (err) {
      console.error('❌ Failed to send participant email:', err);
    }

    try {
      await sendEmail(config, config.fromEmail, `Nieuwe introweek aanmelding: ${participantName}`, orgEmailBody);
      console.log('✅ Organization notification email sent');
    } catch (err) {
      console.error('❌ Failed to send organization email:', err);
    }

    console.log('✅ Intro signup email process completed');
  } catch (error) {
    console.error('❌ Failed to send intro signup emails:', error);
  }
}
