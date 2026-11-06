export interface AdminDropWindow {
    id: number;
    name: string | null;
    status: string | null;
    opens_at: string | null;
    closes_at: string | null;
}

export interface AdminVariant {
    id: number;
    product_id: number;
    size: string | null;
    color: string | null;
    sku: string | null;
    is_active: boolean | null;
}

export interface AdminMedia {
    id: number;
    product_id: number;
    asset: string;
}

export interface AdminProduct {
    id: number;
    drop_window_id: number | null;
    type: string | null;
    name: string | null;
    slug: string | null;
    description: string | null;
    price: string | null;
    max_orders?: number | null;
    stock_quantity?: number | null;
    custom_fields?: unknown;
    is_active: boolean | null;
    display_order: number | null;
    variants: AdminVariant[];
    media: AdminMedia[];
}

export interface AdminPreorderLine {
    id: number;
    quantity: number;
    unit_price: string | null;
    product_name_snapshot: string | null;
    variant_label_snapshot: string | null;
    custom_field_values?: unknown;
}

export interface AdminPreorder {
    id: number;
    created_at: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone_number: string | null;
    status: string | null;
    subtotal_amount: string | null;
    deposit_paid: boolean | null;
    picked_up?: boolean | null;
    picked_up_at?: string | null;
    pickup_notes: string | null;
    lines: AdminPreorderLine[];
}

// Board-only pickup checklist row — a subset of AdminPreorder, only what's needed to check
// off which member has collected their item.
export interface AdminPickupOrder {
    id: number;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    picked_up?: boolean | null;
    picked_up_at?: string | null;
    lines: AdminPreorderLine[];
}

// jsonb columns come back as `unknown`; narrow them defensively before rendering.
export function parseCustomFieldDefs(value: unknown): { label: string; max_length: number }[] {
    return Array.isArray(value) ? value.filter((f): f is { label: string; max_length: number } => typeof f?.label === 'string' && typeof f?.max_length === 'number') : [];
}

export function formatCustomFieldValues(value: unknown): string {
    if (!Array.isArray(value)) return '';
    return value.filter(f => typeof f?.label === 'string' && typeof f?.value === 'string').map(f => ` · ${f.label}: ${f.value}`).join('');
}
