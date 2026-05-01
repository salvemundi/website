import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';
import { Redis } from 'ioredis';
import { TokenService } from './token.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

Handlebars.registerHelper('eq', (a, b) => a === b);
Handlebars.registerHelper('neq', (a, b) => a !== b);
Handlebars.registerHelper('addOne', (value: number) => value + 1);

// Register all templates as partials for easy layout wrapping
const templatesDir = path.join(__dirname, '../templates');
if (fs.existsSync(templatesDir)) {
    const files = fs.readdirSync(templatesDir);
    files.forEach(file => {
        if (file.endsWith('.hbs')) {
            const name = path.basename(file, '.hbs');
            const source = fs.readFileSync(path.join(templatesDir, file), 'utf-8');
            Handlebars.registerPartial(name, source);
        }
    });
}

export class MailerService {
    /**
     * Renders a Handlebars template with the provided data.
     */
    private static async renderTemplate(templateId: string, data: Record<string, unknown>): Promise<string> {
        const templatePath = path.join(__dirname, '../templates', `${templateId}.hbs`);
        
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template not found: ${templateId}`);
        }

        const source = fs.readFileSync(templatePath, 'utf-8');
        const template = Handlebars.compile(source);
        return template(data);
    }

    /**
     * Sends an email via Microsoft Graph API.
     */
    static async send(redis: Redis, to: string, templateId: string, data: Record<string, unknown>): Promise<boolean> {
        try {
            console.log(`[MailerService] Preparing ${templateId} for ${to}...`);

            // 1. Render HTML
            const htmlContent = await this.renderTemplate(templateId, data);

            // 2. Authenticate with Azure (using cached TokenService)
            const accessToken = await TokenService.getAccessToken(redis);

            // 3. Prepare Logo Attachment (CID)
            const logoPath = path.join(__dirname, '../assets/newlogo.png');
            let logoAttachment = null;
            if (fs.existsSync(logoPath)) {
                logoAttachment = {
                    '@odata.type': '#microsoft.graph.fileAttachment',
                    name: 'logo.png',
                    contentType: 'image/png',
                    contentBytes: fs.readFileSync(logoPath).toString('base64'),
                    contentId: 'logo',
                    isInline: true
                };
            }

            // 4. Dispatch via Microsoft Graph
            const senderEmail = process.env.AZURE_MAIL_SENDER || 'info@salvemundi.nl';

            // Map template ID to a user-friendly subject
            const subjectMap: Record<string, string> = {
                'payment_confirmed': 'Betaling Bevestigd',
                'event-ticket': 'Je Ticket is Klaar!',
                'membership_renewal': 'Lidmaatschap Verlengd',
                'pub_crawl_ticket': 'Je Tickets voor de Kroegentocht',
                'welcome_payment': 'Welkom bij Salve Mundi',
                'event_signup': 'Inschrijving Bevestigd'
            };
            const userFriendlySubject = subjectMap[templateId] || templateId.replace(/[-_]/g, ' ');

            const response = await fetch(`https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: {
                        subject: `Salve Mundi - ${userFriendlySubject}`,
                        body: {
                            contentType: 'HTML',
                            content: htmlContent
                        },
                        toRecipients: [
                            {
                                emailAddress: {
                                    address: to
                                }
                            }
                        ],
                        attachments: logoAttachment ? [logoAttachment] : []
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Graph API Error: ${JSON.stringify(errorData)}`);
            }

            console.log(`[MailerService] Successfully dispatched to ${to}`);
            return true;
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            console.error(`[MailerService] Failed to send email:`, err.message);
            throw err;
        }
    }
}
