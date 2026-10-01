import { z } from 'zod';
import { selectTripsSchema, selectTripActivitiesSchema } from './db.zod.js';

export const tripSchema = selectTripsSchema.extend({
    id: z.coerce.number().int(),
    description: z.preprocess((value) => {
        if (value === null || value === undefined || value === '') return null;
        if (typeof value === 'string') return value;
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        return null;
    }, z.string().nullable().optional()),
    image: z.preprocess((value) => {
        if (!value) return null;
        if (typeof value === 'object' && 'id' in value && typeof value.id === 'string') {
            return {
                id: value.id,
                type: 'type' in value && typeof value.type === 'string' ? value.type : null
            };
        }
        return typeof value === 'string' ? value : null;
    }, z.union([
        z.string(),
        z.object({
            id: z.string(),
            type: z.string().nullable().optional()
        })
    ]).nullable().optional()),
    start_date: z.preprocess((value) => {
        if (value === null || value === undefined || value === '') return null;
        if (typeof value === 'string') return value;
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        return null;
    }, z.string().nullable().optional()),
    end_date: z.preprocess((value) => {
        if (value === null || value === undefined || value === '') return null;
        if (typeof value === 'string') return value;
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        return null;
    }, z.string().nullable().optional()),
    registration_start_date: z.preprocess((value) => {
        if (value === null || value === undefined || value === '') return null;
        if (typeof value === 'string') return value;
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        return null;
    }, z.string().nullable().optional()),
    registration_open: z.preprocess((value) => {
        if (value === undefined || value === null) return false;
        if (typeof value === 'boolean') return value;
        if (value === 'true' || value === '1' || value === 'on') return true;
        if (value === 'false' || value === '0' || value === 'off') return false;
        return Boolean(value);
    }, z.boolean().optional()),
    max_participants: z.coerce.number().int(),
    deposit_amount: z.coerce.number().nonnegative().optional().nullable(),
    location: z.string().nullable().optional(),
});

export type Trip = z.infer<typeof tripSchema>;
export type BeheerTrip = Trip;

export const tripActivityOptionSchema = z.object({
    id: z.string().optional().nullable(),
    name: z.string().optional().nullable(),
    price: z.coerce.number().optional().nullable(),
});
export type TripActivityOption = z.infer<typeof tripActivityOptionSchema>;

export const tripActivitySchema = selectTripActivitiesSchema.extend({
    id: z.coerce.number().int(),
    trip_id: z.coerce.number().int().nullable().optional(),
    name: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    price: z.preprocess((value) => {
        if (value === null || value === undefined || value === '') return 0;
        if (typeof value === 'number') return value;
        const parsed = Number(value);
        return isNaN(parsed) ? 0 : parsed;
    }, z.number().nonnegative().optional().nullable()),
    image: z.preprocess((value) => {
        if (!value) return null;
        if (typeof value === 'object' && 'id' in value && typeof value.id === 'string') {
            return {
                id: value.id,
                type: 'type' in value && typeof value.type === 'string' ? value.type : null
            };
        }
        return typeof value === 'string' ? value : null;
    }, z.union([
        z.string(),
        z.object({
            id: z.string(),
            type: z.string().nullable().optional()
        })
    ]).nullable().optional()),
    max_participants: z.coerce.number().int().nullable().optional(),
    is_active: z.preprocess((value) => {
        if (value === undefined || value === null) return true;
        if (typeof value === 'boolean') return value;
        if (value === 'true' || value === '1' || value === 'on') return true;
        if (value === 'false' || value === '0' || value === 'off') return false;
        return Boolean(value);
    }, z.boolean().optional().nullable()),
    display_order: z.coerce.number().int().nullable().optional(),
    options: z.preprocess((value) => {
        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            } catch {
                return [];
            }
        }
        return Array.isArray(value) ? value : [];
    }, z.array(tripActivityOptionSchema).optional().nullable()),
    max_selections: z.coerce.number().int().nullable().optional(),
});

export type TripActivity = z.infer<typeof tripActivitySchema>;
export type BeheerTripActivity = TripActivity;
