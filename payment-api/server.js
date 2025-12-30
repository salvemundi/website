const express = require('express');
const cors = require('cors');
const { createMollieClient } = require('@mollie/api-client');
require('dotenv').config();

const directusService = require('./services/directus-service');
const notificationService = require('./services/notification-service');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin-routes');
const membershipService = require('./services/membership-service');

const app = express();

const PORT = process.env.PORT;
const DIRECTUS_URL = process.env.DIRECTUS_URL;
const WEBHOOK_URL = process.env.MOLLIE_WEBHOOK_URL;
const MOLLIE_API_KEY = process.env.MOLLIE_API_KEY;
const DIRECTUS_API_TOKEN = process.env.DIRECTUS_API_TOKEN;
const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'http://email-api:3001';
const MEMBERSHIP_API_URL = process.env.MEMBERSHIP_API_URL || 'http://membership-api:8000/api/membership';
const GRAPH_SYNC_URL = process.env.GRAPH_SYNC_URL || 'http://graph-sync:3001';

if (!PORT || !DIRECTUS_URL || !WEBHOOK_URL || !MOLLIE_API_KEY || !DIRECTUS_API_TOKEN) {
    console.error('FATAL ERROR: Missing environment variables');
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
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));

app.use(
    '/api/payments',
    paymentRoutes(
        mollieClient,
        DIRECTUS_URL,
        DIRECTUS_API_TOKEN,
        EMAIL_SERVICE_URL,
        MEMBERSHIP_API_URL,
        directusService,
        notificationService
    )
);

app.use(
    '/api/admin',
    adminRoutes(
        DIRECTUS_URL,
        DIRECTUS_API_TOKEN,
        EMAIL_SERVICE_URL,
        MEMBERSHIP_API_URL,
        directusService,
        notificationService,
        membershipService,
        GRAPH_SYNC_URL
    )
);

app.listen(PORT, () => { });