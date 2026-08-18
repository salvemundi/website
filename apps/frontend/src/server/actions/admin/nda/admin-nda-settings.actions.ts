'use server';

import 'server-only';
import { db, schema } from '@salvemundi/db';
import { asc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireAdminResource } from '@/server/auth/auth-utils';
import { AdminResource } from '@/shared/lib/permissions-config';
import { safeConsoleError } from '@/server/utils/logger';
import { getNdaSettingsInternal, getBestuurMembersInternal, type NdaSettingsInternal, type NdaCommitteeMember } from '@/server/queries/nda/admin-nda.queries';

export async function getNdaSettings(): Promise<NdaSettingsInternal> {
    await requireAdminResource(AdminResource.Nda);
    return getNdaSettingsInternal();
}

export async function getBestuurMembersForSecretaryPicker(): Promise<NdaCommitteeMember[]> {
    await requireAdminResource(AdminResource.Nda);
    return getBestuurMembersInternal();
}

async function upsertNdaSettings(fields: Partial<typeof schema.nda_settings.$inferInsert>): Promise<void> {
    const rows = await db.select({ id: schema.nda_settings.id })
        .from(schema.nda_settings)
        .orderBy(asc(schema.nda_settings.id))
        .limit(1);

    if (rows.length > 0) {
        await db.update(schema.nda_settings)
            .set({ ...fields, updated_at: new Date().toISOString() })
            .where(eq(schema.nda_settings.id, rows[0].id));
    } else {
        await db.insert(schema.nda_settings).values(fields);
    }
}

export async function setNdaSecretary(userId: string): Promise<{ success: boolean; error?: string }> {
    await requireAdminResource(AdminResource.Nda);

    try {
        await upsertNdaSettings({ secretary_user_id: userId });
        revalidatePath('/beheer/nda');
        return { success: true };
    } catch (error) {
        safeConsoleError('[admin-nda-settings.actions.ts][setNdaSecretary] Failed to set secretary:', error);
        return { success: false, error: 'Bijwerken mislukt' };
    }
}

export async function setNdaSystemActive(active: boolean): Promise<{ success: boolean; active?: boolean; error?: string }> {
    await requireAdminResource(AdminResource.Nda);

    try {
        await upsertNdaSettings({ is_active: active });
        revalidatePath('/beheer/nda');
        revalidatePath('/profiel');
        revalidatePath('/profiel/nda');
        return { success: true, active };
    } catch (error) {
        safeConsoleError('[admin-nda-settings.actions.ts][setNdaSystemActive] Failed to toggle active state:', error);
        return { success: false, error: 'Bijwerken mislukt' };
    }
}
