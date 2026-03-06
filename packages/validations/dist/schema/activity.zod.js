"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activitiesResponseSchema = exports.activitySchema = void 0;
const zod_1 = require("zod");
exports.activitySchema = zod_1.z.object({
    id: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]),
    name: zod_1.z.string(),
    description: zod_1.z.string().nullable().optional(),
    description_logged_in: zod_1.z.string().nullable().optional(),
    event_date: zod_1.z.string(),
    event_date_end: zod_1.z.string().nullable().optional(),
    event_time: zod_1.z.string().nullable().optional(),
    event_time_end: zod_1.z.string().nullable().optional(),
    time_end: zod_1.z.string().nullable().optional(),
    location: zod_1.z.string().nullable().optional(),
    image: zod_1.z.string().nullable().optional(),
    price_members: zod_1.z.number().nullable().optional(),
    price_non_members: zod_1.z.number().nullable().optional(),
    committee_name: zod_1.z.string().nullable().optional(),
    contact: zod_1.z.string().nullable().optional(),
    inschrijf_deadline: zod_1.z.string().nullable().optional(),
    only_members: zod_1.z.boolean().nullable().optional().default(false),
    status: zod_1.z.string().nullable().optional(),
});
exports.activitiesResponseSchema = zod_1.z.object({
    data: zod_1.z.array(exports.activitySchema),
});
