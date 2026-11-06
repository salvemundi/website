import { z } from 'zod';
import { phoneNumberSchema } from './shared.zod.js';
import {
    selectWebshopProductsSchema,
    selectWebshopProductVariantsSchema,
    selectWebshopProductMediaSchema,
    selectWebshopDropWindowsSchema,
    selectWebshopPreordersSchema,
    selectWebshopPreorderLinesSchema,
} from './db.zod.js';

export const webshopProductTypeSchema = z.enum(['clothing', 'item']);
export type WebshopProductType = z.infer<typeof webshopProductTypeSchema>;

export const webshopDropWindowStatusSchema = z.enum(['draft', 'open', 'closed']);
export type WebshopDropWindowStatus = z.infer<typeof webshopDropWindowStatusSchema>;

export const webshopPreorderStatusSchema = z.enum(['awaiting_deposit', 'completed', 'cancelled']);
export type WebshopPreorderStatus = z.infer<typeof webshopPreorderStatusSchema>;

// Admin-defined extra input a customer fills in per order (e.g. "Naam op shirt", max 20 chars).
export const webshopCustomFieldDefSchema = z.object({
    label: z.string().trim().min(1, 'Elk veld heeft een naam nodig').max(100),
    max_length: z.coerce.number().int().min(1, 'Max tekens moet minimaal 1 zijn').max(500, 'Max tekens is 500'),
});
export type WebshopCustomFieldDef = z.infer<typeof webshopCustomFieldDefSchema>;

export const webshopCustomFieldsSchema = z.array(webshopCustomFieldDefSchema).max(10, 'Maximaal 10 velden per product');

export const webshopCustomFieldValuesSchema = z.array(z.object({ label: z.string(), value: z.string() }));
export type WebshopCustomFieldValue = z.infer<typeof webshopCustomFieldValuesSchema>[number];

export const webshopProductSchema = selectWebshopProductsSchema.extend({
    type: webshopProductTypeSchema,
    custom_fields: webshopCustomFieldsSchema.nullable().catch(null),
});
export type WebshopProduct = z.infer<typeof webshopProductSchema>;

export const webshopProductVariantSchema = selectWebshopProductVariantsSchema;
export type WebshopProductVariant = z.infer<typeof webshopProductVariantSchema>;

export const webshopProductMediaSchema = selectWebshopProductMediaSchema.extend({
    asset_type: z.string().nullable().optional(),
});
export type WebshopProductMedia = z.infer<typeof webshopProductMediaSchema>;

export const webshopDropWindowSchema = selectWebshopDropWindowsSchema.extend({
    status: webshopDropWindowStatusSchema.nullable(),
});
export type WebshopDropWindow = z.infer<typeof webshopDropWindowSchema>;

// Catalogus item as returned by the public catalogus/productdetail query: product + its media, variants and drop window.
export const webshopCatalogProductSchema = webshopProductSchema.extend({
    media: z.array(webshopProductMediaSchema),
    variants: z.array(webshopProductVariantSchema),
    drop_window: webshopDropWindowSchema.nullable(),
});
export type WebshopCatalogProduct = z.infer<typeof webshopCatalogProductSchema>;

export const webshopCatalogFilterSchema = z.object({
    category: z.enum(['all', 'clothing', 'item']).default('all'),
});
export type WebshopCatalogFilter = z.infer<typeof webshopCatalogFilterSchema>;

export const webshopPreorderLineFormSchema = z.object({
    product_id: z.number().min(1, 'Product is verplicht'),
    variant_id: z.number().min(1).nullable().optional(),
    quantity: z.number().min(1, 'Aantal moet minimaal 1 zijn').max(10, 'Maximaal 10 stuks per regel'),
    // Answers in the same order as the product's custom_fields; length limits are enforced server-side.
    custom_field_answers: z.array(z.string()).optional(),
});
export type WebshopPreorderLineForm = z.infer<typeof webshopPreorderLineFormSchema>;

export const webshopPreorderFormSchema = z.object({
    drop_window_id: z.number().min(0).nullable().optional(),
    lines: z.array(webshopPreorderLineFormSchema).min(1, 'Voeg minimaal 1 product toe'),
    first_name: z.string().min(1, 'Voornaam is verplicht'),
    last_name: z.string().min(1, 'Achternaam is verplicht'),
    email: z.string().email('Ongeldig e-mailadres'),
    phone_number: phoneNumberSchema,
    pickup_notes: z.string().optional().nullable(),
    terms_accepted: z.boolean().refine(value => value === true, {
        message: 'Je moet de voorwaarden accepteren.',
    }),
    website: z.string().optional(), // Honeypot
});
export type WebshopPreorderForm = z.infer<typeof webshopPreorderFormSchema>;

export const webshopPreorderSchema = selectWebshopPreordersSchema.extend({
    status: webshopPreorderStatusSchema.nullable(),
});
export type WebshopPreorder = z.infer<typeof webshopPreorderSchema>;

export const webshopPreorderLineSchema = selectWebshopPreorderLinesSchema.extend({
    custom_field_values: webshopCustomFieldValuesSchema.nullable().catch(null),
});
export type WebshopPreorderLine = z.infer<typeof webshopPreorderLineSchema>;
