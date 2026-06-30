'use server';

import { unstable_noStore as noStore } from 'next/cache';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { getCatalogProductsInternal, getProductBySlugInternal } from '@/server/queries/webshop.queries';
import { fetchPreorderWithLinesDb, type PreorderWithLines } from '@/server/internal/webshop-db.utils';
import { type WebshopCatalogProduct } from '@salvemundi/validations/schema/webshop.zod';
import { safeConsoleError } from '@/server/utils/logger';

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
