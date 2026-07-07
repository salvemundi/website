'use server';

import 'server-only';
import { revalidatePath } from "next/cache";
import { getIntroSignupsInternal, getIntroParentSignupsInternal } from '@/server/queries/intro/admin-intro.queries';
import { db, schema } from "@salvemundi/db";
import { eq } from 'drizzle-orm';
import { AdminResource } from '@/shared/lib/permissions-config';
import type { IntroSignup, IntroParentSignup } from '@salvemundi/validations/directus/schema';
import { requireAdminResource } from '@/server/auth/auth-utils';

export async function checkIntroAdminAccess() {
    return requireAdminResource(AdminResource.Intro);
}

export async function getIntroSignups(): Promise<IntroSignup[]> {
    await checkIntroAdminAccess();
    const data = await getIntroSignupsInternal();
    return data as unknown as IntroSignup[];
}

export async function deleteIntroSignup(id: number): Promise<{ success: boolean; error?: string }> {
    await checkIntroAdminAccess();
    try {
        await db.delete(schema.intro_signups).where(eq(schema.intro_signups.id, id));
        revalidatePath('/beheer/intro');
        return { success: true };
    } catch {
        return { success: false, error: 'Verwijderen mislukt' };
    }
}

export async function getIntroParentSignups(): Promise<IntroParentSignup[]> {
    await checkIntroAdminAccess();
    const data = await getIntroParentSignupsInternal();
    return data as unknown as IntroParentSignup[];
}

export async function deleteIntroParentSignup(id: number): Promise<{ success: boolean; error?: string }> {
    await checkIntroAdminAccess();
    try {
        await db.delete(schema.intro_parent_signups).where(eq(schema.intro_parent_signups.id, id));
        revalidatePath('/beheer/intro');
        return { success: true };
    } catch {
        return { success: false, error: 'Verwijderen mislukt' };
    }
}

export async function updateIntroSignup(id: number, data: Partial<{ [key: string]: unknown }>): Promise<{ success: boolean; error?: string }> {
    await checkIntroAdminAccess();
    const allowedFields = ['status', 'payment_status', 'is_member', 'notes', 'checked_in'];
    const filteredData = Object.fromEntries(
        Object.entries(data).filter(([key]) => allowedFields.includes(key))
    );

    if (Object.keys(filteredData).length === 0) {
        return { success: false, error: 'Geen geldige velden om bij te werken' };
    }

    try {
        await db.update(schema.intro_signups).set(filteredData).where(eq(schema.intro_signups.id, id));
        revalidatePath('/beheer/intro');
        return { success: true };
    } catch {
        return { success: false, error: 'Bijwerken mislukt' };
    }
}

export async function updateIntroParentSignup(id: number, data: Partial<{ [key: string]: unknown }>): Promise<{ success: boolean; error?: string }> {
    await checkIntroAdminAccess();
    const allowedFields = ['status', 'payment_status', 'notes', 'checked_in'];
    const filteredData = Object.fromEntries(
        Object.entries(data).filter(([key]) => allowedFields.includes(key))
    );

    if (Object.keys(filteredData).length === 0) {
        return { success: false, error: 'Geen geldige velden om bij te werken' };
    }

    try {
        await db.update(schema.intro_parent_signups).set(filteredData).where(eq(schema.intro_parent_signups.id, id));
        revalidatePath('/beheer/intro');
        return { success: true };
    } catch {
        return { success: false, error: 'Bijwerken mislukt' };
    }
}
