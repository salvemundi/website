"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reisSignupFormSchema = exports.reisTripSignupSchema = exports.reisTripSchema = exports.reisSiteSettingsSchema = void 0;
const zod_1 = require("zod");
exports.reisSiteSettingsSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    show: zod_1.z.boolean(),
    disabled_message: zod_1.z.string().nullable().optional(),
});
exports.reisTripSchema = zod_1.z.object({
    id: zod_1.z.number().int(),
    name: zod_1.z.string(),
    event_date: zod_1.z.string().nullable().optional(),
    start_date: zod_1.z.string().nullable().optional(),
    end_date: zod_1.z.string().nullable().optional(),
    image: zod_1.z.string().nullable().optional(),
    description: zod_1.z.string().nullable().optional(),
    registration_open: zod_1.z.boolean(),
    registration_start_date: zod_1.z.string().nullable().optional(),
    max_participants: zod_1.z.number().int(),
    allow_final_payments: zod_1.z.boolean().nullable().optional(),
});
exports.reisTripSignupSchema = zod_1.z.object({
    id: zod_1.z.number().int(),
    trip_id: zod_1.z.number().int(),
    first_name: zod_1.z.string().min(1, 'Voornaam is verplicht'),
    middle_name: zod_1.z.string().nullable().optional(),
    last_name: zod_1.z.string().min(1, 'Achternaam is verplicht'),
    email: zod_1.z.string().email('Ongeldig e-mailadres'),
    phone_number: zod_1.z.string().nullable().optional(),
    date_of_birth: zod_1.z.string().nullable().optional(),
    terms_accepted: zod_1.z.boolean().refine(val => val === true, {
        message: 'Je moet de algemene voorwaarden accepteren.',
    }),
    status: zod_1.z.enum(['registered', 'waitlist', 'confirmed', 'cancelled']),
    role: zod_1.z.enum(['participant', 'crew']).optional(),
    deposit_paid: zod_1.z.boolean().optional(),
    full_payment_paid: zod_1.z.boolean().optional(),
});
exports.reisSignupFormSchema = zod_1.z.object({
    first_name: zod_1.z.string().min(1, 'Voornaam is verplicht'),
    middle_name: zod_1.z.string().optional(),
    last_name: zod_1.z.string().min(1, 'Achternaam is verplicht'),
    email: zod_1.z.string().email('Ongeldig e-mailadres'),
    phone_number: zod_1.z.string().min(5, 'Telefoonnummer is verplicht'),
    date_of_birth: zod_1.z.string().min(1, 'Geboortedatum is verplicht'),
    terms_accepted: zod_1.z.boolean().refine(val => val === true, {
        message: 'Je moet de algemene voorwaarden accepteren.',
    }),
});
