'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminResource } from '@/server/auth/auth-utils';
import { AdminResource } from '@/shared/lib/permissions-config';
import { fetchPreorderByIdDb, updatePreorderDb } from '@/server/internal/webshop/webshop-preorder-db.utils';;
import { webshopPreorderStatusUpdateSchema } from '@salvemundi/validations/schema/admin-webshop.zod';
import { safeConsoleError } from '@/server/utils/logger';
import { logAdminAction } from '@/server/actions/infrastructure/audit.actions';

export async function updatePreorderStatus(id: number, status: string) {
    await requireAdminResource(AdminResource.Webshop);

    const validated = webshopPreorderStatusUpdateSchema.safeParse({ id, status });
    if (!validated.success) {
        return { success: false, error: 'Ongeldige status.' };
    }

    try {
        const ok = await updatePreorderDb(validated.data.id, { status: validated.data.status });
        if (!ok) throw new Error('Update failed');

        await logAdminAction('admin_webshop_preorder_status_updated', 'SUCCESS', { preorder_id: id, status });
        revalidatePath('/beheer/webshop/bestellingen');
        return { success: true };
    } catch (error) {
        safeConsoleError('[admin-webshop-preorders.actions.ts][updatePreorderStatus]', error);
        return { success: false, error: 'Bijwerken mislukt.' };
    }
}

export async function getPreorderPaymentLink(id: number, paymentType: 'deposit' | 'final') {
    await requireAdminResource(AdminResource.Webshop);

    try {
        const preorder = await fetchPreorderByIdDb(id);
        if (!preorder) return { success: false, error: 'Bestelling niet gevonden.' };

        const publicUrl = process.env.PUBLIC_URL || '';
        const path = paymentType === 'deposit' ? '/webshop/bevestiging' : '/webshop/betalen/restbetaling';
        const link = `${publicUrl}${path}?preorder=${id}&token=${preorder.access_token}`;

        return { success: true, link };
    } catch (error) {
        safeConsoleError('[admin-webshop-preorders.actions.ts][getPreorderPaymentLink]', error);
        return { success: false, error: 'Link ophalen mislukt.' };
    }
}
