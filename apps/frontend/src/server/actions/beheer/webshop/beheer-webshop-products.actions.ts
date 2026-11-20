'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireBeheerFeature } from '@/server/auth/auth-utils';
import { createDropWindowDb, updateDropWindowDb, deleteDropWindowDb, createProductDb, updateProductDb, deleteProductDb, fetchProductVariantsDb, createProductVariantDb, updateProductVariantDb, deleteProductVariantDb, fetchProductMediaDb, createProductMediaDb, deleteProductMediaDb } from '@/server/internal/webshop/webshop-product-db.utils';;
import {
    webshopDropWindowBeheerSchema,
    webshopProductBeheerSchema,
    webshopProductVariantBeheerSchema,
    type WebshopProductVariantBeheer,
} from '@salvemundi/validations/schema/beheer-webshop.zod';
import { safeConsoleError } from '@/server/utils/logger';
import { logAuditAction } from '@/server/actions/infrastructure/audit.actions';
import { uploadToDirectus } from '@/server/utils/media';

function revalidateWebshop() {
    revalidatePath('/beheer/webshop');
    revalidatePath('/merch');
}



export async function uploadWebshopMedia(formData: FormData) {
    await requireBeheerFeature('webshop');

    const file = formData.get('file') as File | null;
    if (!file || file.size === 0) {
        return { success: false, error: 'Geen bestand geselecteerd.' };
    }

    const uploadResult = await uploadToDirectus(file);
    if (!uploadResult.success) {
        return { success: false, error: uploadResult.error };
    }

    if (!uploadResult.id) {
        return { success: false, error: 'Uploaden mislukt.' };
    }

    return { success: true, assetId: uploadResult.id, assetType: file.type };
}

// --- Drop windows ---

export async function saveDropWindow(formData: FormData) {
    await requireBeheerFeature('webshop');

    const idRaw = formData.get('id');
    const rawData = {
        name: formData.get('name'),
        status: formData.get('status'),
        opens_at: formData.get('opens_at') || null,
        closes_at: formData.get('closes_at')
    };

    const validated = webshopDropWindowBeheerSchema.safeParse(rawData);
    if (!validated.success) {
        return { success: false, error: 'Vul alle verplichte velden correct in.', fieldErrors: z.flattenError(validated.error).fieldErrors };
    }

    try {
        const { id: _omit, ...data } = validated.data;

        if (idRaw) {
            const id = Number(idRaw);
            const ok = await updateDropWindowDb(id, data);
            if (!ok) throw new Error('Update failed');
            await logAuditAction('admin_webshop_drop_window_updated', 'SUCCESS', { drop_window_id: id });
        } else {
            const id = await createDropWindowDb(data);
            if (!id) throw new Error('Insert failed');
            await logAuditAction('admin_webshop_drop_window_created', 'SUCCESS', { drop_window_id: id });
        }

        revalidateWebshop();
        return { success: true };
    } catch (error) {
        safeConsoleError('[beheer-webshop-products.actions.ts][saveDropWindow]', error);
        return { success: false, error: 'Opslaan mislukt.' };
    }
}

export async function deleteDropWindow(id: number) {
    await requireBeheerFeature('webshop');
    try {
        await deleteDropWindowDb(id);
        await logAuditAction('admin_webshop_drop_window_deleted', 'SUCCESS', { drop_window_id: id });
        revalidateWebshop();
        return { success: true };
    } catch (error) {
        safeConsoleError('[beheer-webshop-products.actions.ts][deleteDropWindow]', error);
        return { success: false, error: 'Verwijderen mislukt (mogelijk nog gekoppelde producten).' };
    }
}

// --- Products (+ variants + media replace-on-save) ---

interface VariantInput {
    size?: string | null;
    color?: string | null;
    sku?: string | null;
    is_active?: boolean;
    stock_quantity?: number | string | null;
}

const variantKey = (v: { size?: string | null; color?: string | null }) => `${v.size ?? ''}|${v.color ?? ''}`;

interface MediaInput {
    asset: string;
    display_order?: number;
}

