"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
/**
 * Finance Service - Salve Mundi V7
 * Handles asynchronous payment processing via Mollie Webhooks.
 */
const fastify = (0, fastify_1.default)({
    logger: true
});
fastify.get('/health', async () => {
    return { status: 'ok', service: 'finance-service' };
});
// Endpoint from Docs 2.1
fastify.post('/api/finance/webhook/mollie', async (request, reply) => {
    return { received: true };
});
const start = async () => {
    try {
        await fastify.listen({ port: 3001, host: '0.0.0.0' });
        console.log('Finance Service listening on port 3001');
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
