import { z } from 'zod';

export const createPizzaRoundSchema = z.object({
    title: z.string().trim().min(1, 'Titel is verplicht').max(100, 'Titel mag maximaal 100 tekens zijn'),
    note: z.string().trim().max(500, 'Opmerking mag maximaal 500 tekens zijn').optional(),
    closes_at: z.coerce
        .date({ message: 'Ongeldige sluitingstijd' })
        .refine((d) => d.getTime() > Date.now(), 'De sluitingstijd moet in de toekomst liggen')
        .refine((d) => d.getTime() <= Date.now() + 7 * 24 * 3600 * 1000, 'De sluitingstijd mag maximaal 7 dagen vooruit liggen'),
});

export const placePizzaOrderSchema = z.object({
    item_name: z.string().trim().min(1, 'Kies een pizza').max(100, 'Naam mag maximaal 100 tekens zijn'),
    size: z.string().trim().max(20, 'Formaat mag maximaal 20 tekens zijn').optional(),
    note: z.string().trim().max(200, 'Opmerking mag maximaal 200 tekens zijn').optional(),
    price: z.coerce
        .number({ message: 'Vul een geldige prijs in' })
        .gt(0, 'Prijs moet hoger zijn dan 0')
        .max(100, 'Prijs mag maximaal €100 zijn')
        .refine((n) => Math.abs(Math.round(n * 100) - n * 100) < 1e-6, 'Prijs mag maximaal 2 decimalen hebben'),
    payConfirmed: z.literal(true, { message: 'Je moet bevestigen dat je de aanmaker terugbetaalt' }),
});

export type CreatePizzaRoundInput = z.infer<typeof createPizzaRoundSchema>;
export type PlacePizzaOrderInput = z.infer<typeof placePizzaOrderSchema>;

export type PizzaRoundStatus = 'open' | 'closed' | 'paid';

export interface PizzaRoundSummary {
    id: string;
    title: string;
    creatorName: string;
    creatorId: string;
    closesAt: string;
    status: PizzaRoundStatus;
    orderCount: number;
    totalAmount: number;
    isOpen: boolean;
}

export interface PizzaOrderView {
    id: string;
    userId: string;
    userName: string;
    itemName: string;
    size: string | null;
    note: string | null;
    price: number;
    addedToOrderAt: string | null;
    paidAt: string | null;
    isMine: boolean;
}

export interface PizzaRoundDetail {
    round: PizzaRoundSummary & { note: string | null };
    orders: PizzaOrderView[];
    isCreator: boolean;
    currentUserId: string;
}
