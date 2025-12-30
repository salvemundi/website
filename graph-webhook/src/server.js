import express from "express";
const app = express();
app.use(express.json({ type: ["application/json", "text/plain"] })); // Graph sometimes sends text/plain JSON
const PORT = process.env.PORT || 3008;
const PATH = process.env.WEBHOOK_PATH || "/webhooks/graph";
const SECRET = process.env.WEBHOOK_CLIENT_STATE || "";

// Combined handler for validation handshake and notifications
app.post(PATH, (req, res) => {
    // 1. Validation handshake (Graph calls POST with ?validationToken=...)
    const token = req.query.validationToken;
    if (typeof token === "string") {
        return res.status(200).type("text/plain").send(token); // exact echo, no newline
    }

    // 2. Normal change notification
    res.sendStatus(202); // Ack fast for Graph policies

    const notifications = Array.isArray(req.body?.value) ? req.body.value : [];
    for (const n of notifications) {
        if (process.env.WEBHOOK_CLIENT_STATE && n.clientState !== process.env.WEBHOOK_CLIENT_STATE) {
            continue;
        }
        // Graph change received; logging removed
        // enqueue real processing here (if expanding this service)
    }
});

// Health check endpoint (for docker-compose healthcheck)
app.get('/healthz', (req, res) => res.send('OK'));

app.listen(PORT, () => {});
