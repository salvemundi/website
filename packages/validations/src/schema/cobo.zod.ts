import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { cobo as coboTable, cobo_board_preferences as cobo_board_preferencesTable, cobo_guest_boards as cobo_guest_boardsTable } from '@salvemundi/db/schema';

const selectCoboSchema = createSelectSchema(coboTable);
const insertCoboSchema = createInsertSchema(coboTable);
const selectCoboBoardPreferencesSchema = createSelectSchema(cobo_board_preferencesTable);
const insertCoboBoardPreferencesSchema = createInsertSchema(cobo_board_preferencesTable);
const selectCoboGuestBoardsSchema = createSelectSchema(cobo_guest_boardsTable);
const insertCoboGuestBoardsSchema = createInsertSchema(cobo_guest_boardsTable);

export const coboEventSchema = selectCoboSchema;
export type CoboEvent = z.infer<typeof coboEventSchema>;

export const insertCoboEventSchema = insertCoboSchema;
export type InsertCoboEvent = z.infer<typeof insertCoboEventSchema>;

export const coboBoardPreferenceSchema = selectCoboBoardPreferencesSchema.extend({
    user: z.object({
        id: z.string(),
        first_name: z.string().nullable().optional(),
        last_name: z.string().nullable().optional(),
        avatar: z.string().nullable().optional(),
        functie: z.string().nullable().optional()
    }).optional()
});
export type CoboBoardPreference = z.infer<typeof coboBoardPreferenceSchema>;

export const coboGuestBoardSchema = selectCoboGuestBoardsSchema;
export type CoboGuestBoard = z.infer<typeof coboGuestBoardSchema>;

// Formulier / input schemas voor mutaties (afgeleid van insert schemas)
export const createCoboGuestBoardFormSchema = insertCoboGuestBoardsSchema.pick({
    cobo_id: true,
    board_name: true,
    activity_type: true,
    activity_custom: true
}).extend({
    board_name: z.string().min(1, 'Vul de naam van de gasten/vereniging in'),
    activity_type: z.string().min(1, 'Selecteer een activiteit')
});

export type CreateCoboGuestBoardInput = z.infer<typeof createCoboGuestBoardFormSchema>;

export const updateCoboBoardPreferenceFormSchema = insertCoboBoardPreferencesSchema.pick({
    cobo_id: true,
    user_id: true,
    drinks_alcohol: true,
    vetoes: true,
    dietary_requirements: true,
    notes: true
});

export type UpdateCoboBoardPreferenceInput = z.infer<typeof updateCoboBoardPreferenceFormSchema>;

