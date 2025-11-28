const express = require('express');
const cors = require('cors');
const { createMollieClient } = require('@mollie/api-client');
require('dotenv').config();

// Service en Route Imports (bootstrapping)
const directusService = require('./services/directus-service');
const notificationService = require('./services/notification-service');
const paymentRoutes = require('./routes/payments'); // <-- De geïsoleerde routes

const app = express();

// --- CONFIGURATIE & CHECKS (Essentials) ---
const PORT = process.env.PORT;
const DIRECTUS_URL = process.env.DIRECTUS_URL;
const WEBHOOK_URL = process.env.MOLLIE_WEBHOOK_URL;
const MOLLIE_API_KEY = process.env.MOLLIE_API_KEY;
const DIRECTUS_API_TOKEN = process.env.DIRECTUS_API_TOKEN;
const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'http://email-api:3001';

console.log("--- STARTUP CONFIG CHECK ---");
console.log(`PORT: ${PORT}`);
// ... (Hier horen de rest van je console.log checks) ...

if (!PORT || !DIRECTUS_URL || !WEBHOOK_URL || !MOLLIE_API_KEY || !DIRECTUS_API_TOKEN) {
    console.error('❌ FATAL ERROR: Een of meer environment variabelen ontbreken!');
    process.exit(1);
}

const mollieClient = createMollieClient({ apiKey: MOLLIE_API_KEY });

// --- MIDDLEWARE CONFIGURATIE ---
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
            console.warn(`Blocked CORS origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    }
}));

// --- ROUTES (Mounting) ---
// We 'mounten' de payments router op het pad /api/payments
// En injecteren alle benodigde objecten/configuratie
app.use(
    '/api/payments', 
    paymentRoutes(
        mollieClient, 
        DIRECTUS_URL, 
        DIRECTUS_API_TOKEN, 
        EMAIL_SERVICE_URL, 
        directusService, 
        notificationService
    )
);


// --- SERVER START ---
app.listen(PORT, () => {
    console.info(`[PaymentAPI] Server running on port ${PORT}`);
});