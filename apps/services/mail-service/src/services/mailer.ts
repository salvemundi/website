import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';
import { ClientSecretCredential } from '@azure/identity';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class MailerService {
    private static credential?: ClientSecretCredential;

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
    static async send(to: string, templateId: string, data: any): Promise<boolean> {
        try {
            console.log(`[MailerService] Preparing ${templateId} for ${to}...`);

            // 1. Render HTML
            const htmlContent = await this.renderTemplate(templateId, data);

            // 2. Authenticate with Azure
            if (!this.credential) {
                const tenantId = process.env.AZURE_WEBSITEV7_TENANT_ID;
                const clientId = process.env.AZURE_MAIL_CLIENT_ID;
                const clientSecret = process.env.AZURE_MAIL_CLIENT_SECRET;

                if (!tenantId || !clientId || !clientSecret) {
                    throw new Error('Missing Azure AD credentials (TENANT_ID, CLIENT_ID, or CLIENT_SECRET)');
                }
                this.credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
            }

            const tokenResponse = await this.credential.getToken('https://graph.microsoft.com/.default');

            // 3. Dispatch via Microsoft Graph
            // Note: We use the 'from' address of the vereniging, typically handled via a specific user ID or /me if using delegated (but we use application permissions)
            // For app permissions, we use /users/{id_or_email}/sendMail
            const senderEmail = process.env.AZURE_MAIL_SENDER || 'info@salvemundi.nl';
            
            const response = await fetch(`https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${tokenResponse.token}`,
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
            throw error; // Rethrow to let the worker handle retries
        }
    }
}
