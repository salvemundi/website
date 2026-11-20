import 'server-only';

import { and, asc, count, eq, gte, isNull, ne, or, sql } from 'drizzle-orm';
import { db, schema } from '@salvemundi/db';
import {
    InsufficientStockError,
    toWebshopCheckoutProductDTO,
    toWebshopPreorderDTO,
    type CreateReservedPreorderInput,
    type WebshopCheckoutProductDTO,
    type WebshopPreorderDTO,
} from '@/server/dto/webshop.dto';

export class OrderRepository {
    async getCheckoutProduct(productId: number): Promise<WebshopCheckoutProductDTO | null> {
        const productRows = await db
            .select({
                id: schema.webshop_products.id,
                name: schema.webshop_products.name,
                type: schema.webshop_products.type,
                price: schema.webshop_products.price,
                is_active: schema.webshop_products.is_active,
                max_orders: schema.webshop_products.max_orders,
                stock_quantity: schema.webshop_products.stock_quantity,
                custom_fields: schema.webshop_products.custom_fields,
                drop_window_id: schema.webshop_products.drop_window_id,
            })
            .from(schema.webshop_products)
            .where(eq(schema.webshop_products.id, productId))
            .limit(1);

        const product = productRows.at(0);
        if (!product) return null;

        const [variants, dropWindowRows] = await Promise.all([
            db
                .select({
                    id: schema.webshop_product_variants.id,
                    size: schema.webshop_product_variants.size,
                    color: schema.webshop_product_variants.color,
                    is_active: schema.webshop_product_variants.is_active,
                })
                .from(schema.webshop_product_variants)
                .where(eq(schema.webshop_product_variants.product_id, productId))
                .orderBy(asc(schema.webshop_product_variants.display_order)),
            product.drop_window_id !== null
                ? db
                      .select({
                          id: schema.webshop_drop_windows.id,
                          status: schema.webshop_drop_windows.status,
                      })
                      .from(schema.webshop_drop_windows)
                      .where(eq(schema.webshop_drop_windows.id, product.drop_window_id))
                      .limit(1)
                : Promise.resolve([]),
        ]);

        return toWebshopCheckoutProductDTO(product, variants, dropWindowRows.at(0) ?? null);
    }

    async countActiveOrdersForProduct(productId: number): Promise<number> {
        const result = await db
            .select({ value: count() })
            .from(schema.webshop_preorder_lines)
            .innerJoin(
                schema.webshop_preorders,
                eq(schema.webshop_preorder_lines.preorder_id, schema.webshop_preorders.id)
            )
            .where(
                and(
                    eq(schema.webshop_preorder_lines.product_id, productId),
                    ne(schema.webshop_preorders.status, 'cancelled')
                )
            );

        return result.at(0)?.value ?? 0;
    }

