import express from "express";
import axios from "axios";

const app = express();
app.use(express.json({ type: ["application/json", "text/plain"] })); // Graph sometimes sends text/plain JSON

const PORT = process.env.PORT || 3008;
const PATH = process.env.WEBHOOK_PATH || "/webhooks/graph";
const SECRET = process.env.WEBHOOK_CLIENT_STATE || "";
const GRAPH_SYNC_URL = process.env.GRAPH_SYNC_URL || "http://graph-sync:3001";

// Combined handler for validation handshake and notifications
app.post(PATH, async (req, res) => {
    // 1. Validation handshake (Graph calls POST with ?validationToken=...)
    const token = req.query.validationToken;
    if (typeof token === "string") {
        console.log(`[GraphWebhook] Validation handshake received, returning token`);
        return res.status(200).type("text/plain").send(token); // exact echo, no newline
    }

    // 2. Normal change notification
    res.sendStatus(202); // Ack fast for Graph policies

    const notifications = Array.isArray(req.body?.value) ? req.body.value : [];
    console.log(`[GraphWebhook] Received ${notifications.length} notification(s) from Microsoft Graph`);

    for (const n of notifications) {
        // Validate clientState if configured
        if (process.env.WEBHOOK_CLIENT_STATE && n.clientState !== process.env.WEBHOOK_CLIENT_STATE) {
            console.warn(`[GraphWebhook] Invalid clientState, skipping notification`);
            continue;
        }

        // Extract resource information
        const resource = n.resource || "";
        const changeType = n.changeType || "unknown";

        console.log(`[GraphWebhook] Processing notification: ${changeType} on ${resource}`);

        // Check if this is a user change
        if (resource.includes('/users/')) {
            const userId = resource.split('/users/')[1]?.split('/')[0];

            if (userId) {
                console.log(`[GraphWebhook] User change detected: ${userId} (${changeType})`);

                // Trigger graph-sync to update this user in Directus
                try {
                    await axios.post(`${GRAPH_SYNC_URL}/sync/user`, {
                        userId: userId
                    }, {
                        timeout: 10000,
                        headers: { 'Content-Type': 'application/json' }
                    });

                    console.log(`[GraphWebhook] ✅ Successfully triggered sync for user: ${userId}`);
                } catch (error) {
                    console.error(`[GraphWebhook] ❌ Failed to trigger sync for user ${userId}:`, error.message);
                    // Don't throw - we already acknowledged the webhook
                }
            }
        } else if (resource.includes('/groups/')) {
            const groupId = resource.split('/groups/')[1]?.split('/')[0];
            console.log(`[GraphWebhook] Group change detected: ${groupId} (${changeType})`);

            // Check if this is a group membership change (e.g. groups/{id}/members/{userId})
            const resourceParts = resource.split('/');
            const membersIndex = resourceParts.indexOf('members');
            if (membersIndex !== -1 && resourceParts.length > membersIndex + 1) {
                const userId = resourceParts[membersIndex + 1];
                console.log(`[GraphWebhook] Group membership change for user detected: ${userId} (${changeType})`);

                // Trigger sync for this user
                try {
                    await axios.post(`${GRAPH_SYNC_URL}/sync/user`, {
                        userId: userId
                    }, {
                        timeout: 10000,
                        headers: { 'Content-Type': 'application/json' }
                    });
                    console.log(`[GraphWebhook] ✅ Successfully triggered sync for user: ${userId} due to group change`);
                } catch (error) {
                    console.error(`[GraphWebhook] ❌ Failed to trigger sync for user ${userId} on group change:`, error.message);
                }
            } else {
                console.log(`[GraphWebhook] ℹ️ Group change on ${resource} is not a member-specific change, skipping sync.`);
            }
        } else {
            console.log(`[GraphWebhook] ℹ️ Non-user/group resource change: ${resource}`);
        }
    }
});

// Health check endpoint (for docker-compose healthcheck)
app.get('/healthz', (req, res) => res.send('OK'));

// Status endpoint to verify configuration
app.get('/status', (req, res) => {
    res.json({
        status: 'running',
        webhook_path: PATH,
        graph_sync_url: GRAPH_SYNC_URL,
        client_state_configured: !!SECRET,
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`[GraphWebhook] Server running on port ${PORT}`);
    console.log(`[GraphWebhook] Webhook path: ${PATH}`);
    console.log(`[GraphWebhook] Graph Sync URL: ${GRAPH_SYNC_URL}`);
    console.log(`[GraphWebhook] Client State: ${SECRET ? 'Configured' : 'Not configured'}`);
});
