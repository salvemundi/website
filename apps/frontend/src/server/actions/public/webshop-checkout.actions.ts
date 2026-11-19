'use server';

import { webshopPreorderFormSchema, type WebshopPreorderForm } from '@salvemundi/validations/schema/webshop.zod';
import { withMemberAction, type ActionFieldErrors } from '@/server/actions/action-wrapper';
import { HttpFinanceApiClient } from '@/server/integrations/FinanceApiClient';
import { OrderRepository } from '@/server/repositories/OrderRepository';
import { WebshopService } from '@/server/services/WebshopService';

export type SubmitPreorderResult =
    | {
          success: true;
          checkoutUrl?: string;
          preorderId: number;
          error?: never;
      }
    | {
          success: false;
          error: string;
          message?: string;
          errors?: undefined;
          fieldErrors?: ActionFieldErrors;
          preorderId?: number;
      };

function createWebshopService(): WebshopService {
    return new WebshopService(new OrderRepository(), new HttpFinanceApiClient());
}

const executeSubmitPreorder = withMemberAction<
    WebshopPreorderForm,
    WebshopPreorderForm,
    SubmitPreorderResult
>({
    actionName: 'webshop-checkout.actions.ts][submitPreorderAndInitiatePayment',
    honeypot: (formData) => formData.website,
    honeypotErrorMessage: 'Ongeldige aanvraag.',
    rateLimit: {
        key: 'webshop-checkout',
        limit: 5,
        windowSeconds: 300,
        errorMessage: 'Te veel bestelpogingen vanaf dit IP-adres. Probeer het over een paar minuten opnieuw.',
    },
    unauthenticatedErrorMessage: 'Je moet ingelogd zijn om te bestellen.',
    nonMemberErrorMessage: 'Bestellen is alleen voor leden van Salve Mundi.',
    schema: webshopPreorderFormSchema,
    validationErrorMessage: 'Vul alle verplichte velden correct in.',
    fallbackErrorMessage: 'Er is een onverwachte fout opgetreden.',
    handler: async (data, ctx) => {
        const redirectBaseUrl = await ctx.getBaseUrl();
        return createWebshopService().submitPreorderAndInitiatePayment({
            form: data,
            userId: ctx.userId,
            redirectBaseUrl,
        });
    },
});

export async function submitPreorderAndInitiatePayment(
    formData: WebshopPreorderForm
): Promise<SubmitPreorderResult> {
    return executeSubmitPreorder(formData);
}
