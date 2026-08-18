'use server';

import 'server-only';
import { db, schema } from '@salvemundi/db';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireAdminResource } from '@/server/auth/auth-utils';
import { AdminResource } from '@/shared/lib/permissions-config';
import { safeConsoleError } from '@/server/utils/logger';
import { uploadDocumentToDirectus } from '@/server/utils/media';
import {
    getNdaOverviewInternal,
    getCommitteeNdaDetailInternal,
    getNdaSettingsInternal,
    type NdaCommitteeOverview,
    type NdaCommitteeDetail,
} from '@/server/queries/nda/admin-nda.queries';

export async function getNdaOverview(): Promise<NdaCommitteeOverview[]> {
    await requireAdminResource(AdminResource.Nda);
    return getNdaOverviewInternal();
}

export async function getCommitteeNdaDetail(committeeId: number): Promise<NdaCommitteeDetail | null> {
    await requireAdminResource(AdminResource.Nda);
    return getCommitteeNdaDetailInternal(committeeId);
}

export async function uploadNdaTemplate(
    committeeId: number,
    formData: FormData
): Promise<{ success: true } | { success: false; error: string }> {
    const user = await requireAdminResource(AdminResource.Nda);

    const file = formData.get('document') as File | null;
    const uploadResult = await uploadDocumentToDirectus(file);
    if (!uploadResult.success) {
        return { success: false, error: uploadResult.error };
    }
    if (!uploadResult.id) {
        return { success: false, error: 'Geen bestand gevonden in upload.' };
    }

    const year = new Date().getFullYear();

    try {
        const existing = await db.select()
            .from(schema.nda_templates)
            .where(and(eq(schema.nda_templates.committee_id, committeeId), eq(schema.nda_templates.year, year)))
            .limit(1);

        if (existing.length > 0) {
            if (existing[0].status !== 'draft') {
                return { success: false, error: `Er is al een getekende NDA voor ${year} bij deze commissie. Deze kan niet meer vervangen worden.` };
            }
            await db.update(schema.nda_templates)
                .set({ document: uploadResult.id, updated_at: new Date().toISOString() })
                .where(eq(schema.nda_templates.id, existing[0].id));
        } else {
            await db.insert(schema.nda_templates).values({
                committee_id: committeeId,
                year,
                document: uploadResult.id,
                status: 'draft',
                user_created: user.id,
            });
        }

        revalidatePath(`/beheer/nda/${committeeId}`);
        revalidatePath('/beheer/nda');
        return { success: true };
    } catch (error) {
        safeConsoleError('[admin-nda-templates.actions.ts][uploadNdaTemplate] Failed to save template:', error);
        return { success: false, error: 'Opslaan van de NDA mislukt' };
    }
}

/**
 * The secretary and chairman ("voorzitter") sign the NDA outside the app; the
 * PDF the secretary uploads already carries both signatures. This action is
 * just the secretary's confirmation that the uploaded document is correct and
 * ready to go out to members — no in-app signing/PDF manipulation happens here.
 */
export async function confirmNdaTemplateReady(
    templateId: number
): Promise<{ success: true } | { success: false; error: string }> {
    const user = await requireAdminResource(AdminResource.Nda);
    const settings = await getNdaSettingsInternal();

    if (!settings.secretaryUserId || settings.secretaryUserId !== user.id) {
        return { success: false, error: 'Alleen de aangewezen secretaris kan bevestigen dat de NDA klaar is om te versturen.' };
    }

    const templateRows = await db.select().from(schema.nda_templates).where(eq(schema.nda_templates.id, templateId)).limit(1);
    if (templateRows.length === 0) {
        return { success: false, error: 'NDA-template niet gevonden' };
    }
    const template = templateRows[0];
    if (template.status !== 'draft' || !template.document) {
        return { success: false, error: 'Deze NDA is al bevestigd of er is nog geen document geüpload' };
    }

    try {
        await db.update(schema.nda_templates).set({
            status: 'signed',
            secretary_user_id: user.id,
            secretary_signed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }).where(eq(schema.nda_templates.id, templateId));

        revalidatePath(`/beheer/nda/${template.committee_id}`);
        revalidatePath('/beheer/nda');
        return { success: true };
    } catch (error) {
        safeConsoleError('[admin-nda-templates.actions.ts][confirmNdaTemplateReady] Failed to confirm template:', error);
        return { success: false, error: 'Bevestigen mislukt' };
    }
}
