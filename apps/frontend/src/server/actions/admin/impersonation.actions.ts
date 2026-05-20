'use server';

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createDirectus, staticToken, rest, readMe } from "@directus/sdk";
import { type DbDirectusUser as DirectusUser } from "@salvemundi/validations/directus/schema";
import { getRedis } from "@/server/auth/redis-client";
import { isSuperAdmin } from "@/lib/auth/auth-utils";
import { checkAdminAccess } from "@/server/actions/admin/admin-utils.actions";
import { logAdminAction } from "@/server/actions/infrastructure/audit.actions";
import { safeConsoleError } from '@/server/utils/logger';

const TEST_TOKEN_COOKIE = 'directus_test_token';

export async function setImpersonateToken(token: string) {
    const { isAuthorized, user } = await checkAdminAccess();
    if (!isAuthorized || !user || !isSuperAdmin(user.committees)) {
        throw new Error("Geen toegang: Alleen voor ICT.");
    }

    try {
        const directusUrl = process.env.DIRECTUS_SERVICE_URL;
        if (!directusUrl) {
            return { success: false, error: "Directus service URL is niet geconfigureerd." };
        }
        const testClient = createDirectus(directusUrl)
            .with(staticToken(token))
            .with(rest());

        const targetUser = await testClient.request(readMe({
            fields: ['id', 'first_name', 'last_name', 'email', 'avatar']
        } as never)) as unknown as DirectusUser | null;

        if (!targetUser) {
            return { success: false, error: "Token is ongeldig." };
        }

        const cookieStore = await cookies();
        cookieStore.set(TEST_TOKEN_COOKIE, token, {
            path: '/',
            maxAge: 7 * 24 * 60 * 60,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true
        });

        const fullName = `${targetUser.first_name || ''} ${targetUser.last_name || ''}`.trim();
        const sessionToken = cookieStore.get('better-auth.session-token')?.value ||
            cookieStore.get('__Secure-better-auth.session-token')?.value;
        const redis = await getRedis();

        if (sessionToken) {
            await redis.del(`session:${sessionToken}`);
        }
        await redis.del(`impersonation:${token}`);

        revalidatePath('/beheer/impersonate');
        revalidatePath('/', 'layout');
        const adminName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Onbekend';

        await logAdminAction('admin_impersonation_started', 'INFO', {
            target_id: targetUser.id,
            target_name: fullName || targetUser.email,
            started_by: adminName
        });

        return {
            success: true,
            name: fullName || targetUser.email || 'Onbekende gebruiker'
        };
    } catch (error) {
        safeConsoleError('[Impersonation] Error setting token:', error);
        return { success: false, error: "Deze token bestaat niet of is verlopen." };
    }
}

/**
 * Beëindigt de huidige impersonatie-sessie.
 */
export async function clearImpersonateToken() {
    const cookieStore = await cookies();
    const testToken = cookieStore.get(TEST_TOKEN_COOKIE)?.value;

    if (!testToken) {
        return { success: false, error: "Geen actieve testsessie gevonden." };
    }

    const { impersonation, user } = await checkAdminAccess();
    if (!impersonation || !isSuperAdmin(user.committees)) {
        return { success: false, error: "Je bent niet in test modus of hebt onvoldoende rechten." };
    }

    cookieStore.delete(TEST_TOKEN_COOKIE);

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
        ended_by: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Onbekend'
    });

    revalidatePath('/beheer/impersonate');
    revalidatePath('/', 'layout');
}
