import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';
import { Redis } from 'ioredis';
import { TokenService } from './token.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class MailerService {
    /**
     * Renders a Handlebars template with the provided data.
     */
    private static async renderTemplate(templateId: string, data: any): Promise<string> {
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
    static async send(redis: Redis, to: string, templateId: string, data: any): Promise<boolean> {
        try {
            console.log(`[MailerService] Preparing ${templateId} for ${to}...`);

            // 1. Render HTML
            const htmlContent = await this.renderTemplate(templateId, data);

            // 2. Authenticate with Azure (using cached TokenService)
            const accessToken = await TokenService.getAccessToken(redis);

            // 3. Dispatch via Microsoft Graph
            const senderEmail = process.env.AZURE_MAIL_SENDER || 'info@salvemundi.nl';
            
            const response = await fetch(`https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: {
                        subject: `Salve Mundi - ${templateId}`,
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
                        ]
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Graph API Error: ${JSON.stringify(errorData)}`);
            }

            console.log(`[MailerService] Successfully dispatched to ${to}`);
            return true;
        } catch (error: any) {
            console.error(`[MailerService] Failed to send email:`, error.message);
            throw error;
        }
    }
}
