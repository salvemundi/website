"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeHavensSchema = exports.safeHavenSchema = void 0;
const zod_1 = require("zod");
/**
 * Zod schema voor de 'safe_havens' collectie (Vertrouwenspersonen)
 * Conform het [GEÜPDATE] Datamodel ERD.
 */
exports.safeHavenSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    naam: zod_1.z.string(),
    email: zod_1.z.string().email().nullable().optional(),
    telefoon: zod_1.z.string().nullable().optional(),
    beschrijving: zod_1.z.string().nullable().optional(),
    afbeelding_id: zod_1.z.string().uuid().nullable().optional(),
    status: zod_1.z.string(),
    sort: zod_1.z.number().int().nullable().optional(),
});
exports.safeHavensSchema = zod_1.z.array(exports.safeHavenSchema);
