'use server';

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createDirectus, staticToken, rest, readMe } from "@directus/sdk";
import { type DbDirectusUser as DirectusUser } from "@salvemundi/validations/directus/schema";
import { Pool } from "pg";
import { getRedis } from "@/server/auth/redis-client";
import { isSuperAdmin } from "@/lib/auth/auth-utils";
import { checkAdminAccess } from "@/server/actions/admin/admin-utils.actions";

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST || process.env.INTERNAL_DB_HOST || 'v7-core-db',
    port: 5432,
    database: process.env.DB_NAME
});

const TEST_TOKEN_COOKIE = 'directus_test_token';

/**
 * Start een impersonatie-sessie op basis van een Directus token.
 */
export async function setImpersonateToken(token: string) {
    const { isAuthorized, user } = await checkAdminAccess();
    if (!isAuthorized || !isSuperAdmin(user?.committees)) {
        throw new Error("Geen toegang: Alleen voor ICT en Bestuur.");
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
        } as never)) as unknown as DirectusUser;

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

        try {
            await pool.query(
                `SELECT c.id, c.name, c.azure_group_id
                 FROM committee_members m 
                 JOIN committees c ON m.committee_id = c.id 
                 WHERE m.user_id = $1`,
                [targetUser.id]
            );
        } catch (error) {
            console.error('[Impersonation] Failed to fetch target user committees:', error);
        }

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

        return {
            success: true,
            name: fullName || targetUser.email || 'Onbekende gebruiker'
        };
    } catch (error) {
        console.error('[Impersonation] Error setting token:', error);
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
    if (!impersonation || !isSuperAdmin(user?.committees)) {
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

    revalidatePath('/beheer/impersonate');
    revalidatePath('/', 'layout');
}
