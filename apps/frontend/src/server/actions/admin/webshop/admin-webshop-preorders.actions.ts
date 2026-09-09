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

export async function toggleOrderPickedUp(id: number, pickedUp: boolean) {
    await requireAdminResource(AdminResource.WebshopPickup);

    try {
        const ok = await updatePreorderDb(id, {
            picked_up: pickedUp,
            picked_up_at: pickedUp ? new Date().toISOString() : null
        });
        if (!ok) throw new Error('Update failed');

        await logAdminAction('admin_webshop_order_picked_up_toggled', 'SUCCESS', { preorder_id: id, picked_up: pickedUp });
        revalidatePath('/beheer/webshop/afhalen');
        return { success: true };
    } catch (error) {
        safeConsoleError('[admin-webshop-preorders.actions.ts][toggleOrderPickedUp]', error);
        return { success: false, error: 'Bijwerken mislukt.' };
    }
}

export async function getPreorderPaymentLink(id: number) {
    await requireAdminResource(AdminResource.Webshop);

    try {
        const preorder = await fetchPreorderByIdDb(id);
        if (!preorder) return { success: false, error: 'Bestelling niet gevonden.' };

        const publicUrl = process.env.PUBLIC_URL || '';
        const link = `${publicUrl}/webshop/bevestiging?preorder=${id}&token=${preorder.access_token}`;

        return { success: true, link };
    } catch (error) {
        safeConsoleError('[admin-webshop-preorders.actions.ts][getPreorderPaymentLink]', error);
        return { success: false, error: 'Link ophalen mislukt.' };
    }
}
