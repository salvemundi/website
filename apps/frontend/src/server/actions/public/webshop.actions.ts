'use server';

import { unstable_noStore as noStore } from 'next/cache';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { getCatalogProductsInternal, getProductBySlugInternal } from '@/server/queries/webshop/webshop.queries';
import { fetchPreorderWithLinesDb, type PreorderWithLines } from '@/server/internal/webshop/webshop-preorder-db.utils';;
import { getFinanceServiceUrl, getInternalHeaders, fetchWithTimeout } from '@/server/internal/activiteiten/activiteiten.utils';
import { type WebshopCatalogProduct } from '@salvemundi/validations/schema/webshop.zod';
import { safeConsoleError } from '@/server/utils/logger';
import { getFeatureFlagSettings } from '@/server/actions/admin/admin-utils.actions';

export async function getCatalogProducts(category?: 'clothing' | 'item'): Promise<WebshopCatalogProduct[]> {
    try {
        return await getCatalogProductsInternal(category);
    } catch (error) {
        safeConsoleError('[webshop.actions.ts][getCatalogProducts]', error);
        return [];
    }
}

export async function getProductBySlug(slug: string): Promise<WebshopCatalogProduct | null> {
    try {
        return await getProductBySlugInternal(slug);
    } catch (error) {
        safeConsoleError('[webshop.actions.ts][getProductBySlug]', error);
        return null;
    }
}

export async function syncPreorderPaymentStatus(transactionToken: string): Promise<void> {
    try {
        const FINANCE_SERVICE_URL = getFinanceServiceUrl();
        if (!FINANCE_SERVICE_URL || !transactionToken) return;

        await fetchWithTimeout(`${FINANCE_SERVICE_URL}/api/finance/status/${transactionToken}`, {
            headers: getInternalHeaders(),
            cache: 'no-store'
        });
    } catch (error) {
        safeConsoleError('[webshop.actions.ts][syncPreorderPaymentStatus]', error);
    }
}

export type PreorderStatusResult =
    | { status: 'ok'; preorder: PreorderWithLines }
    | { status: 'not_found' }
    | { status: 'unauthorized' }
    | { status: 'error' };

export async function getPreorderStatus(preorderId: number, accessToken?: string): Promise<PreorderStatusResult> {
    noStore();

    try {
        const preorder = await fetchPreorderWithLinesDb(preorderId);
        if (!preorder) return { status: 'not_found' };

        const session = await getEnrichedSession();
        const isOwner = Boolean(session?.user.id && preorder.user_id === session.user.id);
        const hasValidToken = Boolean(accessToken && preorder.access_token && accessToken === preorder.access_token);

        if (!isOwner && !hasValidToken) {
            return { status: 'unauthorized' };
        }

        return { status: 'ok', preorder };
    } catch (error) {
        safeConsoleError('[webshop.actions.ts][getPreorderStatus]', error);
        return { status: 'error' };
    }
}

export async function getWebshopSettings() {
    const settings = await getFeatureFlagSettings('/webshop');
    return {
        show: settings.show,
        disabled_message: settings.disabled_message ?? 'De webshop is momenteel gesloten.'
    };
}