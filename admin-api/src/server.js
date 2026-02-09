const express = require('express');
const cors = require('cors');
const axios = require('axios');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');
const internalRoutes = require('./routes/internal');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3005;
const DIRECTUS_URL = process.env.DIRECTUS_URL;

app.use(cors());
app.use(express.json());

/**
 * Middleware: require internal API key
 */
function internalAuth(req, res, next) {
    const apiKey = req.headers['x-api-key'] || req.headers['x-internal-api-secret'];
    const validKey = process.env.INTERNAL_API_KEY;

    if (!validKey) {
        console.error('[AdminAPI] INTERNAL_API_KEY not set!');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    if (!apiKey || apiKey !== validKey) {
        console.warn(`[AdminAPI] Unauthorized internal access attempt from ${req.ip}`);
        return res.status(401).json({ error: 'Unauthorized' });
    }

    next();
}

/**
 * Middleware: require authenticated user (any user with valid token)
 */
async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    try {
        const response = await axios.get(`${DIRECTUS_URL}/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const user = response.data.data;

        if (!user || !user.id) {
            return res.status(401).json({ error: 'Invalid user' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('[AdminAPI Auth] Token verification failed:', error.message);
        return res.status(401).json({ error: 'Invalid token' });
    }
}

/**
 * Middleware: require admin access (user must have entra_id and be ICT/Bestuur)
 */
async function requireAdmin(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    try {
        const response = await axios.get(`${DIRECTUS_URL}/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const user = response.data.data;

        // Strictly verify that the user has an authorized role (ICT or Bestuur)
        // Role IDs can be configured via ADMIN_ROLE_IDS environment variable
        const authorizedRoles = process.env.ADMIN_ROLE_IDS
            ? process.env.ADMIN_ROLE_IDS.split(',')
            : [
                'd671fd7a-cfcb-4bdc-afb8-1a96bc2d5d50', // ICT / Admin (Default)
                'a0e51e23-15ef-4e04-a188-5c483484b0be'  // Bestuur (Default)
            ];

        const userRoleId = typeof user.role === 'object' ? user.role.id : (user.role || '');

        if (!user.entra_id || !authorizedRoles.includes(userRoleId)) {
            console.warn(`[AdminAPI Auth] Unauthorized access attempt by ${user.email} (Role: ${userRoleId})`);
            return res.status(403).json({ error: 'Admin access required' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('[AdminAPI Auth] Token verification failed:', error.message);
        return res.status(401).json({ error: 'Invalid token' });
    }
}

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'admin-api' }));

// User routes (authenticated users only)
app.use('/api/user', requireAuth, userRoutes);

// Admin routes (protected - ICT/Bestuur only)
app.use('/api/admin', requireAdmin, adminRoutes);

// Internal routes (protected - API Key only)
app.use('/api/internal', internalAuth, internalRoutes);

app.listen(PORT, () => {
    console.log(`[AdminAPI] Running on port ${PORT}`);
});
