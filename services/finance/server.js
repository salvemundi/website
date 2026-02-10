/**
 * Payment API
 * Environment Isolation Audit: 2025-12-31 (Permission Fix Re-run)
 */
const express = require('express');
const cors = require('cors');
const { createMollieClient } = require('@mollie/api-client');
require('dotenv').config();

const directusService = require('./services/directus-service');
const notificationService = require('./services/notification-service');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin-routes');
const couponRoutes = require('./routes/coupons');
const membershipService = require('./services/membership-service');

const requestLogger = require('./middleware/logger');
const requireServiceAuth = require('./middleware/auth');

const app = express();

const PORT = process.env.PORT;
const DIRECTUS_URL = process.env.DIRECTUS_URL;
const WEBHOOK_URL = process.env.MOLLIE_WEBHOOK_URL;
const MOLLIE_API_KEY = process.env.FINANCE_MOLLIE_KEY;
const DIRECTUS_API_TOKEN = process.env.DIRECTUS_ADMIN_TOKEN;
const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL;
const MEMBERSHIP_API_URL = process.env.MEMBERSHIP_API_URL;
const GRAPH_SYNC_URL = process.env.GRAPH_SYNC_URL;

const isProduction = process.env.NODE_ENV === 'production';

if (!PORT || !DIRECTUS_URL || !DIRECTUS_API_TOKEN) {
    console.error('FATAL ERROR: Missing critical environment variables (PORT, DIRECTUS_URL, DIRECTUS_ADMIN_TOKEN)');
    process.exit(1);
}

if (isProduction && (!WEBHOOK_URL || !MOLLIE_API_KEY)) {
    console.error('FATAL ERROR: Missing production environment variables (MOLLIE_WEBHOOK_URL, FINANCE_MOLLIE_KEY)');
    process.exit(1);
}

const mollieClient = MOLLIE_API_KEY ? createMollieClient({ apiKey: MOLLIE_API_KEY }) : null;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply tracing/logging globally
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// API Key Middleware
const apiKeyAuth = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.headers['x-internal-api-secret'];
    const validApiKey = process.env.SERVICE_SECRET;

    if (!validApiKey) {
        console.error('❌ [payment-api] SERVICE_SECRET is not set!');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    if (!apiKey || apiKey !== validApiKey) {
        console.warn(`⚠️ [payment-api] Unauthorized access attempt from ${req.ip} to ${req.path}`);
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// Apply auth to admin and internal trip email routes
// Updated to use Service-to-Service JWT Auth
app.use('/api/admin', requireServiceAuth(['frontend', 'admin-api']));
app.use('/trip-email', requireServiceAuth(['frontend']));
// /api/coupons/validate should be public, but we can protect other coupon routes if they existed.
// Since only /validate exists, we'll keep it public for now or apply auth selectively.

const envAllowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
const allowedOrigins = [
    ...envAllowedOrigins,
    'https://dev.salvemundi.nl',
    'https://salvemundi.nl',
    'https://preprod.salvemundi.nl'
];

if (process.env.NODE_ENV !== 'production') {
    allowedOrigins.push('http://localhost:5173');
}

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
        notificationService,
        GRAPH_SYNC_URL,
        membershipService,
        process.env.ADMIN_API_URL
    )
);

app.use(
    '/api/admin',
    adminRoutes(
        DIRECTUS_URL,
        DIRECTUS_API_TOKEN,
        directusService
    )
);

// Add coupon routes
app.use(
    '/api/coupons',
    couponRoutes(
        directusService,
        DIRECTUS_URL,
        DIRECTUS_API_TOKEN
    )
);

// Trip email route
app.post('/trip-email/send-bulk', async (req, res) => {
    try {
        let { emailServiceUrl, tripName, recipients, subject, message } = req.body;

        // Prefer server-side configured EMAIL_SERVICE_URL when available.
        // Some callers (like the frontend) may forward a URL that points to localhost
        // which is unreachable from this service in production. Use the environment
        // value as a reliable default.
        emailServiceUrl = emailServiceUrl || EMAIL_SERVICE_URL || 'http://localhost:3001';

        if (!emailServiceUrl || !tripName || !recipients || !subject || !message) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        console.log(`[PaymentAPI] trip-email: forwarding to email service at ${emailServiceUrl}`);

        const result = await notificationService.sendTripBulkEmail(
            emailServiceUrl,
            recipients,
            subject,
            message,
            tripName
        );

        if (result.success) {
            return res.json({ success: true, count: result.count });
        } else {
            return res.status(500).json({ error: result.error });
        }
    } catch (error) {
        console.error('Error in trip email bulk send:', error);
        return res.status(500).json({ error: error.message || 'Failed to send bulk email' });
    }
});

