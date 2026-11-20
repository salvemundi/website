// Stock helpers shared by the storefront and checkout. NULL stock = unlimited, 0 = sold out.
// A product can be capped both at product level (total units) and per variant (size/color).

interface StockVariant {
    is_active: boolean | null;
    stock_quantity: number | null;
}

interface StockProduct {
    type: string;
    stock_quantity: number | null;
    variants: StockVariant[];
}

export function isVariantAvailable(variant: StockVariant): boolean {
    return !!variant.is_active && variant.stock_quantity !== 0;
}

export function isProductSoldOut(product: StockProduct): boolean {
    if (product.stock_quantity === 0) return true;
    if (product.type !== 'clothing') return false;
    const active = product.variants.filter(v => v.is_active);
    return active.length > 0 && active.every(v => v.stock_quantity === 0);
}

// Highest quantity a customer may order for the chosen variant (or the product, for items).
export function maxOrderableQuantity(product: StockProduct, variant: StockVariant | null, cap: number): number {
    let max = cap;
    if (product.stock_quantity !== null) max = Math.min(max, product.stock_quantity);
    if (variant && variant.stock_quantity !== null) max = Math.min(max, variant.stock_quantity);
    return Math.max(0, max);
}
