import { z } from 'zod';

export const stickerUserSchema = z.object({
    id: z.string(),
    first_name: z.string().nullable().optional(),
    last_name: z.string().nullable().optional(),
    avatar: z.string().nullable().optional(),
    email: z.string().email().nullable().optional(),
});

export const stickerSchema = z.object({
    id: z.number(),
    latitude: z.number(),
    longitude: z.number(),
    location_name: z.string(),
    description: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    image: z.string().nullable().optional(),
    date_created: z.string().optional(),
    status: z.string().nullable().optional(),
    address: z.string().optional(),
    user_created: z.union([z.string(), stickerUserSchema]).nullable().optional(),
});

export const stickerPublicSchema = stickerSchema.extend({
    user_created: stickerUserSchema.nullable().optional(),
});

export type StickerUser = z.infer<typeof stickerUserSchema>;
export type Sticker = z.infer<typeof stickerSchema>;
export type StickerPublic = z.infer<typeof stickerPublicSchema>;
