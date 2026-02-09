const express = require('express');
const axios = require('axios');
const directusService = require('../services/directus');
const membershipService = require('../services/membership');

const router = express.Router();

const DIRECTUS_URL = process.env.DIRECTUS_URL;
const DIRECTUS_API_TOKEN = process.env.DIRECTUS_API_TOKEN;
const MEMBERSHIP_API_URL = process.env.MEMBERSHIP_API_URL;
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

const INTERNAL_HEADERS = {
    'x-api-key': INTERNAL_API_KEY,
    'Content-Type': 'application/json'
};

/**
 * Update user's phone number
 * POST /api/user/update-phone-number
 * Body: { phone_number: string }
 */
router.post('/update-phone-number', async (req, res) => {
    try {
        const { phone_number } = req.body;
        const user = req.user;

        if (!phone_number) {
            return res.status(400).json({ error: 'Phone number is required' });
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
        const { date_of_birth } = req.body;
        const user = req.user;

        if (!date_of_birth) {
            return res.status(400).json({ error: 'Date of birth is required' });
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
        const { minecraft_username } = req.body;
        const user = req.user;

        if (!minecraft_username) {
            return res.status(400).json({ error: 'Minecraft username is required' });
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
