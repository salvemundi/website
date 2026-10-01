'use server';

import { toggleFeatureFlag, getFeatureFlagSettings } from '@/server/actions/beheer/beheer-utils.actions';

export async function getCoboBeheerSettings() {
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
