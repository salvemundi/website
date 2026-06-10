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

// Helper voor nette ms-formatting
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
        const totalStart = performance.now();
        safeConsoleLog(`[MailerService] Preparing ${templateId} for ${to}...`);

        try {
            // 1. Template renderen
            const t1 = performance.now();
            const htmlContent = this.renderTemplate(templateId, data);
            safeConsoleLog(`[MailerService] [timing] renderTemplate: ${ms(t1)} (html size: ${htmlContent.length} chars)`);

            // 2. Azure access token ophalen (cache of fresh)
            const t2 = performance.now();
            const accessToken = await TokenService.getAccessToken(redis);
            safeConsoleLog(`[MailerService] [timing] getAccessToken: ${ms(t2)}`);

            // 3. Logo attachment laden (gecached na eerste keer)
            const t3 = performance.now();
            const logoAttachment = this.getLogoAttachment();
            safeConsoleLog(`[MailerService] [timing] getLogoAttachment: ${ms(t3)} (cached: ${this.logoInitialized})`);

            const senderEmail = process.env.AZURE_MAIL_SENDER || 'info@salvemundi.nl';
            const customSubject = data['subject'] as string | undefined;
            const userFriendlySubject = customSubject || this.SUBJECT_MAP.get(templateId) || templateId.replace(/[-_]/g, ' ');

            // 4. Graph API call
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
            safeConsoleLog(`[MailerService] [timing] Graph API sendMail: ${ms(t4)} (status: ${response.status})`);

            if (!response.ok) {
                const errorData = await response.json() as unknown;
                throw new Error(`Graph API Error: ${JSON.stringify(errorData)}`);
            }

            safeConsoleLog(`[MailerService] Successfully dispatched to ${to}`);
            safeConsoleLog(`[MailerService] [timing] TOTAL send(): ${ms(totalStart)}`);
            return true;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            safeConsoleError(`[MailerService] Failed to send email:`, errorMessage);
            safeConsoleLog(`[MailerService] [timing] TOTAL send() (failed): ${ms(totalStart)}`);
            throw error;
        }
    }
}