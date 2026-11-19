import {
    webshopCustomFieldsSchema,
    type WebshopCustomFieldValue,
    type WebshopDropWindowStatus,
    type WebshopPreorderStatus,
    type WebshopProductType,
} from '@salvemundi/validations/schema/webshop.zod';

export class InsufficientStockError extends Error {
    constructor(message = 'Niet genoeg voorraad meer beschikbaar.') {
        super(message);
        this.name = 'InsufficientStockError';
    }
}

export interface WebshopCheckoutVariantDTO {
    id: number;
    size: string | null;
    color: string | null;
    isActive: boolean;
}

export interface WebshopCheckoutCustomFieldDTO {
    label: string;
    maxLength: number;
}

export interface WebshopCheckoutDropWindowDTO {
    id: number;
    status: WebshopDropWindowStatus | null;
}

export interface WebshopCheckoutProductDTO {
    id: number;
    name: string;
    type: WebshopProductType;
    price: number;
    isActive: boolean;
    maxOrders: number | null;
    stockQuantity: number | null;
    dropWindow: WebshopCheckoutDropWindowDTO | null;
    variants: WebshopCheckoutVariantDTO[];
    customFields: WebshopCheckoutCustomFieldDTO[];
}

export interface WebshopPreorderDTO {
    id: number;
    userId: string | null;
    dropWindowId: number | null;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string | null;
    status: WebshopPreorderStatus | null;
    subtotalAmount: number;
    depositPaid: boolean;
    accessToken: string | null;
}

export interface WebshopProductSourceRow {
    id: number;
    name: string;
    type: string;
    price: string;
    is_active: boolean | null;
    max_orders: number | null;
    stock_quantity: number | null;
    custom_fields: unknown;
}

export interface WebshopVariantSourceRow {
    id: number;
    size: string | null;
    color: string | null;
    is_active: boolean | null;
}

export interface WebshopDropWindowSourceRow {
    id: number;
    status: string | null;
}

export interface WebshopPreorderSourceRow {
    id: number;
    user_id: string | null;
    drop_window_id: number | null;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string | null;
    status: string | null;
    subtotal_amount: string;
    deposit_paid: boolean | null;
    access_token: string | null;
}

export interface CreateReservedPreorderInput {
    userId: string;
    dropWindowId: number | null;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    subtotalAmount: number;
    termsAccepted: boolean;
    pickupNotes: string | null;
    accessToken: string;
    line: {
        productId: number;
        variantId: number | null;
        quantity: number;
        unitPrice: number;
        productNameSnapshot: string;
        variantLabelSnapshot: string | null;
        customFieldValues: WebshopCustomFieldValue[] | null;
    };
}

function normalizeDropWindowStatus(status: string | null): WebshopDropWindowStatus | null {
    if (status === 'draft' || status === 'open' || status === 'closed') {
        return status;
    }
    return null;
}

function normalizePreorderStatus(status: string | null): WebshopPreorderStatus | null {
    if (status === 'awaiting_deposit' || status === 'completed' || status === 'cancelled') {
        return status;
    }
    return null;
}

export function toWebshopCheckoutProductDTO(
    product: WebshopProductSourceRow,
    variants: readonly WebshopVariantSourceRow[],
    dropWindow: WebshopDropWindowSourceRow | null
): WebshopCheckoutProductDTO {
    const parsedFields = webshopCustomFieldsSchema.nullable().catch(null).parse(product.custom_fields);

    return {
        id: product.id,
        name: product.name,
        type: product.type === 'clothing' ? 'clothing' : 'item',
        price: Number(product.price),
        isActive: product.is_active ?? false,
        maxOrders: product.max_orders,
        stockQuantity: product.stock_quantity,
        dropWindow: dropWindow
            ? {
                  id: dropWindow.id,
                  status: normalizeDropWindowStatus(dropWindow.status),
              }
            : null,
        variants: variants.map((variant) => ({
            id: variant.id,
            size: variant.size,
            color: variant.color,
            isActive: variant.is_active ?? false,
        })),
        customFields: (parsedFields ?? []).map((field) => ({
            label: field.label,
            maxLength: field.max_length,
        })),
    };
}

export function toWebshopPreorderDTO(row: WebshopPreorderSourceRow): WebshopPreorderDTO {
    return {
        id: row.id,
        userId: row.user_id,
        dropWindowId: row.drop_window_id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        phoneNumber: row.phone_number,
        status: normalizePreorderStatus(row.status),
        subtotalAmount: Number(row.subtotal_amount),
        depositPaid: row.deposit_paid ?? false,
        accessToken: row.access_token,
    };
}
