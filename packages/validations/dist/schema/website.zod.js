"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentenSchema = exports.documentSchema = void 0;
const zod_1 = require("zod");
// Schema voor de 'documenten' collectie (statuten, avg, etc.) uit het ERD.
// Kolommen zijn strict snake_case conform de Datamodel ERD.
exports.documentSchema = zod_1.z.object({
    id: zod_1.z.number().int(),
    title: zod_1.z.string(),
    description: zod_1.z.string().nullable().optional(),
    // UUID van het bestand binnen Directus files
    file: zod_1.z.string(),
    category: zod_1.z.string(),
    display_order: zod_1.z.number().int(),
});
exports.documentenSchema = zod_1.z.array(exports.documentSchema);
