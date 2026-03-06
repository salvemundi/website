"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentIntentSchema = exports.mollieWebhookSchema = void 0;
const zod_1 = require("zod");
exports.mollieWebhookSchema = zod_1.z.object({
    id: zod_1.z.string().startsWith('tr_'),
});
exports.paymentIntentSchema = zod_1.z.object({
    amount: zod_1.z.number().positive(),
    description: zod_1.z.string(),
});
