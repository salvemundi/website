import { z } from 'zod';

export const boardMemberSchema = z.object({
    id: z.number(),
    board_id: z.number().optional(),
    functie: z.string().nullable(),
    user_id: z.object({
        id: z.string(),
        first_name: z.string().nullable(),
        last_name: z.string().nullable(),
        avatar: z.string().nullable(),
        title: z.string().nullable(),
    }).nullable().optional(),
    name: z.string().nullable(),
});

export const boardSchema = z.object({
    id: z.number(),
    image: z.string().nullable(),
    naam: z.string().nullable(),
    year: z.string().nullable(),
    members: z.array(boardMemberSchema).optional(),
});

export const boardHistorySchema = z.array(boardSchema);

export type Board = z.infer<typeof boardSchema>;
export type BoardMember = z.infer<typeof boardMemberSchema>;