    async saveWithReservation(input: CreateReservedPreorderInput): Promise<WebshopPreorderDTO> {
        const quantity = input.line.quantity;
        const formattedSubtotal = input.subtotalAmount.toFixed(2);
        const formattedUnitPrice = input.line.unitPrice.toFixed(2);

        return db.transaction(async (tx) => {
            const updated = await tx
                .update(schema.webshop_products)
                .set({
                    stock_quantity: sql`${schema.webshop_products.stock_quantity} - ${quantity}`,
                })
                .where(
                    and(
                        eq(schema.webshop_products.id, input.line.productId),
                        or(
                            isNull(schema.webshop_products.stock_quantity),
                            gte(schema.webshop_products.stock_quantity, quantity)
                        )
                    )
                )
                .returning({ id: schema.webshop_products.id });

            if (updated.length === 0) {
                throw new InsufficientStockError();
            }

            // Per size/color stock (NULL = unlimited), reserved in the same transaction.
            if (input.line.variantId !== null) {
                const updatedVariant = await tx
                    .update(schema.webshop_product_variants)
                    .set({
                        stock_quantity: sql`${schema.webshop_product_variants.stock_quantity} - ${quantity}`,
                    })
                    .where(
                        and(
                            eq(schema.webshop_product_variants.id, input.line.variantId),
                            or(
                                isNull(schema.webshop_product_variants.stock_quantity),
                                gte(schema.webshop_product_variants.stock_quantity, quantity)
                            )
                        )
                    )
                    .returning({ id: schema.webshop_product_variants.id });

                if (updatedVariant.length === 0) {
                    throw new InsufficientStockError();
                }
            }

            const [preorder] = await tx
                .insert(schema.webshop_preorders)
                .values({
                    user_id: input.userId,
                    drop_window_id: input.dropWindowId,
                    first_name: input.firstName,
                    last_name: input.lastName,
                    email: input.email,
                    phone_number: input.phoneNumber,
                    status: 'awaiting_deposit',
                    subtotal_amount: formattedSubtotal,
                    // No deposit concept anymore — the full price is charged upfront. This column stays
                    // notNull in the DB, so it's kept equal to the subtotal rather than dropped.
                    deposit_amount: formattedSubtotal,
                    terms_accepted: input.termsAccepted,
                    pickup_notes: input.pickupNotes,
                    access_token: input.accessToken,
                })
                .returning({
                    id: schema.webshop_preorders.id,
                    user_id: schema.webshop_preorders.user_id,
                    drop_window_id: schema.webshop_preorders.drop_window_id,
                    first_name: schema.webshop_preorders.first_name,
                    last_name: schema.webshop_preorders.last_name,
                    email: schema.webshop_preorders.email,
                    phone_number: schema.webshop_preorders.phone_number,
                    status: schema.webshop_preorders.status,
                    subtotal_amount: schema.webshop_preorders.subtotal_amount,
                    deposit_paid: schema.webshop_preorders.deposit_paid,
                    access_token: schema.webshop_preorders.access_token,
                });

            await tx.insert(schema.webshop_preorder_lines).values({
                preorder_id: preorder.id,
                product_id: input.line.productId,
                variant_id: input.line.variantId,
                quantity,
                unit_price: formattedUnitPrice,
                product_name_snapshot: input.line.productNameSnapshot,
                variant_label_snapshot: input.line.variantLabelSnapshot,
                custom_field_values: input.line.customFieldValues,
            });

            return toWebshopPreorderDTO(preorder);
        });
    }

    async getPreorderById(preorderId: number): Promise<WebshopPreorderDTO | null> {
        const rows = await db
            .select({
                id: schema.webshop_preorders.id,
                user_id: schema.webshop_preorders.user_id,
                drop_window_id: schema.webshop_preorders.drop_window_id,
                first_name: schema.webshop_preorders.first_name,
                last_name: schema.webshop_preorders.last_name,
                email: schema.webshop_preorders.email,
                phone_number: schema.webshop_preorders.phone_number,
                status: schema.webshop_preorders.status,
                subtotal_amount: schema.webshop_preorders.subtotal_amount,
                deposit_paid: schema.webshop_preorders.deposit_paid,
                access_token: schema.webshop_preorders.access_token,
            })
            .from(schema.webshop_preorders)
            .where(eq(schema.webshop_preorders.id, preorderId))
            .limit(1);

        const row = rows.at(0);
        return row ? toWebshopPreorderDTO(row) : null;
    }

    async cancelAndRelease(preorderId: number): Promise<void> {
        await db.transaction(async (tx) => {
            const cancelled = await tx
                .update(schema.webshop_preorders)
                .set({
                    status: 'cancelled',
                    updated_at: new Date().toISOString(),
                })
                .where(
                    and(
                        eq(schema.webshop_preorders.id, preorderId),
                        ne(schema.webshop_preorders.status, 'cancelled')
                    )
                )
                .returning({ id: schema.webshop_preorders.id });

            if (cancelled.length === 0) return;

            const lines = await tx
                .select({
                    product_id: schema.webshop_preorder_lines.product_id,
                    variant_id: schema.webshop_preorder_lines.variant_id,
                    quantity: schema.webshop_preorder_lines.quantity,
                })
                .from(schema.webshop_preorder_lines)
                .where(eq(schema.webshop_preorder_lines.preorder_id, preorderId));

            for (const line of lines) {
                if (line.product_id) {
                    await tx
                        .update(schema.webshop_products)
                        .set({
                            stock_quantity: sql`${schema.webshop_products.stock_quantity} + ${line.quantity}`,
                        })
                        .where(eq(schema.webshop_products.id, line.product_id));
                }
                if (line.variant_id) {
                    await tx
                        .update(schema.webshop_product_variants)
                        .set({
                            stock_quantity: sql`${schema.webshop_product_variants.stock_quantity} + ${line.quantity}`,
                        })
                        .where(eq(schema.webshop_product_variants.id, line.variant_id));
                }
            }
        });
    }
}
