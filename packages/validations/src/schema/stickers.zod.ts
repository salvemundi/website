import { z } from 'zod';
import { selectStickersSchema, selectDirectusUsersSchema } from './db.zod.js';

export const stickerUserSchema = selectDirectusUsersSchema.pick({
    id: true,
    first_name: true,
    last_name: true,
    avatar: true,
});

export const stickerSchema = selectStickersSchema.omit({
    user_updated: true,
    date_updated: true,
}).extend({
    id: z.coerce.number(),
    latitude: z.coerce.number(),
    longitude: z.coerce.number(),
    user_created: z.union([z.string(), stickerUserSchema]).nullable().optional(),
});

export const stickerPublicSchema = stickerSchema.extend({
    user_created: stickerUserSchema.nullable().optional(),
});

export type StickerUser = z.infer<typeof stickerUserSchema>;
export type Sticker = z.infer<typeof stickerSchema>;
export type StickerPublic = z.infer<typeof stickerPublicSchema>;
