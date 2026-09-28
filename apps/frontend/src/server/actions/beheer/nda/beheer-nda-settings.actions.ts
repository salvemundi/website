'use server';

import 'server-only';
import { db, schema } from '@salvemundi/db';
import { asc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireBeheerFeature } from '@/server/auth/auth-utils';
import { safeConsoleError } from '@/server/utils/logger';
import { getNdaSettingsInternal, getBestuurMembersInternal, type NdaSettingsInternal, type NdaCommitteeMember } from '@/server/queries/nda/beheer-nda.queries';

export async function getNdaSettings(): Promise<NdaSettingsInternal> {
    await requireBeheerFeature('nda');
    return getNdaSettingsInternal();
}

export async function getBestuurMembersForSecretaryPicker(): Promise<NdaCommitteeMember[]> {
    await requireBeheerFeature('nda');
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
    await requireBeheerFeature('nda');

    try {
        await upsertNdaSettings({ secretary_user_id: userId });
        revalidatePath('/beheer/nda');
        return { success: true };
    } catch (error) {
        safeConsoleError('[beheer-nda-settings.actions.ts][setNdaSecretary] Failed to set secretary:', error);
        return { success: false, error: 'Bijwerken mislukt' };
    }
}

export async function setNdaSystemActive(active: boolean): Promise<{ success: boolean; active?: boolean; error?: string }> {
    await requireBeheerFeature('nda');

    try {
        await upsertNdaSettings({ is_active: active });
        revalidatePath('/beheer/nda');
        revalidatePath('/profiel');
        revalidatePath('/profiel/nda');
        return { success: true, active };
    } catch (error) {
        safeConsoleError('[beheer-nda-settings.actions.ts][setNdaSystemActive] Failed to toggle active state:', error);
        return { success: false, error: 'Bijwerken mislukt' };
    }
}
