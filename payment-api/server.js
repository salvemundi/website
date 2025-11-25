const express = require('express');
const cors = require('cors');
const { createMollieClient } = require('@mollie/api-client');
const axios = require('axios');
require('dotenv').config();

const app = express();

// --- CONFIGURATIE & CHECKS ---
const PORT = process.env.PORT;
const DIRECTUS_URL = process.env.DIRECTUS_URL;
const WEBHOOK_URL = process.env.MOLLIE_WEBHOOK_URL;
const MOLLIE_API_KEY = process.env.MOLLIE_API_KEY;
const DIRECTUS_API_TOKEN = process.env.DIRECTUS_API_TOKEN;
// Interne URL naar je email container (pas aan als je container anders heet)
const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'http://email-api:3001';

console.log("--- STARTUP CONFIG CHECK ---");
console.log(`PORT: ${PORT}`);
console.log(`DIRECTUS_URL: ${DIRECTUS_URL}`);
console.log(`WEBHOOK_URL: ${WEBHOOK_URL}`);
console.log(`EMAIL_SERVICE_URL: ${EMAIL_SERVICE_URL}`);
console.log(`MOLLIE_API_KEY: ${MOLLIE_API_KEY ? '***SET***' : 'MISSING'}`);
console.log(`DIRECTUS_API_TOKEN: ${DIRECTUS_API_TOKEN ? '***SET***' : 'MISSING'}`);

if (!PORT || !DIRECTUS_URL || !WEBHOOK_URL || !MOLLIE_API_KEY || !DIRECTUS_API_TOKEN) {
    console.error('❌ FATAL ERROR: Een of meer environment variabelen ontbreken!');
    process.exit(1);
}

const mollieClient = createMollieClient({ apiKey: MOLLIE_API_KEY });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
    'https://dev.salvemundi.nl',
    'https://salvemundi.nl',
    'http://localhost:5173'
];

