"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tripSignupActivitySchema = exports.tripSignupSchema = exports.tripSchema = void 0;
const zod_1 = require("zod");
exports.tripSchema = zod_1.z.object({
    id: zod_1.z.number().int(),
    name: zod_1.z.string(),
    event_date: zod_1.z.string(),
    start_date: zod_1.z.string().nullable().optional(),
    end_date: zod_1.z.string().nullable().optional(),
    registration_open: zod_1.z.boolean(),
    max_participants: zod_1.z.number().int(),
    base_price: zod_1.z.number(),
    crew_discount: zod_1.z.number(),
    deposit_amount: zod_1.z.number(),
    is_bus_trip: zod_1.z.boolean(),
    allow_final_payments: zod_1.z.boolean().nullable().optional(),
});
exports.tripSignupSchema = zod_1.z.object({
    id: zod_1.z.number().int(),
    first_name: zod_1.z.string(),
    middle_name: zod_1.z.string().nullable().optional(),
    last_name: zod_1.z.string(),
    email: zod_1.z.string().email(),
    phone_number: zod_1.z.string().nullable().optional(),
    date_of_birth: zod_1.z.string().nullable().optional(),
    id_document_type: zod_1.z.string().nullable().optional(),
    document_number: zod_1.z.string().nullable().optional(),
    allergies: zod_1.z.string().nullable().optional(),
    special_notes: zod_1.z.string().nullable().optional(),
    willing_to_drive: zod_1.z.boolean().nullable().optional(),
    role: zod_1.z.string(),
    status: zod_1.z.string(),
    deposit_paid: zod_1.z.boolean(),
    deposit_paid_at: zod_1.z.string().nullable().optional(),
    full_payment_paid: zod_1.z.boolean(),
    full_payment_paid_at: zod_1.z.string().nullable().optional(),
    deposit_email_sent: zod_1.z.boolean().nullable().optional(),
    final_email_sent: zod_1.z.boolean().nullable().optional(),
    created_at: zod_1.z.string(),
});
exports.tripSignupActivitySchema = zod_1.z.object({
    id: zod_1.z.number().int().optional(),
    trip_signup_id: zod_1.z.number().int(),
    trip_activity_id: zod_1.z.any(), // Kan een ID zijn of een genest object vanuit Directus
    selected_options: zod_1.z.any().nullable().optional(), // Array of strings meestal
});
