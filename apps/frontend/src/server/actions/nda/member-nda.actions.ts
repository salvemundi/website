'use server';

import 'server-only';
import { db, schema } from '@salvemundi/db';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { safeConsoleError } from '@/server/utils/logger';
import { uploadToDirectus, uploadBufferToDirectus } from '@/server/utils/media';
import { fillMemberSignatureOnPdf } from '@/server/utils/nda-pdf';
import { sendNdaMail } from '@/server/actions/admin/nda/nda-mail.utils';
import { getNdaSettingsInternal } from '@/server/queries/nda/admin-nda.queries';
import { ndaSignatureLayoutSchema } from '@salvemundi/validations';

export async function isNdaSystemActive(): Promise<boolean> {
    const settings = await getNdaSettingsInternal();
    return settings.isActive;
}

export interface MyNdaRow {
    id: number;
    committeeName: string;
    status: string;
    signedAt: string | null;
    expiresAt: string | null;
}

export async function getMyNdas(): Promise<MyNdaRow[]> {
    const session = await getEnrichedSession();
    if (!session?.user) return [];
    if (!(await isNdaSystemActive())) return [];

    const rows = await db.select({
        id: schema.nda_signatures.id,
        committeeName: schema.committees.name,
        status: schema.nda_signatures.status,
        signedAt: schema.nda_signatures.signed_at,
        expiresAt: schema.nda_signatures.expires_at,
    })
        .from(schema.nda_signatures)
        .innerJoin(schema.committees, eq(schema.nda_signatures.committee_id, schema.committees.id))
        .where(eq(schema.nda_signatures.user_id, session.user.id));

    return rows;
}

export interface NdaToSign {
    signatureId: number;
    committeeName: string;
    documentFileId: string;
}

export async function getMyNdaToSign(signatureId: number): Promise<NdaToSign | { error: string }> {
    const session = await getEnrichedSession();
    if (!session?.user) return { error: 'Je bent niet ingelogd' };
    if (!(await isNdaSystemActive())) return { error: 'Het NDA-systeem is nog niet actief' };

    const rows = await db.select({
        id: schema.nda_signatures.id,
        userId: schema.nda_signatures.user_id,
        status: schema.nda_signatures.status,
        templateId: schema.nda_signatures.nda_template_id,
        committeeName: schema.committees.name,
    })
        .from(schema.nda_signatures)
        .innerJoin(schema.committees, eq(schema.nda_signatures.committee_id, schema.committees.id))
        .where(eq(schema.nda_signatures.id, signatureId))
        .limit(1);

    if (rows.length === 0) {
        return { error: 'NDA niet gevonden' };
    }
    const row = rows[0];
    if (row.userId !== session.user.id) {
        return { error: 'NDA niet gevonden' };
    }
    if (row.status !== 'pending') {
        return { error: 'Deze NDA is al ondertekend of niet meer geldig' };
    }
    if (!row.templateId) {
        return { error: 'Geen NDA-document gekoppeld' };
    }

    const templateRows = await db.select({ document: schema.nda_templates.document, status: schema.nda_templates.status })
        .from(schema.nda_templates)
        .where(eq(schema.nda_templates.id, row.templateId))
        .limit(1);
    if (templateRows.length === 0) {
        return { error: 'Deze NDA is nog niet klaar om ondertekend te worden' };
    }
    const template = templateRows[0];
    if (template.status !== 'signed' || !template.document) {
        return { error: 'Deze NDA is nog niet klaar om ondertekend te worden' };
    }

    return {
        signatureId: row.id,
        committeeName: row.committeeName,
        documentFileId: template.document,
    };
}

export async function signMyNda(
    signatureId: number,
    formData: FormData
): Promise<{ success: true } | { success: false; error: string }> {
    const session = await getEnrichedSession();
    if (!session?.user) return { success: false, error: 'Je bent niet ingelogd' };
    if (!(await isNdaSystemActive())) return { success: false, error: 'Het NDA-systeem is nog niet actief' };

    const city = (formData.get('city') as string | null)?.trim();
    if (!city) return { success: false, error: 'Locatie is verplicht' };

    const rows = await db.select().from(schema.nda_signatures).where(eq(schema.nda_signatures.id, signatureId)).limit(1);
    if (rows.length === 0) {
        return { success: false, error: 'NDA niet gevonden' };
    }
    const row = rows[0];
    if (row.user_id !== session.user.id) {
        return { success: false, error: 'NDA niet gevonden' };
    }
    if (row.status !== 'pending' || !row.nda_template_id) {
        return { success: false, error: 'Deze NDA is al ondertekend of niet meer geldig' };
    }

    const templateRows = await db.select().from(schema.nda_templates).where(eq(schema.nda_templates.id, row.nda_template_id)).limit(1);
    if (templateRows.length === 0) {
        return { success: false, error: 'Deze NDA is nog niet klaar om ondertekend te worden' };
    }
    const template = templateRows[0];
    if (template.status !== 'signed' || !template.document) {
        return { success: false, error: 'Deze NDA is nog niet klaar om ondertekend te worden' };
    }

    const layoutParse = ndaSignatureLayoutSchema.safeParse(template.signature_layout);
    if (!layoutParse.success) {
        return { success: false, error: 'De handtekeningplek voor deze NDA is nog niet ingesteld door de secretaris' };
    }

    const signatureFile = formData.get('signature') as File | null;
    const signatureUpload = await uploadToDirectus(signatureFile);
    if (!signatureUpload.success || !signatureUpload.id) {
        return { success: false, error: signatureUpload.success ? 'Handtekening uploaden mislukt' : signatureUpload.error };
    }

    const committeeRows = await db.select({ name: schema.committees.name }).from(schema.committees).where(eq(schema.committees.id, row.committee_id)).limit(1);
    const committeeName = committeeRows[0]?.name ?? 'de commissie';
    const now = new Date();
    const signedAtIso = now.toISOString();
    const expiresAt = new Date(now);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    try {
        const signedBuffer = await fillMemberSignatureOnPdf(template.document, layoutParse.data, {
            name: session.user.name,
            date: now.toLocaleDateString('nl-NL'),
            location: city,
            signaturePngFileId: signatureUpload.id,
        });

        const uploadResult = await uploadBufferToDirectus(signedBuffer, `nda-${committeeName}-${session.user.name}.pdf`, 'application/pdf');
        if (!uploadResult.success || !uploadResult.id) {
            return { success: false, error: uploadResult.success ? 'Opslaan van het document mislukt' : uploadResult.error };
        }

        await db.update(schema.nda_signatures).set({
            status: 'signed',
            member_signature: signatureUpload.id,
            signed_at: signedAtIso,
            signed_location: city,
            expires_at: expiresAt.toISOString().slice(0, 10),
            signed_document: uploadResult.id,
            updated_at: signedAtIso,
        }).where(eq(schema.nda_signatures.id, signatureId));

        if (session.user.email) {
            await sendNdaMail(session.user.email, 'nda-signed-confirmation', {
                name: session.user.name,
                committeeName,
            });
        }

        revalidatePath('/profiel/nda');
        return { success: true };
    } catch (error) {
        safeConsoleError('[member-nda.actions.ts][signMyNda] Failed to sign NDA:', error);
        return { success: false, error: 'Ondertekenen mislukt' };
    }
}
