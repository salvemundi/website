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
    committeeName?: string;
    committeeEmail?: string;
    contactName?: string;
    contactPhone?: string;
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
    // Use local Next.js API route to avoid CORS issues
    // The API route (/api/send-email) will proxy to the actual email service
    const apiEndpoint = '/api/send-email';
    const fromEmail = process.env.NEXT_PUBLIC_EMAIL_FROM || 'noreply@salvemundi.nl';
    const fromName = process.env.NEXT_PUBLIC_EMAIL_FROM_NAME || 'Salve Mundi';

    // Check if using Microsoft Graph API
    const useMicrosoftGraph = false;

    return {
        apiEndpoint,
        fromEmail,
        fromName,
        useMicrosoftGraph,
    };
}

function buildCommitteeEmailFromName(name?: string | null): string | undefined {
    if (!name) return undefined;
    const normalized = name.toLowerCase();
    if (normalized.includes('feest')) return 'feest@salvemundi.nl';
    if (normalized.includes('activiteit')) return 'activiteiten@salvemundi.nl';
    if (normalized.includes('studie')) return 'studie@salvemundi.nl';

    const slug = name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/commissie|committee/g, '')
        .replace(/[^a-z0-9]+/g, '')
        .trim();
    if (!slug) return undefined;
    return `${slug}@salvemundi.nl`;
}

/**
 * Send email using the configured email service
 */
interface EmailAttachment {
    name: string;
    contentType: string;
    contentBytes: string;
    isInline?: boolean;
    contentId?: string;
}

async function sendEmail(
    config: EmailConfig,
    to: string,
    subject: string,
    htmlBody: string,
    attachments?: EmailAttachment[]
): Promise<void> {
    if (config.useMicrosoftGraph) {
      return;
    }

    // NOTE: Calling email API directly from frontend causes CORS errors.
    // For production, implement a Next.js API route (e.g., /api/send-email) that:
    // 1. Receives the email data from frontend
    // 2. Calls the email service from the backend (no CORS issues)
    // 3. Returns success/error to frontend
    // For now, we'll attempt to send but gracefully handle CORS failures.

    try {
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
                attachments: attachments && attachments.length ? attachments : undefined,
            }),
        });

        if (!response.ok) {
            throw new Error(`Email API responded with status ${response.status}`);
        }
    } catch (error: any) {
        // Silently handle CORS errors - these are expected when calling external API from browser
        if (error.message?.includes('CORS') || error.message?.includes('Failed to fetch')) {
          return;
        }
        throw error;
    }
}

/**
 * Send event signup confirmation email to the user
 * And notification email to the organization
 */
