import { useAuth } from '@/features/auth/providers/auth-provider';
import { useSalvemundiSiteSettings } from './useSalvemundiApi';
import { isUserAuthorized, getMergedTokens } from '../committee-utils';

export function usePagePermission(pageKey: string, defaultTokens: string[]) {
    const { user, isLoading: authLoading } = useAuth();
    const { data: settings, isLoading: settingsLoading } = useSalvemundiSiteSettings(pageKey);

    if (authLoading || settingsLoading) {
        return { isAuthorized: null, isLoading: true };
    }

    const tokens = getMergedTokens(Array.isArray(settings) ? settings[0]?.authorized_tokens : settings?.authorized_tokens, defaultTokens);
    const authorized = isUserAuthorized(user, tokens);

    return { isAuthorized: authorized, isLoading: false };
}
