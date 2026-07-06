'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireAdminResource } from '@/server/auth/auth-utils';
import { AdminResource } from '@/shared/lib/permissions-config';
import { createDropWindowDb, updateDropWindowDb, deleteDropWindowDb, createProductDb, updateProductDb, deleteProductDb, fetchProductVariantsDb, createProductVariantDb, deleteProductVariantDb, fetchProductMediaDb, createProductMediaDb, deleteProductMediaDb } from '@/server/internal/webshop/webshop-product-db.utils';;
import {
    webshopDropWindowAdminSchema,
    webshopProductAdminSchema,
    webshopProductVariantAdminSchema,
} from '@salvemundi/validations/schema/admin-webshop.zod';
import { safeConsoleError } from '@/server/utils/logger';
import { logAdminAction } from '@/server/actions/infrastructure/audit.actions';
import { uploadToDirectus } from '@/server/utils/media';

function revalidateWebshop() {
    revalidatePath('/beheer/webshop');
    revalidatePath('/webshop');
}



export async function uploadWebshopMedia(formData: FormData) {
    await requireAdminResource(AdminResource.Webshop);

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
    await requireAdminResource(AdminResource.Webshop);

    const idRaw = formData.get('id');
    const rawData = {
        name: formData.get('name'),
        status: formData.get('status'),
        opens_at: formData.get('opens_at') || null,
        closes_at: formData.get('closes_at')
    };

    const validated = webshopDropWindowAdminSchema.safeParse(rawData);
    if (!validated.success) {
        return { success: false, error: 'Vul alle verplichte velden correct in.', fieldErrors: z.flattenError(validated.error).fieldErrors };
    }

    try {
        const { id: _omit, ...data } = validated.data;

        if (idRaw) {
            const id = Number(idRaw);
            const ok = await updateDropWindowDb(id, data);
            if (!ok) throw new Error('Update failed');
            await logAdminAction('admin_webshop_drop_window_updated', 'SUCCESS', { drop_window_id: id });
        } else {
            const id = await createDropWindowDb(data);
            if (!id) throw new Error('Insert failed');
            await logAdminAction('admin_webshop_drop_window_created', 'SUCCESS', { drop_window_id: id });
        }

        revalidateWebshop();
        return { success: true };
    } catch (error) {
        safeConsoleError('[admin-webshop-products.actions.ts][saveDropWindow]', error);
        return { success: false, error: 'Opslaan mislukt.' };
    }
}

export async function deleteDropWindow(id: number) {
    await requireAdminResource(AdminResource.Webshop);
    try {
        await deleteDropWindowDb(id);
        await logAdminAction('admin_webshop_drop_window_deleted', 'SUCCESS', { drop_window_id: id });
        revalidateWebshop();
        return { success: true };
    } catch (error) {
        safeConsoleError('[admin-webshop-products.actions.ts][deleteDropWindow]', error);
        return { success: false, error: 'Verwijderen mislukt (mogelijk nog gekoppelde producten).' };
    }
}

// --- Products (+ variants + media replace-on-save) ---

interface VariantInput {
    size?: string | null;
    color?: string | null;
    sku?: string | null;
    is_active?: boolean;
}

interface MediaInput {
    asset: string;
    display_order?: number;
}

export async function saveProduct(formData: FormData) {
    await requireAdminResource(AdminResource.Webshop);

    const idRaw = formData.get('id');
    const dropWindowIdRaw = formData.get('drop_window_id');
    const variantsRaw = formData.get('variants_json');
    const mediaRaw = formData.get('media_json');

    const rawData = {
        drop_window_id: dropWindowIdRaw ? Number(dropWindowIdRaw) : null,
        type: formData.get('type'),
        name: formData.get('name'),
        slug: formData.get('slug'),
        description: formData.get('description') || null,
        price: formData.get('price'),
        deposit_amount: formData.get('deposit_amount'),
        is_active: formData.get('is_active') === 'on' || formData.get('is_active') === 'true',
        display_order: formData.get('display_order') ? Number(formData.get('display_order')) : 0
    };

    const validated = webshopProductAdminSchema.safeParse(rawData);
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

    try {
        const { id: _omit, ...data } = validated.data;
        const dbData = {
            ...data,
            price: data.price.toFixed(2),
            deposit_amount: data.deposit_amount.toFixed(2)
        };

        let productId: number;
        if (idRaw) {
            productId = Number(idRaw);
            const ok = await updateProductDb(productId, dbData);
            if (!ok) throw new Error('Update failed');

            const [existingVariants, existingMedia] = await Promise.all([
                fetchProductVariantsDb(productId),
                fetchProductMediaDb(productId)
            ]);
            await Promise.all([
                ...existingVariants.map(v => deleteProductVariantDb(v.id)),
                ...existingMedia.map(m => deleteProductMediaDb(m.id))
            ]);

            await logAdminAction('admin_webshop_product_updated', 'SUCCESS', { product_id: productId });
        } else {
            const newId = await createProductDb(dbData);
            if (!newId) throw new Error('Insert failed');
            productId = newId;
            await logAdminAction('admin_webshop_product_created', 'SUCCESS', { product_id: productId });
        }

        for (const variant of variants) {
            const validatedVariant = webshopProductVariantAdminSchema.safeParse({ ...variant, product_id: productId });
            if (!validatedVariant.success) continue;
            const { id: _vid, ...variantData } = validatedVariant.data;
            await createProductVariantDb({ ...variantData, product_id: productId });
        }

        for (const [index, item] of media.entries()) {
            if (!item.asset) continue;
            await createProductMediaDb({ product_id: productId, asset: item.asset, display_order: index });
        }

        revalidateWebshop();
        return { success: true, id: productId };
    } catch (error) {
        safeConsoleError('[admin-webshop-products.actions.ts][saveProduct]', error);
        return { success: false, error: 'Opslaan mislukt.' };
    }
}

export async function deleteProduct(id: number) {
    await requireAdminResource(AdminResource.Webshop);
    try {
        await deleteProductDb(id);
        await logAdminAction('admin_webshop_product_deleted', 'SUCCESS', { product_id: id });
        revalidateWebshop();
        return { success: true };
    } catch (error) {
        safeConsoleError('[admin-webshop-products.actions.ts][deleteProduct]', error);
        return { success: false, error: 'Verwijderen mislukt (mogelijk nog gekoppeld aan bestellingen).' };
    }
}

export async function toggleProductActive(id: number, currentActive: boolean) {
    await requireAdminResource(AdminResource.Webshop);
    try {
        await updateProductDb(id, { is_active: !currentActive });
        revalidateWebshop();
        return { success: true };
    } catch (error) {
        safeConsoleError('[admin-webshop-products.actions.ts][toggleProductActive]', error);
        return { success: false, error: 'Bijwerken mislukt.' };
    }
}
