'use server';

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { type DirectusUser } from '@salvemundi/validations';
import { getRedis } from "@/server/auth/redis-client";
import { checkAdminAccess, enforceFeatureAccess } from "@/server/actions/admin/admin-utils.actions";
import { logAdminAction } from "@/server/actions/infrastructure/audit.actions";
import { safeConsoleError } from '@/server/utils/logger';

const TEST_TOKEN_COOKIE = 'directus_test_token';

export async function setImpersonateToken(token: string) {
    const { user } = await enforceFeatureAccess('impersonate');

    try {
        const directusUrl = process.env.INTERNAL_DIRECTUS_URL;
        if (!directusUrl) {
            return { success: false, error: "Directus service URL is niet geconfigureerd." };
        }

        const response = await fetch(`${directusUrl}/users/me?fields=id,first_name,last_name,email,avatar`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            return { success: false, error: "Token is ongeldig." };
        }

        const json = await response.json() as { data: DirectusUser };
        const targetUser = json.data;

        const cookieStore = await cookies();
        cookieStore.set(TEST_TOKEN_COOKIE, token, {
            path: '/',
            maxAge: 7 * 24 * 60 * 60,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true
        });

        const adminName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        if (!adminName) {
            throw new Error("Jouw eigen admin profiel mist een voor- of achternaam. Dit is verplicht.");
        }

        const targetFullName = `${targetUser.first_name || ''} ${targetUser.last_name || ''}`.trim();
        const finalTargetName = targetFullName || targetUser.email;

        if (!finalTargetName) {
            throw new Error("De gekozen test-gebruiker heeft geen naam of e-mailadres. Kan de test-sessie niet starten met ontbrekende data.");
        }
        
        cookieStore.set('impersonation_info', JSON.stringify({
            adminName,
            targetName: finalTargetName,
            targetCommittees: []
        }), {
            path: '/',
            maxAge: 7 * 24 * 60 * 60,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            httpOnly: false
        });

        const sessionToken = cookieStore.get('better-auth.session-token')?.value ||
            cookieStore.get('__Secure-better-auth.session-token')?.value;
        const redis = await getRedis();

        if (sessionToken) {
            await redis.del(`session:${sessionToken}`);
        }
        await redis.del(`impersonation:${token}`);

        revalidatePath('/beheer/impersonate');
        revalidatePath('/', 'layout');

        await logAdminAction('admin_impersonation_started', 'INFO', {
            target_id: targetUser.id,
            target_name: finalTargetName,
            started_by: adminName
        });

        return {
            success: true,
            name: finalTargetName
        };
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('[impersonation.actions.ts][setImpersonateToken] ', `Error setting token: ${typedError.message}`);
        return { success: false, error: "Deze token bestaat niet of is verlopen." };
    }
}

export async function clearImpersonateToken() {
    const cookieStore = await cookies();
    const testToken = cookieStore.get(TEST_TOKEN_COOKIE)?.value;

    if (!testToken) {
        return { success: false, error: "Geen actieve testsessie gevonden." };
    }

    const { impersonation } = await checkAdminAccess();
    if (!impersonation || !impersonation.isNormallyAdmin) {
        return { success: false, error: "Je bent niet in test modus of hebt onvoldoende rechten." };
    }

    cookieStore.delete(TEST_TOKEN_COOKIE);
    cookieStore.delete('impersonation_info');

    const sessionToken = cookieStore.get('better-auth.session-token')?.value ||
        cookieStore.get('__Secure-better-auth.session-token')?.value;
    const redis = await getRedis();

    if (sessionToken) {
        await redis.del(`session:${sessionToken}`);
    }

    if (testToken) {
        await redis.del(`impersonation:${testToken}`);
    }

    await logAdminAction('admin_impersonation_ended', 'INFO', {
        ended_by: impersonation.name || 'Onbekend'
    });

    revalidatePath('/beheer/impersonate');
    revalidatePath('/', 'layout');
}