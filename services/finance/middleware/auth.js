const jwt = require('jsonwebtoken');

/**
 * Middleware to enforce JWT-based service authentication.
 * Checks for Bearer token in Authorization header and validates issuer.
 */
const requireServiceAuth = (allowedIssuers = ['frontend']) => {
    return (req, res, next) => {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.warn(`[${req.id || 'system'}] ⚠️ Missing or invalid Authorization header`);
            return res.status(401).json({ error: 'Unauthorized: Missing token' });
        }

        const token = authHeader.split(' ')[1];
        const secret = process.env.SERVICE_SECRET;

        if (!secret) {
            console.error(`[${req.id || 'system'}] ❌ SERVICE_SECRET is not configured`);
            return res.status(500).json({ error: 'Server security configuration error' });
        }

        try {
            const decoded = jwt.verify(token, secret);

            // Verify issuer
            if (allowedIssuers && !allowedIssuers.includes(decoded.iss)) {
                console.warn(`[${req.id || 'system'}] ⚠️ Forbidden issuer: ${decoded.iss}`);
                return res.status(403).json({ error: 'Forbidden: Invalid issuer' });
            }

            req.service = decoded;
            next();
        } catch (err) {
            console.warn(`[${req.id || 'system'}] ⚠️ Invalid service token: ${err.message}`);
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }
    };
};

module.exports = requireServiceAuth;
