'use server';

import { revalidatePath } from 'next/cache';
import { requireBeheerFeature } from '@/server/auth/auth-utils';
import { fetchPreorderByIdDb, fetchPreorderWithLinesDb, updatePreorderDb, restoreStockForLinesDb } from '@/server/internal/webshop/webshop-preorder-db.utils';;
import { webshopPreorderStatusUpdateSchema } from '@salvemundi/validations/schema/beheer-webshop.zod';
import { safeConsoleError } from '@/server/utils/logger';
import { logAuditAction } from '@/server/actions/infrastructure/audit.actions';

export async function updatePreorderStatus(id: number, status: string) {
    await requireBeheerFeature('webshop');

    const validated = webshopPreorderStatusUpdateSchema.safeParse({ id, status });
    if (!validated.success) {
        return { success: false, error: 'Ongeldige status.' };
    }

    try {
        const existing = await fetchPreorderByIdDb(validated.data.id);
        const isNewlyCancelled = validated.data.status === 'cancelled' && existing?.status !== 'cancelled';

        const ok = await updatePreorderDb(validated.data.id, { status: validated.data.status });
        if (!ok) throw new Error('Update failed');

        if (isNewlyCancelled) {
            const preorderWithLines = await fetchPreorderWithLinesDb(validated.data.id);
            if (preorderWithLines) await restoreStockForLinesDb(preorderWithLines.lines);
        }

        await logAuditAction('admin_webshop_preorder_status_updated', 'SUCCESS', { preorder_id: id, status });
        revalidatePath('/beheer/webshop/bestellingen');
        return { success: true };
    } catch (error) {
        safeConsoleError('[beheer-webshop-preorders.actions.ts][updatePreorderStatus]', error);
        return { success: false, error: 'Bijwerken mislukt.' };
    }
}

export async function toggleOrderPickedUp(id: number, pickedUp: boolean) {
    await requireBeheerFeature('webshop_pickup');

    try {
        const ok = await updatePreorderDb(id, {
            picked_up: pickedUp,
            picked_up_at: pickedUp ? new Date().toISOString() : null
        });
        if (!ok) throw new Error('Update failed');

        await logAuditAction('admin_webshop_order_picked_up_toggled', 'SUCCESS', { preorder_id: id, picked_up: pickedUp });
        revalidatePath('/beheer/webshop/afhalen');
        return { success: true };
    } catch (error) {
        safeConsoleError('[beheer-webshop-preorders.actions.ts][toggleOrderPickedUp]', error);
        return { success: false, error: 'Bijwerken mislukt.' };
    }
}

export async function getPreorderPaymentLink(id: number) {
    await requireBeheerFeature('webshop');

    try {
        const preorder = await fetchPreorderByIdDb(id);
        if (!preorder) return { success: false, error: 'Bestelling niet gevonden.' };

        const publicUrl = process.env.PUBLIC_URL || '';
        const link = `${publicUrl}/merch/bevestiging?preorder=${id}&token=${preorder.access_token}`;

        return { success: true, link };
    } catch (error) {
        safeConsoleError('[beheer-webshop-preorders.actions.ts][getPreorderPaymentLink]', error);
        return { success: false, error: 'Link ophalen mislukt.' };
    }
}
