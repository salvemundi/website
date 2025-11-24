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

// Fail-fast: Stop direct als configuratie mist
if (!PORT || !DIRECTUS_URL || !WEBHOOK_URL || !MOLLIE_API_KEY || !DIRECTUS_API_TOKEN) {
    console.error('❌ FATAL ERROR: Een of meer environment variabelen ontbreken!');
    console.error('Check: PORT, DIRECTUS_URL, MOLLIE_WEBHOOK_URL, MOLLIE_API_KEY, DIRECTUS_API_TOKEN');
    process.exit(1);
}

// Initialize Mollie
const mollieClient = createMollieClient({ apiKey: MOLLIE_API_KEY });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS Configuration
const allowedOrigins = [
    'https://dev.salvemundi.nl',
    'https://salvemundi.nl',
    'http://localhost:5173'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));

/**
 * Endpoint: POST /api/payments/create
 */
app.post('/api/payments/create', async (req, res) => {
    try {
        const { amount, description, redirectUrl, userId, email, registrationId, isContribution } = req.body;

        if (!amount || !description || !redirectUrl) {
            return res.status(400).json({ error: 'Missing required parameters: amount, description, or redirectUrl.' });
        }

        // 1. Create a transaction placeholder in Directus
        const transactionRecordId = await createDirectusTransaction({
            amount: amount,
            product_name: description,
            payment_status: 'open',
            user: userId || null,
            email: email || null,
            registration: registrationId || null
        });

        // 2. Prepare Mollie Metadata
        const metadata = {
            transactionRecordId: transactionRecordId,
            registrationId: registrationId,
            notContribution: isContribution ? "false" : "true"
        };

        // 3. Request Payment from Mollie
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

        // 4. Update the Directus record with the official Mollie ID
        await updateDirectusTransaction(transactionRecordId, {
            transaction_id: payment.id
        });

        res.json({
            checkoutUrl: payment.getCheckoutUrl(),
            paymentId: payment.id
        });

    } catch (error) {
        console.error('[PaymentAPI] Create Error:', error.message);
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

        console.info(`[PaymentAPI] Webhook processing: ${paymentId} -> ${internalStatus}`);

        if (transactionRecordId) {
            await updateDirectusTransaction(transactionRecordId, {
                payment_status: internalStatus
            });
        }

        if (payment.isPaid() && registrationId) {
            await updateDirectusRegistration(registrationId, {
                payment_status: 'paid'
            });
        }

        res.status(200).send('OK');

    } catch (error) {
        console.error('[PaymentAPI] Webhook Error:', error.message);
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
        console.error(`[PaymentAPI] Failed to update transaction ${id}:`, error.message);
    }
}

async function updateDirectusRegistration(id, data) {
    try {
        await axios.patch(`${DIRECTUS_URL}/items/inschrijvingen/${id}`, data, getAuthConfig());
    } catch (error) {
        console.error(`[PaymentAPI] Failed to update registration ${id}:`, error.message);
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