import { z } from 'zod';
import {
    insertWebshopDropWindowsSchema,
    insertWebshopProductsSchema,
    insertWebshopProductMediaSchema,
    insertWebshopProductVariantsSchema,
} from './db.zod.js';

export const webshopDropWindowAdminSchema = insertWebshopDropWindowsSchema.extend({
    id: z.coerce.number().int().optional(),
    name: z.string().min(1, 'Naam is verplicht'),
    status: z.enum(['draft', 'open', 'closed']).default('draft'),
    opens_at: z.preprocess((value) => (value === null || value === undefined || value === '') ? null : String(value as string), z.string().nullable().optional()),
    closes_at: z.string().min(1, 'Sluitdatum is verplicht'),
});
export type WebshopDropWindowAdmin = z.infer<typeof webshopDropWindowAdminSchema>;

export const webshopProductAdminSchema = insertWebshopProductsSchema.extend({
    id: z.coerce.number().int().optional(),
    drop_window_id: z.coerce.number().int().nullable().optional(),
    type: z.enum(['clothing', 'item']),
    name: z.string().min(1, 'Naam is verplicht'),
    slug: z.string().min(1, 'Slug is verplicht').regex(/^[a-z0-9-]+$/, 'Slug mag alleen kleine letters, cijfers en streepjes bevatten'),
    description: z.preprocess((value) => (value === null || value === undefined) ? value : (value === '' ? null : String(value as string)), z.string().nullable().optional()),
    price: z.coerce.number().positive('Prijs moet groter dan 0 zijn'),
    deposit_amount: z.coerce.number().positive('Aanbetaling moet groter dan 0 zijn'),
    is_active: z.any().transform(value => !!value),
    display_order: z.coerce.number().int().nullable().optional(),
}).superRefine((data, ctx) => {
    if (data.deposit_amount > data.price) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Aanbetaling kan niet hoger zijn dan de prijs.',
            path: ['deposit_amount'],
        });
    }
});
export type WebshopProductAdmin = z.infer<typeof webshopProductAdminSchema>;

export const webshopProductVariantAdminSchema = insertWebshopProductVariantsSchema.extend({
    id: z.coerce.number().int().optional(),
    product_id: z.coerce.number().int(),
    size: z.string().nullable().optional(),
    color: z.string().nullable().optional(),
    sku: z.string().nullable().optional(),
    is_active: z.any().transform(value => !!value),
    display_order: z.coerce.number().int().nullable().optional(),
});
export type WebshopProductVariantAdmin = z.infer<typeof webshopProductVariantAdminSchema>;

export const webshopProductMediaAdminSchema = insertWebshopProductMediaSchema.extend({
    id: z.coerce.number().int().optional(),
    product_id: z.coerce.number().int(),
    asset: z.string().min(1, 'Media is verplicht'),
    display_order: z.coerce.number().int().nullable().optional(),
});
export type WebshopProductMediaAdmin = z.infer<typeof webshopProductMediaAdminSchema>;

export const webshopPreorderStatusUpdateSchema = z.object({
    id: z.coerce.number().int(),
    status: z.enum(['awaiting_deposit', 'awaiting_final', 'completed', 'cancelled']),
});
export type WebshopPreorderStatusUpdate = z.infer<typeof webshopPreorderStatusUpdateSchema>;
