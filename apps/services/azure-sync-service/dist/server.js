"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
/**
 * Azure Sync Service - Salve Mundi V7
 * Manages Microsoft Graph API tokens and Entra ID synchronization.
 */
const fastify = (0, fastify_1.default)({
    logger: true
});
fastify.get('/health', async () => {
    return { status: 'ok', service: 'azure-sync-service' };
});
const start = async () => {
    try {
        await fastify.listen({ port: 3002, host: '0.0.0.0' });
        console.log('Azure Sync Service listening on port 3002');
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
