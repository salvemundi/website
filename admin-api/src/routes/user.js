const express = require('express');
const axios = require('axios');
const directusService = require('../services/directus');

const router = express.Router();

const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_API_TOKEN = process.env.DIRECTUS_API_TOKEN;
const MEMBERSHIP_API_URL = process.env.MEMBERSHIP_API_URL;
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

const INTERNAL_HEADERS = {
    'x-api-key': INTERNAL_API_KEY,
    'Content-Type': 'application/json'
};

// ============================================
// INPUT VALIDATION & SANITIZATION
// ============================================

/**
 * Sanitize string input to prevent injection attacks
 * - Remove control characters
 * - Limit length
 * - Strip potential script/SQL injection patterns
 */
function sanitizeString(input, maxLength = 255) {
    if (typeof input !== 'string') return null;

    // Trim and limit length
    let sanitized = input.trim().substring(0, maxLength);

    // Remove control characters (except newline, tab)
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Block potential injection patterns
    const dangerousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,  // onclick=, onerror=, etc.
        /\$\{/,        // Template literal injection
        /\{\{/,        // Template injection
        /--/,          // SQL comment
        /;.*(?:DROP|DELETE|UPDATE|INSERT|SELECT|UNION)/i,  // SQL injection
    ];

    for (const pattern of dangerousPatterns) {
        if (pattern.test(sanitized)) {
            console.warn(`[UserAPI] Blocked dangerous input pattern: ${pattern}`);
            return null;
        }
    }

    return sanitized;
}

/**
 * Validate phone number format
 * Accepts international format: +31612345678, 0612345678, etc.
 */
function validatePhoneNumber(phone) {
    if (!phone || typeof phone !== 'string') return null;

    // Remove all spaces, dashes, parentheses
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');

    // Must be 6-20 digits, optionally starting with +
    const phoneRegex = /^\+?[0-9]{6,20}$/;

    if (!phoneRegex.test(cleaned)) {
        return null;
    }

    return cleaned;
}

/**
 * Validate date of birth format (YYYY-MM-DD)
 * Also validates reasonable date range (not in future, not too old)
 */
function validateDateOfBirth(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return null;

    // Strict format check: YYYY-MM-DD
    const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
    const match = dateStr.match(dateRegex);

    if (!match) return null;

    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);

    // Validate ranges
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;

    // Create date object to validate it's a real date
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return null; // Invalid date like Feb 30
    }

    const now = new Date();
    const minYear = now.getFullYear() - 120; // Max 120 years old
    const maxYear = now.getFullYear();       // Can't be born in future

    if (year < minYear || year > maxYear) return null;
    if (date > now) return null; // Can't be born in the future

    return dateStr;
}

/**
 * Validate Minecraft username
 * Official rules: 3-16 characters, only letters, numbers, and underscores
 */
function validateMinecraftUsername(username) {
    if (!username || typeof username !== 'string') return null;

    const cleaned = username.trim();

    // Minecraft usernames: 3-16 chars, alphanumeric + underscore
    const mcRegex = /^[a-zA-Z0-9_]{3,16}$/;

    if (!mcRegex.test(cleaned)) {
        return null;
    }

    return cleaned;
}

// ============================================
// ROUTES
// ============================================

/**
 * Update user's phone number
 * POST /api/user/update-phone-number
 * Body: { phone_number: string }
 */
router.post('/update-phone-number', async (req, res) => {
    try {
        const rawPhoneNumber = req.body?.phone_number;
        const user = req.user;

        // Validate and sanitize input
        const phone_number = validatePhoneNumber(rawPhoneNumber);
        if (!phone_number) {
            console.warn(`[UserAPI] Invalid phone number from user ${user.id}: ${rawPhoneNumber}`);
            return res.status(400).json({ error: 'Invalid phone number format. Use format: +31612345678 or 0612345678' });
        }

        // Update Directus using admin token
        await directusService.updateDirectusItem(DIRECTUS_URL, DIRECTUS_API_TOKEN, 'users', user.id, {
            phone_number
        });

        // Update Azure AD if user has entra_id
        if (user.entra_id && MEMBERSHIP_API_URL && INTERNAL_API_KEY) {
            try {
                await axios.post(`${MEMBERSHIP_API_URL}/update-attributes`, {
                    user_id: user.entra_id,
                    phone_number
                }, { headers: INTERNAL_HEADERS, timeout: 10000 });
            } catch (azureError) {
                console.error('[UserAPI] Error updating Azure AD phone_number:', azureError.message);
                // Don't fail the request - Directus was updated
            }
        }

        res.json({ success: true });
    } catch (error) {
        console.error('[UserAPI] Error updating phone number:', error.message);
        res.status(500).json({ error: 'Failed to update phone number' });
    }
});

/**
 * Update user's date of birth
 * POST /api/user/update-date-of-birth
 * Body: { date_of_birth: string }
 */
router.post('/update-date-of-birth', async (req, res) => {
    try {
        const rawDateOfBirth = req.body?.date_of_birth;
        const user = req.user;

        // Validate and sanitize input
        const date_of_birth = validateDateOfBirth(rawDateOfBirth);
        if (!date_of_birth) {
            console.warn(`[UserAPI] Invalid date of birth from user ${user.id}: ${rawDateOfBirth}`);
            return res.status(400).json({ error: 'Invalid date format. Use format: YYYY-MM-DD' });
        }

        // Update Directus using admin token
        await directusService.updateDirectusItem(DIRECTUS_URL, DIRECTUS_API_TOKEN, 'users', user.id, {
            date_of_birth
        });

        // Update Azure AD if user has entra_id
        if (user.entra_id && MEMBERSHIP_API_URL && INTERNAL_API_KEY) {
            try {
                await axios.post(`${MEMBERSHIP_API_URL}/update-attributes`, {
                    user_id: user.entra_id,
                    date_of_birth
                }, { headers: INTERNAL_HEADERS, timeout: 10000 });
            } catch (azureError) {
                console.error('[UserAPI] Error updating Azure AD date_of_birth:', azureError.message);
                // Don't fail the request - Directus was updated
            }
        }

        res.json({ success: true });
    } catch (error) {
        console.error('[UserAPI] Error updating date of birth:', error.message);
        res.status(500).json({ error: 'Failed to update date of birth' });
    }
});

/**
 * Update user's Minecraft username
 * POST /api/user/update-minecraft
 * Body: { minecraft_username: string }
 */
router.post('/update-minecraft', async (req, res) => {
    try {
        const rawMinecraftUsername = req.body?.minecraft_username;
        const user = req.user;

        // Validate and sanitize input
        const minecraft_username = validateMinecraftUsername(rawMinecraftUsername);
        if (!minecraft_username) {
            console.warn(`[UserAPI] Invalid Minecraft username from user ${user.id}: ${rawMinecraftUsername}`);
            return res.status(400).json({ error: 'Invalid Minecraft username. Must be 3-16 characters, letters, numbers, and underscores only.' });
        }

        // Update Directus using admin token (Minecraft is not synced to Azure AD)
        await directusService.updateDirectusItem(DIRECTUS_URL, DIRECTUS_API_TOKEN, 'users', user.id, {
            minecraft_username
        });

        res.json({ success: true });
    } catch (error) {
        console.error('[UserAPI] Error updating Minecraft username:', error.message);
        res.status(500).json({ error: 'Failed to update Minecraft username' });
    }
});

module.exports = router;
