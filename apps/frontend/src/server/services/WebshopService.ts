import crypto from 'node:crypto';
import type { WebshopCustomFieldValue, WebshopPreorderForm } from '@salvemundi/validations/schema/webshop.zod';
import {
    InsufficientStockError,
    type CreateReservedPreorderInput,
    type WebshopCheckoutProductDTO,
    type WebshopPreorderDTO,
} from '@/server/dto/webshop.dto';
import {
    FinanceApiError,
    FinanceConfigError,
    type FinanceApiClient,
} from '@/server/integrations/FinanceApiClient';
import { safeConsoleError } from '@/server/utils/logger';

export interface OrderRepositoryPort {
    getCheckoutProduct(productId: number): Promise<WebshopCheckoutProductDTO | null>;
    countActiveOrdersForProduct(productId: number): Promise<number>;
    saveWithReservation(input: CreateReservedPreorderInput): Promise<WebshopPreorderDTO>;
    cancelAndRelease(preorderId: number): Promise<void>;
}

export interface SubmitPreorderCommand {
    form: WebshopPreorderForm;
    userId: string;
    redirectBaseUrl: string;
}

export type SubmitPreorderOutcome =
    | {
          success: true;
          checkoutUrl?: string;
          preorderId: number;
          error?: never;
      }
    | {
          success: false;
          error: string;
          preorderId?: number;
      };

export class WebshopService {
    constructor(
        private readonly orders: OrderRepositoryPort,
        private readonly finance: FinanceApiClient
    ) {}

    async submitPreorderAndInitiatePayment(command: SubmitPreorderCommand): Promise<SubmitPreorderOutcome> {
        const { form, userId, redirectBaseUrl } = command;

        if (form.lines.length !== 1) {
            return {
                success: false,
                error: 'Er kan op dit moment maar 1 product per bestelling worden geplaatst.',
            };
        }

        const line = form.lines.at(0);
        if (!line) {
            return {
                success: false,
                error: 'Er kan op dit moment maar 1 product per bestelling worden geplaatst.',
            };
        }

        const product = await this.orders.getCheckoutProduct(line.product_id);
        if (!product || !product.isActive) {
            return { success: false, error: 'Dit product is niet meer beschikbaar.' };
        }

        if (
            product.dropWindow &&
            (product.dropWindow.id !== form.drop_window_id || product.dropWindow.status !== 'open')
        ) {
            return { success: false, error: 'Deze drop is gesloten voor nieuwe bestellingen.' };
        }

        if (product.maxOrders !== null) {
            const activeOrders = await this.orders.countActiveOrdersForProduct(product.id);
            if (activeOrders >= product.maxOrders) {
                return { success: false, error: 'Deze drop heeft de bestellimiet bereikt.' };
            }
        }

        let variantLabel: string | null = null;
        if (product.type === 'clothing') {
            if (!line.variant_id) {
                return { success: false, error: 'Kies een maat.' };
            }

            const variant = product.variants.find((v) => v.id === line.variant_id && v.isActive);
            if (!variant) {
                return { success: false, error: 'Ongeldige variant geselecteerd.' };
            }

            variantLabel = [variant.size, variant.color].filter(Boolean).join(' / ') || null;
        }

        const answers = line.custom_field_answers ?? [];
        const customFieldValues: WebshopCustomFieldValue[] = [];
        for (const [index, def] of product.customFields.entries()) {
            const value = (answers.at(index) ?? '').trim();
            if (!value) {
                return { success: false, error: `Vul "${def.label}" in.` };
            }
            if (value.length > def.maxLength) {
                return {
                    success: false,
                    error: `"${def.label}" mag maximaal ${def.maxLength} tekens bevatten.`,
                };
            }
            customFieldValues.push({ label: def.label, value });
        }

        const unitPrice = product.price;
        const subtotal = unitPrice * line.quantity;

        if (!(subtotal > 0)) {
            return { success: false, error: 'Het te betalen bedrag is ongeldig.' };
        }

        // Decision D1: reserve stock & save order atomically in DB transaction first.
        let preorder: WebshopPreorderDTO;
        try {
            preorder = await this.orders.saveWithReservation({
                userId,
                dropWindowId: product.dropWindow?.id ?? null,
                firstName: form.first_name,
                lastName: form.last_name,
                email: form.email,
                phoneNumber: form.phone_number,
                subtotalAmount: subtotal,
                termsAccepted: form.terms_accepted,
                pickupNotes: form.pickup_notes || null,
                accessToken: crypto.randomUUID(),
                line: {
                    productId: product.id,
                    variantId: line.variant_id ?? null,
                    quantity: line.quantity,
                    unitPrice,
                    productNameSnapshot: product.name,
                    variantLabelSnapshot: variantLabel,
                    customFieldValues: customFieldValues.length > 0 ? customFieldValues : null,
                },
            });
        } catch (error: unknown) {
            if (error instanceof InsufficientStockError) {
                return { success: false, error: error.message };
            }
            throw error;
        }

        if (preorder.depositPaid) {
            return { success: false, error: 'Deze bestelling is al betaald.', preorderId: preorder.id };
        }

        const idempotencyKey = `webshop-preorder-${preorder.id}-${preorder.accessToken ?? crypto.randomUUID()}`;
        const redirectUrl = `${redirectBaseUrl}/merch/bevestiging?preorder=${preorder.id}&token=${preorder.accessToken ?? ''}`;

        try {
            const payment = await this.finance.requestPayment({
                amount: preorder.subtotalAmount,
                description: 'Salve Mundi Webshop',
                productName: `Bestelling webshop #${preorder.id}`,
                registrationId: preorder.id,
                registrationType: 'webshop_preorder',
                email: preorder.email,
                firstName: preorder.firstName,
                lastName: preorder.lastName,
                phoneNumber: preorder.phoneNumber,
                userId: preorder.userId,
                redirectUrl,
                idempotencyKey,
            });

            return {
                success: true,
                checkoutUrl: payment.checkoutUrl,
                preorderId: preorder.id,
            };
        } catch (error: unknown) {
            // Decision D1 compensation: release reserved stock and cancel order when payment creation fails.
            try {
                await this.orders.cancelAndRelease(preorder.id);
            } catch (rollbackError: unknown) {
                safeConsoleError(
                    '[WebshopService.ts][submitPreorderAndInitiatePayment] Compensation cancelAndRelease failed:',
                    rollbackError
                );
            }

            if (error instanceof FinanceConfigError || error instanceof FinanceApiError) {
                return { success: false, error: error.message, preorderId: preorder.id };
            }

            safeConsoleError('[WebshopService.ts][submitPreorderAndInitiatePayment]', error);
            return {
                success: false,
                error: 'Interne fout bij starten betaling.',
                preorderId: preorder.id,
            };
        }
    }
}
