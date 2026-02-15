import {
    getSiteSettingsAction,
    createSiteSettingsAction,
    updateSiteSettingsAction,
    upsertSiteSettingsByPageAction
} from '@/shared/api/data-actions';
import type { SiteSettings } from './types';

export const siteSettingsApi = {
    get: async (page?: string, includeAuthorizedTokens: boolean = false): Promise<SiteSettings | null> => {
        return await getSiteSettingsAction(page, includeAuthorizedTokens);
    }
};

export const siteSettingsMutations = {
    create: async (data: { page: string; show?: boolean; disabled_message?: string; authorized_tokens?: string }) => {
        return await createSiteSettingsAction(data);
    },
    update: async (id: number, data: { show?: boolean; disabled_message?: string; authorized_tokens?: string }) => {
        return await updateSiteSettingsAction(id, data);
    },
    upsertByPage: async (page: string, data: { show?: boolean; disabled_message?: string; authorized_tokens?: string }) => {
        return await upsertSiteSettingsByPageAction(page, data);
    }
};
