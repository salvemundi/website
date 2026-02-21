import Fastify from "fastify";

const PORT = Number(process.env.PORT) || 4003;
const HOST = process.env.HOST ?? "0.0.0.0";

const app = Fastify({
    logger: {
        level: process.env.NODE_ENV === "production" ? "info" : "debug",
    },
});

// ─── Health Check ──────────────────────────────────────────
app.get("/health", async () => {
    return { status: "ok", service: "sync-service", timestamp: new Date().toISOString() };
});

// ─── Start Server ──────────────────────────────────────────
const start = async () => {
    try {
        await app.listen({ port: PORT, host: HOST });
        app.log.info(`Sync service running on ${HOST}:${PORT}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();

export default app;
