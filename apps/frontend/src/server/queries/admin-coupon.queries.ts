import 'server-only';
import { getSystemDirectus } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { COUPON_FIELDS } from '@salvemundi/validations/directus/fields';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { AdminResource } from '@/shared/lib/permissions-config';
import { hasPermission } from '@/shared/lib/permissions';

export type Coupon = {
    id: number;
    coupon_code: string;
    discount_type: 'fixed' | 'percentage';
    discount_value: number;
    usage_count: number;
    usage_limit: number | null;
    valid_from: string | null;
    valid_until: string | null;
    is_active: boolean;
    date_created?: string;
};

import { type EnrichedUser } from '@/types/auth';

async function checkAccess() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error('Niet ingelogd');
    
    const user = session.user as unknown as EnrichedUser;
    if (!hasPermission(user.committees, AdminResource.Coupons)) {
        throw new Error('Geen toegang: onvoldoende rechten voor coupon beheer');
    }
    
    return session;
}

export async function getCoupons(): Promise<Coupon[]> {
    await checkAccess();
    try {
        const items = await getSystemDirectus().request(readItems('coupons', {
            sort: ['-id'],
            limit: -1,
            fields: [...COUPON_FIELDS]
        }));
        return (items ?? []).map(i => ({
            ...i,
            id: Number(i.id),
            coupon_code: i.coupon_code || '',
            discount_type: (i.discount_type || 'percentage') as 'fixed' | 'percentage',
            discount_value: Number(i.discount_value || 0),
            usage_count: Number(i.usage_count || 0),
            is_active: !!i.is_active
        })) as Coupon[];
    } catch (e) {
        
        return [];
    }
}
