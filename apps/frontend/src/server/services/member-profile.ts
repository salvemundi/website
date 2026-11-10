import 'server-only';
import { z } from 'zod';
import { updateProfileSchema } from '@salvemundi/validations/schema/profiel.zod';
import { db, schema } from '@salvemundi/db';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { triggerUserSyncAction } from '@/server/actions/infrastructure/azure-sync/sync-tasks.actions';
import { clearSessionCache } from '@/server/auth/session-utils';
import { safeConsoleError } from '@/server/utils/logger';
import { sendWhitelistWebhook } from '@/server/actions/infrastructure/mcwhitelist.actions';
interface AzureErrorResponse { details?: string; error?: { code?: string; message?: string }; code?: string; message?: string }
export async function updateUserProfileForUser(data: z.infer<typeof updateProfileSchema>, user: { id: string; entra_id?: string | null }) {

    if (!user.id) {
        return { success: false, error: 'Je bent niet ingelogd.' };
    }

    const { checkRateLimit } = await import('@/server/utils/ratelimit');
    const rateLimitResult = await checkRateLimit('profile-update', 10, 300, 'Te veel wijzigingen. Probeer het over 5 minutes opnieuw.');
    if (!rateLimitResult.success) return rateLimitResult;

    const parsed = updateProfileSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: 'Ongeldige data' };
    }

    const AZURE_MGMT_URL = process.env.AZURE_MANAGEMENT_SERVICE_URL;
    const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN?.replace(/^"|"$/g, '').trim();

    try {
        const entraId = user.entra_id;

        if (parsed.data.phone_number && entraId) {
            const azureRes = await fetch(`${AZURE_MGMT_URL}/api/users/${entraId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${INTERNAL_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phoneNumber: parsed.data.phone_number })
            });

            if (!azureRes.ok) {
                const errorData = await azureRes.json().catch(() => ({})) as AzureErrorResponse;
                safeConsoleError('[profiel-update.actions.ts][updateUserProfile] Azure AD phone number update failed:', errorData);

                const details = errorData.details || '';
                if (details.includes('Insufficient privileges')) {
                    return {
                        success: false,
                        error: 'Als ICT-beheerder kun je je telefoonnummer niet via de website bewerken vanwege Azure AD beveiligingslimieten. Pas dit handmatig aan in het Microsoft Entra-portal.'
                    };
                }

                return {
                    success: false,
                    error: `Azure AD update mislukt: ${details || 'Ongeldig telefoonnummer of service onbeschikbaar.'}`
                };
            }

            await triggerUserSyncAction(entraId).catch((error: unknown) => {
                safeConsoleError(`[profiel-update.actions.ts][updateUserProfile] Error triggering sync:`, error);
            });
        }

        const directusData: { minecraft_username?: string | null; phone_number?: string | null } = {};
        if (parsed.data.minecraft_username !== undefined) {
            directusData.minecraft_username = parsed.data.minecraft_username;
            parsed.data.minecraft_username &&
                await sendWhitelistWebhook(user.id, parsed.data.minecraft_username).catch((error: unknown) => {
                    safeConsoleError(`[profiel-update.actions.ts][updateUserProfile] Error sending whitelist webhook:`, error);
                });
        }

        // Always write the phone number to Directus to ensure it's saved locally immediately
        if (parsed.data.phone_number !== undefined) {
            directusData.phone_number = parsed.data.phone_number;
        }

        if (Object.keys(directusData).length > 0) {
            await db.update(schema.directus_users)
                .set(directusData)
                .where(eq(schema.directus_users.id, user.id));
        }

        await clearSessionCache();

        revalidatePath('/profiel');
        revalidatePath('/profiel', 'page');
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (error: unknown) {
        safeConsoleError('[profiel-update.actions.ts][updateUserProfile] Profile update failed:', error);
        return { success: false, error: 'Bijwerken mislukt door een onbekende systeemfout.' };
    }
}
