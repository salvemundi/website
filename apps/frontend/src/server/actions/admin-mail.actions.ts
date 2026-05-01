'use server';

import { query } from '@/lib/database';
import { checkAdminAccess } from './admin.actions';
import { revalidatePath } from 'next/cache';

export async function getMailSettings() {
    const { isAuthorized } = await checkAdminAccess();
    if (!isAuthorized) throw new Error('Geen toegang');

    try {
        const { rows } = await query(
            "SELECT name, route_match, is_active, message FROM feature_flags WHERE route_match IN ('mail_expiry_check', 'mail_event_reminders')"
        );
        
        return {
            success: true,
            settings: rows.map((r: { route_match: string, name: string, is_active: boolean, message?: string }) => ({
                id: r.route_match,
                name: r.name,
                isActive: r.is_active,
                description: r.message || ''
            }))
        };
    } catch (e: unknown) {
        console.error('[AdminMail] Failed to fetch settings:', e);
        return { success: false, error: 'Ophalen mail instellingen mislukt' };
    }
}

export async function toggleMailSetting(key: string) {
    const { isAuthorized } = await checkAdminAccess();
    if (!isAuthorized) throw new Error('Geen toegang');

    try {
        await query(
            "UPDATE feature_flags SET is_active = NOT is_active WHERE route_match = $1",
            [key]
        );
        
        revalidatePath('/beheer/mail');
        return { success: true };
    } catch (e) {
        
        return { success: false, error: 'Bijwerken instelling mislukt' };
    }
}
