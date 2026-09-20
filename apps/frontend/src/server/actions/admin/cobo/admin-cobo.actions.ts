'use server';

import { toggleFeatureFlag, getFeatureFlagSettings } from '@/server/actions/admin/admin-utils.actions';

export async function getCoboAdminSettings() {
    return await getFeatureFlagSettings('/cobo');
}

export async function toggleCoboVisibility() {
    return await toggleFeatureFlag(
        '/cobo',
        'cobo_registration',
        'De CoBo pagina en inschrijvingen zijn momenteel gesloten.',
        ['/cobo', '/beheer/cobo']
    );
}
