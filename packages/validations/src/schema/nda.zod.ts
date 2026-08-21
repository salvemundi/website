import { z } from 'zod';
import { selectNdaTemplatesSchema, selectNdaSignaturesSchema, selectNdaSettingsSchema } from './db.zod.js';

export const ndaTemplateStatusEnum = z.enum(['draft', 'signed', 'archived']);
export type NdaTemplateStatus = z.infer<typeof ndaTemplateStatusEnum>;

export const ndaSignatureStatusEnum = z.enum(['pending', 'signed', 'expired', 'superseded']);
export type NdaSignatureStatus = z.infer<typeof ndaSignatureStatusEnum>;

export const ndaTemplateSchema = selectNdaTemplatesSchema.partial({
    document: true,
    secretary_user_id: true,
    secretary_signed_at: true,
    signature_layout: true,
    user_created: true,
    updated_at: true,
}).extend({
    id: z.coerce.number(),
    committee_id: z.coerce.number(),
    year: z.coerce.number(),
    status: ndaTemplateStatusEnum.default('draft'),
});

export type NdaTemplate = z.infer<typeof ndaTemplateSchema>;

const ndaLayoutTextBoxSchema = z.object({
    x: z.number(),
    y: z.number(),
    maxWidth: z.number(),
});

const ndaLayoutSignatureBoxSchema = z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
});

export const ndaSignatureLayoutSchema = z.object({
    pageWidth: z.number(),
    pageHeight: z.number(),
    location: ndaLayoutTextBoxSchema,
    date: ndaLayoutTextBoxSchema,
    name: ndaLayoutTextBoxSchema,
    signature: ndaLayoutSignatureBoxSchema,
});

export type NdaSignatureLayout = z.infer<typeof ndaSignatureLayoutSchema>;

export const ndaTemplateUploadSchema = z.object({
    committeeId: z.coerce.number(),
    year: z.coerce.number(),
});

export type NdaTemplateUpload = z.infer<typeof ndaTemplateUploadSchema>;

export const ndaSignatureSchema = selectNdaSignaturesSchema.partial({
    nda_template_id: true,
    member_signature: true,
    signed_at: true,
    signed_location: true,
    expires_at: true,
    signed_document: true,
    sent_at: true,
    reminder_sent_at: true,
    updated_at: true,
}).extend({
    id: z.coerce.number(),
    committee_id: z.coerce.number(),
    status: ndaSignatureStatusEnum.default('pending'),
});

export type NdaSignature = z.infer<typeof ndaSignatureSchema>;

export const ndaMemberSignSchema = z.object({
    signatureId: z.coerce.number(),
    city: z.string().min(1, 'Locatie is verplicht'),
});

export type NdaMemberSign = z.infer<typeof ndaMemberSignSchema>;

export const ndaHistoricalSignatureSchema = z.object({
    committeeId: z.coerce.number(),
    userId: z.string().uuid(),
    signedAt: z.string().min(1, 'Datum is verplicht'),
});

export type NdaHistoricalSignature = z.infer<typeof ndaHistoricalSignatureSchema>;

export const ndaSettingsSchema = selectNdaSettingsSchema.partial({
    secretary_user_id: true,
    updated_at: true,
}).extend({
    id: z.coerce.number(),
    reminder_days_before: z.coerce.number().default(30),
});

export type NdaSettings = z.infer<typeof ndaSettingsSchema>;
