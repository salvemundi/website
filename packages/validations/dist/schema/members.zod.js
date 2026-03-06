"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.memberUpdateSchema = exports.memberSchema = void 0;
const zod_1 = require("zod");
exports.memberSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    email: zod_1.z.string().email(),
    firstName: zod_1.z.string(),
    lastName: zod_1.z.string(),
    azureOid: zod_1.z.string().optional(),
});
exports.memberUpdateSchema = exports.memberSchema.partial();
