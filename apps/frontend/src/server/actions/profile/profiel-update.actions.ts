'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { updateProfileSchema } from '@salvemundi/validations/schema/profiel.zod';
import { getSystemDirectus } from '@/lib/directus';
import { updateUser } from '@directus/sdk';
import { triggerUserSyncAction } from '@/server/actions/infrastructure/azure-sync/sync-tasks.actions';
import { clearSessionCache } from '@/server/auth/session-utils';
import { getAuthorizedUser } from '@/server/actions/events/activiteiten/auth-check';
import sharp from 'sharp';
import { safeConsoleError } from '@/server/utils/logger';

interface AzureErrorResponse {
    details?: string;
    error?: {
        code?: string;
        message?: string;
    };
    code?: string;
    message?: string;
}

export async function updateUserProfile(data: z.infer<typeof updateProfileSchema>) {
    const user = await getAuthorizedUser();

    if (!user?.id) {
        return { success: false, error: 'Not authenticated' };
    }

    const { rateLimit } = await import('@/server/utils/ratelimit');
    const { success } = await rateLimit('profile-update', 10, 300);
    if (!success) {
        return { success: false, error: 'Te veel wijzigingen. Probeer het over 5 minutes opnieuw.' };
    }

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
                return {
                    success: false,
                    error: `Azure AD update mislukt: ${errorData.details || 'Ongeldig telefoonnummer of service onbeschikbaar.'}`
                };
            }

            await triggerUserSyncAction(entraId).catch((error: unknown) => {
                safeConsoleError(`[profiel-update.actions.ts][updateUserProfile] Error triggering sync:`, error);
            });
        }

        const directusOnlyData: { [key: string]: unknown } = {};
        if (parsed.data.minecraft_username !== undefined) {
            directusOnlyData.minecraft_username = parsed.data.minecraft_username;
        }

        if (Object.keys(directusOnlyData).length > 0) {
            await getSystemDirectus().request(updateUser(user.id, directusOnlyData));
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

export async function uploadUserAvatar(formData: FormData) {
    const user = await getAuthorizedUser();

    if (!user?.id) {
        return { success: false, error: 'Not authenticated' };
    }

    const { rateLimit } = await import('@/server/utils/ratelimit');
    const { success } = await rateLimit(`avatar-upload:${user.id}`, 5, 600);
    if (!success) {
        return { success: false, error: 'Te veel uploads. Probeer het over 10 minuten opnieuw.' };
    }

    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
        return { success: false, error: 'Geen geldig bestand geselecteerd.' };
    }

    if (!file.type.startsWith('image/')) {
        return { success: false, error: 'Alleen afbeeldingen zijn toegestaan.' };
    }

    const AZURE_MGMT_URL = process.env.AZURE_MANAGEMENT_SERVICE_URL;
    const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN?.replace(/^"|"$/g, '').trim();
    const entraId = user.entra_id;

    if (!entraId) {
        return { success: false, error: 'Je account is nog niet gekoppeld aan Microsoft Entra ID.' };
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const inputBuffer = Buffer.from(arrayBuffer);

        const compressedBuffer = await sharp(inputBuffer)
            .resize(648, 648, { fit: 'cover', position: 'center' })
            .jpeg({ quality: 80 })
            .toBuffer();

        const azureFormData = new FormData();
        azureFormData.append('file', new Blob([new Uint8Array(compressedBuffer)], { type: 'image/jpeg' }), 'avatar.jpg');

        const azureRes = await fetch(`${AZURE_MGMT_URL}/api/users/${entraId}/photo`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${INTERNAL_TOKEN}`
            },
            body: azureFormData
        });

        if (!azureRes.ok) {
            const errorData = await azureRes.json().catch((error: unknown) => {
                safeConsoleError('[profiel-update.actions.ts][uploadUserAvatar] Azure response was no valid JSON:', error);
                return {};
            }) as AzureErrorResponse;

            const safeErrorCode = errorData.error?.code || errorData.code || azureRes.status;
            const safeErrorMessage = errorData.error?.message || errorData.message || 'Onbekende Azure fout';

            safeConsoleError(`[profiel-update.actions.ts][uploadUserAvatar] Azure API Error [${safeErrorCode}]:`, safeErrorMessage);

            return { success: false, error: 'Fout bij opslaan in Microsoft Entra ID.' };
        }

        await triggerUserSyncAction(entraId, { fields: ['profile_photo'] });

        await clearSessionCache();

        revalidatePath('/profiel');
        return { success: true };
    } catch (error: unknown) {
        safeConsoleError('[profiel-update.actions.ts][uploadUserAvatar] Avatar upload failed:', error);
        return { success: false, error: 'Uploaden van profielfoto mislukt.' };
    }
}