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

const fsRef = fs as unknown as {
    existsSync: (path: string) => boolean;
    readdirSync: (path: string) => string[];
    readFileSync: {
        (path: string, options: 'utf-8'): string;
        (path: string): Buffer;
    };
};

const templatesDir = path.join(__dirname, '../templates');
if (fsRef['existsSync'](templatesDir)) {
    const files = fsRef['readdirSync'](templatesDir);
    files.forEach(file => {
        if (file.endsWith('.hbs')) {
            const name = path.basename(file, '.hbs');
            const source = fsRef['readFileSync'](path.join(templatesDir, file), 'utf-8');
            Handlebars.registerPartial(name, source);
        }
    });
}

function ms(start: number): string {
    return `${(performance.now() - start).toFixed(1)}ms`;
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
        const cached = this.templateCache.get(templateId);
        if (cached) {
            return cached;
        }

        const templatePath = path.join(__dirname, '../templates', `${templateId}.hbs`);
        if (!fsRef['existsSync'](templatePath)) {
            throw new Error(`Template not found: ${templateId}`);
        }

        const source = fsRef['readFileSync'](templatePath, 'utf-8');
        const template = Handlebars.compile(source);

        this.templateCache.set(templateId, template);
        return template;
    }

    private static getLogoAttachment(): Record<string, unknown> | null {
        if (this.logoInitialized) {
            return this.cachedLogoAttachment;
        }

        const logoPath = path.join(__dirname, '../assets/newlogo.png');
        if (fsRef['existsSync'](logoPath)) {
            this.cachedLogoAttachment = {
                '@odata.type': '#microsoft.graph.fileAttachment',
                name: 'logo.png',
                contentType: 'image/png',
                contentBytes: fsRef['readFileSync'](logoPath).toString('base64'),
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
        const totalStart = performance.now();
        safeConsoleLog(`[mailer.ts][send] Preparing ${templateId} for ${to}...`);

        try {
            const htmlContent = this.renderTemplate(templateId, data);
            safeConsoleLog(`[mailer.ts][send] renderTemplate: ${ms(totalStart)} (html size: ${htmlContent.length} chars)`);

            const t2 = performance.now();
            const accessToken = await TokenService.getAccessToken(redis);
            safeConsoleLog(`[mailer.ts][send] getAccessToken: ${ms(t2)}`);

            const t3 = performance.now();
            const logoAttachment = this.getLogoAttachment();
            safeConsoleLog(`[mailer.ts][send] getLogoAttachment: ${ms(t3)} (cached: ${this.logoInitialized})`);

            const senderEmail = process.env.AZURE_MAIL_SENDER || 'info@salvemundi.nl';
            const customSubject = data['subject'] as string | undefined;
            const userFriendlySubject = customSubject || this.SUBJECT_MAP.get(templateId) || templateId.replace(/[-_]/g, ' ');

            const t4 = performance.now();
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
            safeConsoleLog(`[mailer.ts][send] Graph API sendMail: ${ms(t4)} (status: ${response.status})`);

            if (!response.ok) {
                const errorData = await response.json() as unknown;
                throw new Error(`Graph API Error: ${JSON.stringify(errorData)}`);
            }

            safeConsoleLog(`[mailer.ts][send] Successfully dispatched to ${to}`);
            safeConsoleLog(`[mailer.ts][send][timing] TOTAL send(): ${ms(totalStart)}`);
            return true;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            safeConsoleError(`[mailer.ts][send] Failed to send email:`, errorMessage);
            safeConsoleLog(`[mailer.ts][send][timing] TOTAL send() (failed): ${ms(totalStart)}`);
            throw error;
        }
    }
}