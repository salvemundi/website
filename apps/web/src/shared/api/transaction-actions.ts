'use server';

import { serverDirectusFetch, CACHE_PRESETS, COLLECTION_TAGS } from '@/shared/lib/server-directus';

export type Transaction = {
    id: number;
    amount: number;
    payment_status: string;
    status: string;
    product_name?: string;
    description?: string;
    created_at: string;
    user_id: string;
    transaction_type?: string;
    registration?: any;
    pub_crawl_signup?: any;
    trip_signup?: any;
};

/**
 * Server Action to fetch transactions for a specific user.
 */
export async function getTransactionsAction(userId: string) {
    if (!userId) return [];

    try {
        const queryString = new URLSearchParams({
            'filter[user_id][_eq]': userId,
            'sort': '-created_at',
            'fields': '*,registration.*,pub_crawl_signup.*,trip_signup.*'
        }).toString();

        const transactions = await serverDirectusFetch<Transaction[]>(
            `/items/transactions?${queryString}`,
            {
                ...CACHE_PRESETS.DYNAMIC,
                tags: [COLLECTION_TAGS.TRANSACTIONS]
            }
        );
        return transactions || [];
    } catch (error: any) {
        console.error('[TransactionAction] Failed to fetch transactions:', error.message);
        return [];
    }
}
