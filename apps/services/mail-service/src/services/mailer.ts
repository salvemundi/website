import { safeConsoleError, safeConsoleLog } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';
import { type Redis } from 'ioredis';
import { TokenService } from './token.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

Handlebars.registerHelper('eq', (a, b) => a === b);
Handlebars.registerHelper('neq', (a, b) => a !== b);
Handlebars.registerHelper('addOne', (value: number) => value + 1);

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
    private static readonly SUBJECT_MAP = new Map<string, string>([
        ['payment_confirmed', 'Betaling Bevestigd'],
        ['event-ticket', 'Je Ticket is Klaar!'],
        ['membership_renewal', 'Lidmaatschap Verlengd'],
        ['pub_crawl_ticket', 'Je Tickets voor de Kroegentocht'],
        ['welcome_payment', 'Welkom bij Salve Mundi'],
        ['event_signup', 'Inschrijving Bevestigd']
    ]);

    private static templateCache = new Map<string, HandlebarsTemplateDelegate>();

    private static cachedLogoAttachment: Record<string, unknown> | null = null;
    private static logoInitialized = false;

    private static getTemplate(templateId: string): HandlebarsTemplateDelegate {
        if (this.templateCache.has(templateId)) {
            return this.templateCache.get(templateId)!;
        }

        const templatePath = path.join(__dirname, '../templates', `${templateId}.hbs`);
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template not found: ${templateId}`);
        }

        const source = fs.readFileSync(templatePath, 'utf-8');
        const template = Handlebars.compile(source);

        this.templateCache.set(templateId, template);
        return template;
    }

    private static getLogoAttachment(): Record<string, unknown> | null {
        if (this.logoInitialized) {
            return this.cachedLogoAttachment;
        }

        const logoPath = path.join(__dirname, '../assets/newlogo.png');
        if (fs.existsSync(logoPath)) {
            this.cachedLogoAttachment = {
                '@odata.type': '#microsoft.graph.fileAttachment',
                name: 'logo.png',
                contentType: 'image/png',
                contentBytes: fs.readFileSync(logoPath).toString('base64'),
                contentId: 'logo',
                isInline: true
            };
        }

        this.logoInitialized = true;
        return this.cachedLogoAttachment;
    }

    private static renderTemplate(templateId: string, data: Record<string, unknown>): string {
        const template = this.getTemplate(templateId);
        return template(data);
    }

    static async send(redis: Redis, to: string, templateId: string, data: Record<string, unknown>): Promise<boolean> {
        try {
            safeConsoleLog(`[MailerService] Preparing ${templateId} for ${to}...`);

            const htmlContent = this.renderTemplate(templateId, data);
            const accessToken = await TokenService.getAccessToken(redis);
            const logoAttachment = this.getLogoAttachment();

            const senderEmail = process.env.AZURE_MAIL_SENDER || 'info@salvemundi.nl';
            const userFriendlySubject = this.SUBJECT_MAP.get(templateId) || templateId.replace(/[-_]/g, ' ');

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
                const errorData = await response.json() as unknown;
                throw new Error(`Graph API Error: ${JSON.stringify(errorData)}`);
            }

            safeConsoleLog(`[MailerService] Successfully dispatched to ${to}`);
            return true;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            safeConsoleError(`[MailerService] Failed to send email:`, errorMessage);
            throw error;
        }
    }
}