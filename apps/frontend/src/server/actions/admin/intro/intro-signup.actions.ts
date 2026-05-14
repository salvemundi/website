'use server';

import 'server-only';
import { revalidatePath } from "next/cache";
import { getIntroSignupsInternal, getIntroParentSignupsInternal } from '@/server/queries/admin-intro.queries';
import { getSystemDirectus } from "@/lib/directus";
import { deleteItem, updateItem } from '@directus/sdk';
import { AdminResource } from '@/shared/lib/permissions-config';
import type { DbIntroSignup, DbIntroParentSignup } from '@salvemundi/validations/directus/schema';
import { requireAdminResource } from '@/server/auth/auth-utils';

export async function checkIntroAdminAccess() {
    return requireAdminResource(AdminResource.Intro);
}

export async function genericDelete(collection: string, id: number) {
    try {
        await getSystemDirectus().request(deleteItem(collection as never, id));
        revalidatePath('/beheer/intro');
        return { success: true };
    } catch {
        return { success: false, error: 'Verwijderen mislukt' };
    }
}

export async function genericUpdate(collection: string, id: number, data: Record<string, unknown>, allowedFields: string[]) {
    const filteredData = Object.fromEntries(
        Object.entries(data).filter(([key]) => allowedFields.includes(key))
    );

    if (Object.keys(filteredData).length === 0) {
        return { success: false, error: 'Geen geldige velden om bij te werken' };
    }

    try {
        await getSystemDirectus().request(updateItem(collection as never, id, filteredData));
        revalidatePath('/beheer/intro');
        return { success: true };
    } catch {
        return { success: false, error: 'Bijwerken mislukt' };
    }
}

export async function getIntroSignups(): Promise<DbIntroSignup[]> {
    await checkIntroAdminAccess();
    const data = await getIntroSignupsInternal();
    return data as unknown as DbIntroSignup[];
}

export async function deleteIntroSignup(id: number): Promise<{ success: boolean; error?: string }> {
    await checkIntroAdminAccess();
    return genericDelete('intro_signups', id);
}

export async function getIntroParentSignups(): Promise<DbIntroParentSignup[]> {
    await checkIntroAdminAccess();
    const data = await getIntroParentSignupsInternal();
    return data as unknown as DbIntroParentSignup[];
}

export async function deleteIntroParentSignup(id: number): Promise<{ success: boolean; error?: string }> {
    await checkIntroAdminAccess();
    return genericDelete('intro_parent_signups', id);
}

export async function updateIntroSignup(id: number, data: Partial<Record<string, unknown>>): Promise<{ success: boolean; error?: string }> {
    await checkIntroAdminAccess();
    return genericUpdate('intro_signups', id, data, ['status', 'payment_status', 'is_member', 'notes', 'checked_in']);
}

export async function updateIntroParentSignup(id: number, data: Partial<Record<string, unknown>>): Promise<{ success: boolean; error?: string }> {
    await checkIntroAdminAccess();
    return genericUpdate('intro_parent_signups', id, data, ['status', 'payment_status', 'notes', 'checked_in']);
}