export async function saveProduct(formData: FormData) {
    await requireBeheerFeature('webshop');

    const idRaw = formData.get('id');
    const dropWindowIdRaw = formData.get('drop_window_id');
    const variantsRaw = formData.get('variants_json');
    const mediaRaw = formData.get('media_json');
    const customFieldsRaw = formData.get('custom_fields_json');

    let customFields: unknown = null;
    try {
        customFields = customFieldsRaw ? JSON.parse(String(customFieldsRaw)) : null;
    } catch {
        return { success: false, error: 'Ongeldige extra velden.' };
    }

    const rawData = {
        drop_window_id: dropWindowIdRaw ? Number(dropWindowIdRaw) : null,
        type: formData.get('type'),
        name: formData.get('name'),
        slug: formData.get('slug'),
        description: formData.get('description') || null,
        price: formData.get('price'),
        // No deposit concept anymore — the DB column is still notNull, so it's kept equal to
        // the price rather than exposed as a separate admin field.
        deposit_amount: formData.get('price'),
        max_orders: formData.get('max_orders') || null,
        stock_quantity: formData.get('stock_quantity') || null,
        is_active: formData.get('is_active') === 'on' || formData.get('is_active') === 'true',
        display_order: formData.get('display_order') ? Number(formData.get('display_order')) : 0,
        custom_fields: Array.isArray(customFields) && customFields.length > 0 ? customFields : null
    };

    const validated = webshopProductBeheerSchema.safeParse(rawData);
    if (!validated.success) {
        return { success: false, error: 'Vul alle verplichte velden correct in.', fieldErrors: z.flattenError(validated.error).fieldErrors };
    }

    let variants: VariantInput[] = [];
    let media: MediaInput[] = [];
    try {
        variants = variantsRaw ? JSON.parse(String(variantsRaw)) as VariantInput[] : [];
        media = mediaRaw ? JSON.parse(String(mediaRaw)) as MediaInput[] : [];
    } catch {
        return { success: false, error: 'Ongeldige varianten- of mediagegevens.' };
    }

    if (validated.data.type === 'clothing' && variants.length === 0) {
        return { success: false, error: 'Kledingproducten hebben minimaal 1 maat/variant nodig.' };
    }

    // Validate every variant before writing anything, so a bad stock value can't leave a half-saved product.
    const variantData: Omit<WebshopProductVariantBeheer, 'id' | 'product_id'>[] = [];
    for (const [index, variant] of variants.entries()) {
        const parsed = webshopProductVariantBeheerSchema.safeParse({ ...variant, product_id: 0, display_order: index });
        if (!parsed.success) {
            const issue = parsed.error.issues.at(0);
            safeConsoleError('[beheer-webshop-products.actions.ts][saveProduct] variant validation failed', { variant, issues: parsed.error.issues });
            return { success: false, error: `Ongeldige gegevens voor maat ${[variant.size, variant.color].filter(Boolean).join(' / ') || 'variant'} (${issue?.path.join('.') || 'onbekend veld'}: ${issue?.message ?? 'ongeldig'}).` };
        }
        const { id: _vid, product_id: _pid, ...rest } = parsed.data;
        variantData.push({ ...rest, stock_quantity: rest.stock_quantity ?? null });
    }

    try {
        const { id: _omit, ...data } = validated.data;
        // With sizes, the total stock is derived from the per-size stock (any unlimited size =
        // unlimited total), so the two can never disagree. Orders decrement both, keeping them in sync.
        const hasSizes = data.type === 'clothing' && variantData.length > 0;
        const stockQuantity = hasSizes
            ? (variantData.some(v => v.stock_quantity === null) ? null : variantData.reduce((total, v) => total + (v.stock_quantity ?? 0), 0))
            : data.stock_quantity;
        const dbData = {
            ...data,
            stock_quantity: stockQuantity,
            // With sizes the order limit *is* the stock, which is already enforced per unit and
            // decremented on every order. A separate max_orders would count orders already placed
            // against the remaining stock and block sales too early, so it is cleared here.
            max_orders: hasSizes ? null : data.max_orders,
            price: data.price.toFixed(2),
            // No deposit concept anymore — the DB column is still notNull, so it's kept equal
            // to the price rather than exposed as a separate admin field.
            deposit_amount: data.price.toFixed(2)
        };

        let productId: number;
        if (idRaw) {
            productId = Number(idRaw);
            const ok = await updateProductDb(productId, dbData);
            if (!ok) throw new Error('Update failed');

            const existingMedia = await fetchProductMediaDb(productId);
            await Promise.all(existingMedia.map(m => deleteProductMediaDb(m.id)));

            await logAuditAction('admin_webshop_product_updated', 'SUCCESS', { product_id: productId });
        } else {
            const newId = await createProductDb(dbData);
            if (!newId) throw new Error('Insert failed');
            productId = newId;
            await logAuditAction('admin_webshop_product_created', 'SUCCESS', { product_id: productId });
        }

        // Variants are matched on size/color and updated in place (not delete + recreate), so
        // existing orders keep their variant_id link and per-variant stock/sales stay intact.
        const existingByKey = new Map((idRaw ? await fetchProductVariantsDb(productId) : []).map(v => [variantKey(v), v]));
        for (const variant of variantData) {
            const existing = existingByKey.get(variantKey(variant));
            if (existing) {
                existingByKey.delete(variantKey(variant));
                await updateProductVariantDb(existing.id, variant);
            } else {
                await createProductVariantDb({ ...variant, product_id: productId });
            }
        }
        await Promise.all([...existingByKey.values()].map(v => deleteProductVariantDb(v.id)));

        for (const [index, item] of media.entries()) {
            if (!item.asset) continue;
            await createProductMediaDb({ product_id: productId, asset: item.asset, display_order: index });
        }

        revalidateWebshop();
        return { success: true, id: productId };
    } catch (error) {
        safeConsoleError('[beheer-webshop-products.actions.ts][saveProduct]', error);
        return { success: false, error: 'Opslaan mislukt.' };
    }
}

export async function deleteProduct(id: number) {
    await requireBeheerFeature('webshop');
    try {
        await deleteProductDb(id);
        await logAuditAction('admin_webshop_product_deleted', 'SUCCESS', { product_id: id });
        revalidateWebshop();
        return { success: true };
    } catch (error) {
        safeConsoleError('[beheer-webshop-products.actions.ts][deleteProduct]', error);
        return { success: false, error: 'Verwijderen mislukt (mogelijk nog gekoppeld aan bestellingen).' };
    }
}

export async function toggleProductActive(id: number, currentActive: boolean) {
    await requireBeheerFeature('webshop');
    try {
        await updateProductDb(id, { is_active: !currentActive });
        revalidateWebshop();
        return { success: true };
    } catch (error) {
        safeConsoleError('[beheer-webshop-products.actions.ts][toggleProductActive]', error);
        return { success: false, error: 'Bijwerken mislukt.' };
    }
}
