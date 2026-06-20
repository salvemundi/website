'use server';

import { query } from '@/lib/database';
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

interface DbFeatureFlag {
    name: string;
    route_match: string;
    is_active: boolean;
    message: string | null;
}

export async function getSystemAutomationSettings(): Promise<{ success: boolean; settings?: AutomationSetting[]; error?: string }> {
    const { isAuthorized, user } = await checkAdminAccess();
    if (!isAuthorized || !isSuperAdmin(user?.committees)) throw new Error('Geen toegang: Alleen voor ICT en Bestuur.');

    try {
        const { rows } = await query<DbFeatureFlag>(
            "SELECT name, route_match, is_active, message FROM feature_flags WHERE route_match = ANY($1)",
            [AUTOMATION_FLAGS]
        );

        const foundFlags = rows.map((r) => r.route_match);
        if (!foundFlags.includes('auto_sync_nightly')) {
            await query(
                "INSERT INTO feature_flags (name, route_match, is_active, message) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING",
                ['Nachtelijke Azure Sync', 'auto_sync_nightly', false, 'Synchroniseert elke nacht om 03:00 alle Azure leden en groepen.']
            );
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
        safeConsoleError('admin-automation.actions.ts][getSystemAutomationSettings]', `Failed to fetch settings: ${typedError.message}`);
        return { success: false, error: 'Ophalen automatisering instellingen mislukt' };
    }
}

export async function toggleAutomationSetting(key: string) {
    const { isAuthorized, user } = await checkAdminAccess();
    if (!isAuthorized || !isSuperAdmin(user?.committees)) throw new Error('Geen toegang: Alleen voor ICT en Bestuur.');

    try {
        await query(
            "UPDATE feature_flags SET is_active = NOT is_active WHERE route_match = $1",
            [key]
        );

        revalidatePath('/beheer/services');
        revalidatePath('/beheer/mail');
        return { success: true };
    } catch {
        return { success: false, error: 'Bijwerken instelling mislukt' };
    }
}