app.use(cors({
    origin: function (origin, callback) {
        // console.log(`Incoming request from origin: ${origin}`);
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`Blocked CORS origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    }
}));

/**
 * Endpoint: POST /api/payments/create
 */
app.post('/api/payments/create', async (req, res) => {
    console.log(`\n--- NEW PAYMENT REQUEST ---`);
    
    try {
        const { amount, description, redirectUrl, userId, email, registrationId, isContribution } = req.body;

        if (!amount || !description || !redirectUrl) {
            console.error("❌ Missing parameters");
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        // 1. Directus Transaction
        const transactionPayload = {
            amount: amount,
            product_name: description,
            payment_status: 'open',
            email: email || null,
            registration: registrationId || null
            // user_id laten we weg, tenzij we hem hieronder expliciet hebben
        };

        if (userId) {
            console.log(`Linking transaction to user ID: ${userId}`);
            transactionPayload.user_id = userId; 
        }

        console.log("1. Creating Directus Transaction...");
        const transactionRecordId = await createDirectusTransaction(transactionPayload);
        console.log(`✅ Directus Transaction Created. ID: ${transactionRecordId}`);

        // 2. Mollie
        const metadata = {
            transactionRecordId: transactionRecordId,
            registrationId: registrationId,
            notContribution: isContribution ? "false" : "true",
            email: email // We slaan email op in metadata voor de bevestiging
        };

        console.log("2. Requesting Payment from Mollie...");
        const payment = await mollieClient.payments.create({
            amount: {
                currency: 'EUR',
                value: parseFloat(amount).toFixed(2),
            },
            description: description,
            redirectUrl: redirectUrl,
            webhookUrl: WEBHOOK_URL,
            metadata: metadata
        });
        console.log(`✅ Mollie Payment Created. ID: ${payment.id}`);

        // 3. Update Directus
        console.log("3. Updating Directus with Mollie ID...");
        await updateDirectusTransaction(transactionRecordId, {
            transaction_id: payment.id
        });
        console.log("✅ Transaction Updated.");

        res.json({
            checkoutUrl: payment.getCheckoutUrl(),
            paymentId: payment.id
        });

    } catch (error) {
        console.error('❌ [PaymentAPI] Create Error:', error.message);
        if (error.response) {
            console.error('Directus/Axios Error Data:', JSON.stringify(error.response.data, null, 2));
        }
        res.status(500).json({ error: 'Failed to create payment.' });
    }
});

/**
 * Endpoint: POST /api/payments/webhook
 */
app.post('/api/payments/webhook', async (req, res) => {
    try {
        const paymentId = req.body.id;

        if (!paymentId) {
            return res.status(400).send('Missing payment ID.');
        }

        const payment = await mollieClient.payments.get(paymentId);
        const { transactionRecordId, registrationId } = payment.metadata;

        let internalStatus = 'open';
        if (payment.isPaid()) internalStatus = 'paid';
        else if (payment.isFailed()) internalStatus = 'failed';
        else if (payment.isCanceled()) internalStatus = 'canceled';
        else if (payment.isExpired()) internalStatus = 'expired';

        console.log(`Mollie Status: ${payment.status} -> Internal: ${internalStatus}`);

        if (transactionRecordId) {
            await updateDirectusTransaction(transactionRecordId, {
                payment_status: internalStatus
            });
        }

        if (payment.isPaid() && registrationId) {
            console.log(`Updating Registration ${registrationId} -> paid`);
            await updateDirectusRegistration(registrationId, {
                payment_status: 'paid'
            });

            // --- HIER VERSTUREN WE DE MAIL ---
            await sendConfirmationEmail(payment.metadata, payment.description);
        }

        res.status(200).send('OK');

    } catch (error) {
        console.error('❌ [PaymentAPI] Webhook Error:', error.message);
        res.status(200).send('Webhook processed with errors');
    }
});

// --- Helper Functions ---

async function createDirectusTransaction(data) {
    try {
        const response = await axios.post(`${DIRECTUS_URL}/items/transactions`, data, getAuthConfig());
        return response.data.data.id;
    } catch (error) {
        throw new Error(`Directus Create Failed: ${error.response?.data?.errors?.[0]?.message || error.message}`);
    }
}

async function updateDirectusTransaction(id, data) {
    try {
        await axios.patch(`${DIRECTUS_URL}/items/transactions/${id}`, data, getAuthConfig());
    } catch (error) {
        console.error(`Failed to update transaction ${id}:`, error.message);
    }
}

async function updateDirectusRegistration(id, data) {
    try {
        await axios.patch(`${DIRECTUS_URL}/items/event_signups/${id}`, data, getAuthConfig());
    } catch (error) {
        console.error(`Failed to update registration ${id}:`, error.message);
    }
}

async function sendConfirmationEmail(metadata, description) {
    // Alleen sturen als we een emailadres hebben
    if (!metadata || !metadata.email || metadata.email === 'null') {
        console.log("⚠️ No email found in metadata, skipping confirmation email.");
        return;
    }

    try {
        console.log(`📧 Sending confirmation email to ${metadata.email}...`);
        
        await axios.post(`${EMAIL_SERVICE_URL}/send-email`, {
            to: metadata.email,
            subject: `Betaling geslaagd: ${description}`,
            html: `
                <div style="font-family: sans-serif; color: #333;">
                    <h2 style="color: #663399;">Bedankt voor je betaling!</h2>
                    <p>Beste lid,</p>
                    <p>Je betaling voor <strong>${description}</strong> is succesvol ontvangen.</p>
                    <p>Je inschrijving is nu definitief.</p>
                    <br/>
                    <p>Met vriendelijke groet,</p>
                    <p><strong>S.A. Salve Mundi</strong></p>
                </div>
            `
        });
        
        console.log("✅ Confirmation email sent.");
    } catch (error) {
        console.error("❌ Failed to send confirmation email:", error.message);
        // We gooien geen error, want de betaling zelf is wel gelukt.
    }
}

function getAuthConfig() {
    return {
        headers: {
            'Authorization': `Bearer ${DIRECTUS_API_TOKEN}`,
            'Content-Type': 'application/json'
        }
    };
}

app.listen(PORT, () => {
    console.info(`[PaymentAPI] Server running on port ${PORT}`);
});