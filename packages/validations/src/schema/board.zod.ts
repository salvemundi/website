import { z } from 'zod';
import { selectBoardSchema, selectBoardMembersSchema, selectDirectusUsersSchema } from './db.zod.js';

export const boardMemberSchema = selectBoardMembersSchema.extend({
    id: z.coerce.number(),
    board_id: z.coerce.number().optional(),
    user_id: selectDirectusUsersSchema.pick({
        id: true,
        first_name: true,
        last_name: true,
        avatar: true,
        title: true,
    }).nullable().optional(),
});

export const boardSchema = selectBoardSchema.extend({
    id: z.coerce.number(),
    members: z.array(boardMemberSchema).optional(),
});

export const boardHistorySchema = z.array(boardSchema);

export type Board = z.infer<typeof boardSchema>;
export type BoardMember = z.infer<typeof boardMemberSchema>;
