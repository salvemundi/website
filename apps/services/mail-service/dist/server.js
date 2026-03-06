"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
/**
 * Mail Service - Salve Mundi V7
 * Handles email rendering and dispatching via templates.
 */
const fastify = (0, fastify_1.default)({
    logger: true
});
fastify.get('/health', async () => {
    return { status: 'ok', service: 'mail-service' };
});
const start = async () => {
    try {
        await fastify.listen({ port: 3003, host: '0.0.0.0' });
        console.log('Mail Service listening on port 3003');
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
