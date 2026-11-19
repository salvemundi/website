'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { updateProfileSchema } from '@salvemundi/validations/schema/profiel.zod';
import { clearSessionCache } from '@/server/auth/session-utils';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import sharp from 'sharp';
import { safeConsoleError } from '@/server/utils/logger';
import { imageUploadSchema } from '@salvemundi/validations/schema/shared.zod';
import { updateUserProfileForUser } from '@/server/services/member-profile';
import { triggerUserSyncAction } from '@/server/actions/infrastructure/azure-sync/sync-tasks.actions';
interface AzureErrorResponse { details?: string; error?: { code?: string; message?: string }; code?: string; message?: string }

export async function updateUserProfile(data: z.infer<typeof updateProfileSchema>) {
    const session = await getEnrichedSession();
    if (!session?.user) return { success: false, error: 'Je bent niet ingelogd.' };
    return updateUserProfileForUser(data, session.user);
}

export async function uploadUserAvatar(formData: FormData) {
    const session = await getEnrichedSession();
    const user = session?.user;
    if (!user?.id) return { success: false, error: 'Not authenticated' };

    const { checkRateLimit } = await import('@/server/utils/ratelimit');
    const rateLimitResult = await checkRateLimit(`avatar-upload:${user.id}`, 5, 600, 'Te veel uploads. Probeer het over 10 minuten opnieuw.');
    if (!rateLimitResult.success) return rateLimitResult;

    const file = formData.get('file');

    const parsedFile = imageUploadSchema.safeParse(file);
    if (!parsedFile.success) {
        return { success: false, error: parsedFile.error.issues[0].message };
    }
    const safeFile = parsedFile.data;

    const AZURE_MGMT_URL = process.env.AZURE_MANAGEMENT_SERVICE_URL;
    const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN?.replace(/^"|"$/g, '').trim();
    const entraId = user.entra_id;

    if (!entraId) return { success: false, error: 'Je account is nog niet gekoppeld aan Microsoft Entra ID.' };

    try {
        const arrayBuffer = await safeFile.arrayBuffer();
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

            const isPrivilegeError = safeErrorMessage.includes('Insufficient privileges') ||
                safeErrorMessage.includes('Authorization_RequestDenied') ||
                azureRes.status === 403;

            if (isPrivilegeError) {
                return {
                    success: false,
                    error: 'Als ICT-beheerder kun je je profielfoto niet via de website bewerken vanwege Azure AD beveiligingslimieten. Pas dit handmatig aan in het Microsoft Entra-portal.'
                };
            }

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