// Trip status update email route
app.post('/trip-email/status-update', async (req, res) => {
    try {
        let { emailServiceUrl, directusUrl, signupId, tripId, newStatus, oldStatus } = req.body;

        emailServiceUrl = emailServiceUrl || EMAIL_SERVICE_URL || 'http://localhost:3001';
        directusUrl = directusUrl || DIRECTUS_URL;

        if (!emailServiceUrl || !directusUrl || !signupId || !tripId || !newStatus) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        console.log(`[PaymentAPI] trip-email status-update: loading signup ${signupId} and trip ${tripId}`);

        // Fetch signup and trip data
        const tripSignup = await directusService.getDirectusItem(
            directusUrl,
            DIRECTUS_API_TOKEN,
            'trip_signups',
            signupId,
            'id,first_name,middle_name,last_name,email,role,status'
        );

        const trip = await directusService.getDirectusItem(
            directusUrl,
            DIRECTUS_API_TOKEN,
            'trips',
            tripId,
            'id,name,event_date,base_price,deposit_amount,crew_discount'
        );

        if (!tripSignup || !trip) {
            return res.status(404).json({ error: 'Signup or trip not found' });
        }

        console.log(`[PaymentAPI] Sending status update email to ${tripSignup.email}`);

        await notificationService.sendTripStatusUpdate(
            emailServiceUrl,
            tripSignup,
            trip,
            newStatus,
            oldStatus
        );

        return res.json({ success: true });
    } catch (error) {
        console.error('Error in trip status update email:', error);
        return res.status(500).json({ error: error.message || 'Failed to send status update email' });
    }
});

// Trip payment request email route (aanbetaling/restbetaling)
app.post('/trip-email/payment-request', async (req, res) => {
    try {
        let { emailServiceUrl, directusUrl, signupId, tripId, paymentType } = req.body;

        emailServiceUrl = emailServiceUrl || EMAIL_SERVICE_URL || 'http://localhost:3001';
        directusUrl = directusUrl || DIRECTUS_URL;

        if (!emailServiceUrl || !directusUrl || !signupId || !tripId || !paymentType) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!['deposit', 'final'].includes(paymentType)) {
            return res.status(400).json({ error: 'Invalid payment type. Must be "deposit" or "final"' });
        }

        console.log(`[PaymentAPI] trip-email payment-request: loading signup ${signupId} and trip ${tripId}`);

        // Fetch signup and trip data
        const tripSignup = await directusService.getDirectusItem(
            directusUrl,
            DIRECTUS_API_TOKEN,
            'trip_signups',
            signupId,
            'id,first_name,middle_name,last_name,email,role,status,deposit_paid,full_payment_paid'
        );

        const trip = await directusService.getDirectusItem(
            directusUrl,
            DIRECTUS_API_TOKEN,
            'trips',
            tripId,
            'id,name,event_date,base_price,deposit_amount,crew_discount,is_bus_trip'
        );

        if (!tripSignup || !trip) {
            return res.status(404).json({ error: 'Signup or trip not found' });
        }

        // Validate payment status
        if (paymentType === 'deposit' && tripSignup.deposit_paid) {
            return res.status(400).json({ error: 'Deposit already paid' });
        }

        if (paymentType === 'final' && (!tripSignup.deposit_paid || tripSignup.full_payment_paid)) {
            return res.status(400).json({ error: 'Cannot request final payment: deposit not paid or already fully paid' });
        }

        console.log(`[PaymentAPI] Sending ${paymentType} payment request email to ${tripSignup.email}`);

        await notificationService.sendTripPaymentRequest(
            emailServiceUrl,
            tripSignup,
            trip,
            paymentType
        );

        return res.json({ success: true });
    } catch (error) {
        console.error('Error in trip payment request email:', error);
        return res.status(500).json({ error: error.message || 'Failed to send payment request email' });
    }
});

app.listen(PORT, () => {
    console.log(`[PaymentAPI] Server running on port ${PORT}`);

    // Diagnostic logging for Directus Token
    const maskedToken = DIRECTUS_API_TOKEN
        ? `${DIRECTUS_API_TOKEN.substring(0, 4)}...${DIRECTUS_API_TOKEN.slice(-4)}`
        : 'MISSING';
    console.log(`[PaymentAPI] Environment: DIRECTUS_URL=${DIRECTUS_URL ? 'Set' : 'Unset'}, Token=${maskedToken}, MEMBERSHIP=${MEMBERSHIP_API_URL}`);
    console.log(`[PaymentAPI] CORS origins configured:`, allowedOrigins);
});

// Global error handlers to diagnose silent crashes
process.on('uncaughtException', (err) => {
    console.error('[PaymentAPI] FATAL: Uncaught Exception:', err);
    // Give it a second to flush logs before exit
    setTimeout(() => process.exit(1), 1000);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[PaymentAPI] POST-DEPLOY DEBUG: Unhandled Rejection at:', promise, 'reason:', reason);
});