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

export const webshopPreorderStatusSchema = z.enum(['awaiting_deposit', 'awaiting_final', 'completed', 'cancelled']);
export type WebshopPreorderStatus = z.infer<typeof webshopPreorderStatusSchema>;

export const webshopProductSchema = selectWebshopProductsSchema.extend({
    type: webshopProductTypeSchema,
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
});
export type WebshopPreorderLineForm = z.infer<typeof webshopPreorderLineFormSchema>;

export const webshopPreorderFormSchema = z.object({
    drop_window_id: z.number().min(1, 'Drop is verplicht'),
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

export const webshopPreorderLineSchema = selectWebshopPreorderLinesSchema;
export type WebshopPreorderLine = z.infer<typeof webshopPreorderLineSchema>;
