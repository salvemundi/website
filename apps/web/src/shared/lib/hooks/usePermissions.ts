import { useAuth } from '@/features/auth/providers/auth-provider';
import { useSalvemundiSiteSettingsWithTokens } from './useSalvemundiApi';
import { isUserAuthorized, getMergedTokens } from '../committee-utils';

export function usePagePermission(pageKey: string, defaultTokens: string[]) {
    const { user, isLoading: authLoading } = useAuth();
    const { data: settings, isLoading: settingsLoading } = useSalvemundiSiteSettingsWithTokens(pageKey);

    if (authLoading || settingsLoading) {
        return { isAuthorized: null, isLoading: true };
    }

    const tokens = getMergedTokens(settings?.authorized_tokens, defaultTokens);
    const authorized = isUserAuthorized(user, tokens);

    return { isAuthorized: authorized, isLoading: false };
}
