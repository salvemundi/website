const express = require('express');
const cors = require('cors');
const axios = require('axios');
const adminRoutes = require('./routes/admin');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3005;
const DIRECTUS_URL = process.env.DIRECTUS_URL;

app.use(cors());
app.use(express.json());

/**
 * Middleware: require admin access (user must have entra_id)
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

        // Only users with entra_id (Fontys accounts) are admins
        if (!user.entra_id) {
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

// Admin routes (protected)
app.use('/api/admin', requireAdmin, adminRoutes);

app.listen(PORT, () => {
    console.log(`[AdminAPI] Running on port ${PORT}`);
});