export async function sendEventSignupEmail(data: EventSignupEmailData): Promise<void> {
    const config = getEmailConfig();

    if (!config.apiEndpoint) {
      return;
    }

    try {
        // Ensure eventPrice is a number
        const eventPrice = typeof data.eventPrice === 'number' ? data.eventPrice : Number(data.eventPrice) || 0;
        
        // Format the event date nicely
        const formattedDate = new Date(data.eventDate).toLocaleDateString('nl-NL', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Prepare QR code attachment for email
        let qrCodeAttachment: EmailAttachment | undefined;
        let qrCodeCid = '';
        if (data.qrCodeDataUrl) {
            const base64Data = data.qrCodeDataUrl.includes(',')
                ? data.qrCodeDataUrl.split(',')[1]
                : data.qrCodeDataUrl;
            // Use a unique content ID without special characters
            qrCodeCid = `qrcode${Date.now()}`;
            qrCodeAttachment = {
                name: 'qr-code.png',
                contentType: 'image/png',
                contentBytes: base64Data,
                isInline: true,
                contentId: qrCodeCid,
            };
        }
        const committeeEmail = data.committeeEmail || buildCommitteeEmailFromName(data.committeeName);
        const contactInfoSection = (data.contactName || data.contactPhone || committeeEmail || data.committeeName)
            ? `
        <div style="background-color: #F5F5DC; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #FF6B35; margin-top: 0;">Contactinformatie</h3>
          ${data.committeeName ? `<p><strong>Commissie:</strong> ${data.committeeName}</p>` : ''}
          ${data.contactName ? `<p><strong>Contactpersoon:</strong> ${data.contactName}</p>` : ''}
          ${data.contactPhone ? `<p><strong>Telefoon:</strong> ${data.contactPhone}</p>` : ''}
          ${committeeEmail ? `<p><strong>E-mail:</strong> <a href="mailto:${committeeEmail}" style="color: #7B2CBF; font-weight: bold;">${committeeEmail}</a></p>` : ''}
        </div>
      ` : '';

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
              <p><strong>Prijs:</strong> €${eventPrice.toFixed(2)}</p>
              ${data.phoneNumber ? `<p><strong>Telefoonnummer:</strong> ${data.phoneNumber}</p>` : ''}
            </div>
            ${contactInfoSection}
            ${qrCodeAttachment ? `
              <div style="background-color: #F5F5DC; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <h3 style="color: #7B2CBF; margin-top: 0;">Jouw Toegangscode</h3>
                <p style="margin-bottom: 15px;">Laat deze QR code zien bij de ingang van de activiteit:</p>
                <img src="cid:${qrCodeCid}" alt="QR Code voor toegang" style="max-width: 250px; height: auto; border: 3px solid #7B2CBF; border-radius: 8px; display: block; margin: 0 auto;" />
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
              <p><strong>Prijs:</strong> €${eventPrice.toFixed(2)}</p>
              <p><strong>Aangemeld door:</strong> ${data.userName}</p>
            </div>
          </div>
        </body>
      </html>
    `;

        // Send emails sequentially to avoid race conditions
        try {
            await sendEmail(
                config,
                data.recipientEmail,
                `Bevestiging aanmelding: ${data.eventName}`,
                userEmailBody,
                qrCodeAttachment ? [qrCodeAttachment] : undefined
            );
            
        } catch (err) {
            console.error('❌ Failed to send participant email:', err);
        }

        try {
            await sendEmail(config, config.fromEmail, `Nieuwe aanmelding: ${data.eventName} - ${data.recipientName}`, orgEmailBody);
            
        } catch (err) {
            console.error('❌ Failed to send organization email:', err);
        }

        
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
      return;
    }

    try {
        const adminEmailBody = `
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

        const userEmailBody = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #7B2CBF;">Bevestiging inschrijving lidmaatschap</h1>
            <p>Hoi ${data.firstName},</p>
            <p>Bedankt voor je aanmelding bij Salve Mundi! We hebben je gegevens ontvangen en nemen snel contact met je op om je lidmaatschap in orde te maken.</p>
            <div style="background-color: #F5F5DC; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #FF6B35; margin-top: 0;">Jouw gegevens</h2>
              <p><strong>Naam:</strong> ${data.firstName} ${data.lastName}</p>
              <p><strong>Email:</strong> ${data.recipientEmail}</p>
              <p><strong>Telefoonnummer:</strong> ${data.phoneNumber}</p>
              ${data.dateOfBirth ? `<p><strong>Geboortedatum:</strong> ${data.dateOfBirth}</p>` : ''}
            </div>
            <p>Heb je nog vragen? <a href="mailto:intro@salvemundi.nl?subject=Vraag%20over%20lidmaatschap" style="color: #7B2CBF; font-weight: bold;">Stuur ons gerust een bericht</a>, we helpen je graag verder.</p>
            <p style="margin-top: 30px;">Tot snel!<br/><strong>Salve Mundi</strong></p>
          </div>
        </body>
      </html>
    `;

        try {
            await sendEmail(
                config,
                data.recipientEmail,
                'Bevestiging lidmaatschap inschrijving',
                userEmailBody
            );
            // membership confirmation sent (log removed)
        } catch (error) {
            console.error('❌ Failed to send membership confirmation to participant:', error);
        }

        try {
            await sendEmail(
                config,
                config.fromEmail,
                `Nieuwe lidmaatschap aanmelding: ${data.firstName} ${data.lastName}`,
                adminEmailBody
            );
            // membership notification sent to organization (log removed)
        } catch (error) {
            console.error('❌ Failed to send membership signup notification to organization:', error);
        }
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
      return;
    }

    try {
        await sendEmail(config, to, subject, htmlBody);
        // notification sent (log removed)
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
            <p style="margin-top: 30px;">Tot snel!<br/><strong>Salve Mundi</strong></p>
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
            
        } catch (err) {
            console.error('❌ Failed to send participant email:', err);
        }

        try {
            await sendEmail(config, config.fromEmail, `Nieuwe introweek aanmelding: ${participantName}`, orgEmailBody);
            
        } catch (err) {
            console.error('❌ Failed to send organization email:', err);
        }

        
    } catch (error) {
        console.error('❌ Failed to send intro signup emails:', error);
    }
}

/**
 * Send intro blog update notification to all newsletter subscribers
 * Uses the Next.js API route which fetches data from Directus and sends to email service
 */
export async function sendIntroBlogUpdateNotification(data: {
    blogTitle: string;
    blogExcerpt?: string;
    blogUrl: string;
    blogImage?: string;
}): Promise<void> {
    try {
        const response = await fetch('/api/send-intro-update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to send intro update notifications');
        }

        await response.json();
        // intro update notifications sent (response consumed)
    } catch (error) {
        console.error('❌ Failed to send intro update notifications:', error);
        throw error;
    }
}
