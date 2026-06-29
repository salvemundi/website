'use server';

import { db, schema } from '@salvemundi/db';
import { eq, inArray, not } from 'drizzle-orm';
import { checkAdminAccess } from '@/server/actions/admin/admin-utils.actions';
import { revalidatePath } from 'next/cache';
import { isSuperAdmin } from '@/lib/auth/auth-utils';
import { safeConsoleError } from '@/server/utils/logger';

export type AutomationSetting = {
    id: string;
    name: string;
    isActive: boolean;
    description: string;
};

const AUTOMATION_FLAGS = ['mail_expiry_check', 'mail_event_reminders', 'auto_sync_nightly'];

export async function getSystemAutomationSettings(): Promise<{ success: boolean; settings?: AutomationSetting[]; error?: string }> {
    const { isAuthorized, user } = await checkAdminAccess();
    if (!isAuthorized || !isSuperAdmin(user?.committees)) throw new Error('Geen toegang: Alleen voor ICT en Bestuur.');

    try {
        const rows = await db.select({
            name: schema.feature_flags.name,
            route_match: schema.feature_flags.route_match,
            is_active: schema.feature_flags.is_active,
            message: schema.feature_flags.message
        }).from(schema.feature_flags)
        .where(inArray(schema.feature_flags.route_match, AUTOMATION_FLAGS));

        const foundFlags = rows.map((r) => r.route_match);
        if (!foundFlags.includes('auto_sync_nightly')) {
            await db.insert(schema.feature_flags).values({
                name: 'Nachtelijke Azure Sync',
                route_match: 'auto_sync_nightly',
                is_active: false,
                message: 'Synchroniseert elke nacht om 03:00 alle Azure leden en groepen.'
            }).onConflictDoNothing();
            rows.push({
                name: 'Nachtelijke Azure Sync',
                route_match: 'auto_sync_nightly',
                is_active: false,
                message: 'Synchroniseert elke nacht om 03:00 alle Azure leden en groepen.'
            });
        }

        return {
            success: true,
            settings: rows.map((r) => ({
                id: r.route_match,
                name: r.name,
                isActive: r.is_active,
                description: r.message || ''
            }))
        };
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('[admin-automation.actions.ts][getSystemAutomationSettings] ', `Failed to fetch settings: ${typedError.message}`);
        return { success: false, error: 'Ophalen automatisering instellingen mislukt' };
    }
}

export async function toggleAutomationSetting(key: string) {
    const { isAuthorized, user } = await checkAdminAccess();
    if (!isAuthorized || !isSuperAdmin(user?.committees)) throw new Error('Geen toegang: Alleen voor ICT en Bestuur.');

    try {
        await db.update(schema.feature_flags)
            .set({ is_active: not(schema.feature_flags.is_active) })
            .where(eq(schema.feature_flags.route_match, key));

        revalidatePath('/beheer/services');
        revalidatePath('/beheer/mail');
        return { success: true };
    } catch {
        return { success: false, error: 'Bijwerken instelling mislukt' };
    }
}