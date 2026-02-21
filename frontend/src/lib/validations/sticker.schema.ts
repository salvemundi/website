/**
 * Zod Validation Schemas — Sticker
 *
 * Shared validation schemas for sticker-related data.
 *
 * @module lib/validations/sticker
 */
import { z } from "zod";

export const createStickerSchema = z.object({
    name: z.string().min(1, "Naam is verplicht").max(100),
    image_url: z.string().url("Ongeldige afbeeldings-URL"),
});

export type CreateStickerInput = z.infer<typeof createStickerSchema>;
