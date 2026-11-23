import { z } from 'zod';
import { createSelectSchema } from 'drizzle-zod';
import { Board as BoardTable, Board_Members as Board_MembersTable, directus_users as directus_usersTable } from '@salvemundi/db/schema';

const selectBoardSchema = createSelectSchema(BoardTable);
const selectBoardMembersSchema = createSelectSchema(Board_MembersTable);
const selectDirectusUsersSchema = createSelectSchema(directus_usersTable);

export const boardMemberSchema = selectBoardMembersSchema.omit({
    date_created: true,
    date_updated: true,
}).extend({
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

export const boardSchema = selectBoardSchema.omit({
    date_created: true,
    date_updated: true,
    user_created: true,
    user_updated: true,
}).extend({
    id: z.coerce.number(),
    members: z.array(boardMemberSchema).optional(),
});

export const boardHistorySchema = z.array(boardSchema);

export type Board = z.infer<typeof boardSchema>;
export type BoardMember = z.infer<typeof boardMemberSchema>;
