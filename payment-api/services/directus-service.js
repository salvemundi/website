// payment-api/services/directus-service.js

const axios = require('axios');

/**
 * Genereert de authenticatieheader voor Directus
 */
function getAuthConfig(directusToken) {
    return {
        headers: {
            'Authorization': `Bearer ${directusToken}`,
            'Content-Type': 'application/json'
        }
    };
}

/**
 * Maakt een nieuwe transactie aan in Directus.
 */
async function createDirectusTransaction(directusUrl, directusToken, data) {
    try {
        const response = await axios.post(`${directusUrl}/items/transactions`, data, getAuthConfig(directusToken));
        return response.data.data.id;
    } catch (error) {
        throw new Error(`Directus Create Failed: ${error.response?.data?.errors?.[0]?.message || error.message}`);
    }
}

/**
 * Werkt een bestaande transactie bij (bijv. de Mollie ID of status).
 */
async function updateDirectusTransaction(directusUrl, directusToken, id, data) {
    try {
        await axios.patch(`${directusUrl}/items/transactions/${id}`, data, getAuthConfig(directusToken));
    } catch (error) {
        console.error(`Failed to update transaction ${id}:`, error.message);
        throw error;
    }
}

/**
 * Werkt een registratie bij (bijv. payment_status).
 */
async function updateDirectusRegistration(directusUrl, directusToken, id, data) {
    try {
        await axios.patch(`${directusUrl}/items/event_signups/${id}`, data, getAuthConfig(directusToken));
    } catch (error) {
        console.error(`Failed to update registration ${id}:`, error.message);
        throw error;
    }
}

/**
 * Werkt een willekeurig item bij in Directus.
 */
async function updateDirectusItem(directusUrl, directusToken, collection, id, data) {
    try {
        await axios.patch(`${directusUrl}/items/${collection}/${id}`, data, getAuthConfig(directusToken));
    } catch (error) {
        console.error(`Failed to update ${collection} ${id}:`, error.message);
        throw error;
    }
}

// Functie om een registratie op te halen (nodig om de qr_token en de naam te lezen).
async function getDirectusRegistration(directusUrl, directusToken, id) {
    try {
        const response = await axios.get(`${directusUrl}/items/event_signups/${id}?fields=qr_token,participant_name`, getAuthConfig(directusToken));
        return response.data.data;
    } catch (error) {
        console.error(`Failed to fetch registration ${id}:`, error.message);
        return null;
    }
}

/**
 * Haalt een willekeurig item op uit Directus.
 */
async function getDirectusItem(directusUrl, directusToken, collection, id, fields = '*') {
    try {
        const response = await axios.get(`${directusUrl}/items/${collection}/${id}?fields=${fields}`, getAuthConfig(directusToken));
        return response.data.data;
    } catch (error) {
        console.error(`Failed to fetch ${collection} ${id}:`, error.message);
        return null;
    }
}

/**
 * Haalt een transactie op uit Directus.
 */
async function getTransaction(directusUrl, directusToken, id) {
    try {
        const response = await axios.get(
            `${directusUrl}/items/transactions/${id}`,
            getAuthConfig(directusToken)
        );
        return response.data.data;
    } catch (error) {
        console.error(`Failed to fetch transaction ${id}:`, error.message);
        return null;
    }
}

/**
 * Zoekt een coupon op basis van de coupon code.
 */
async function getCoupon(directusUrl, directusToken, code, traceId = 'no-trace') {
    try {
        // Step 1: Normal lookup with filters
        const query = new URLSearchParams({
            'filter[coupon_code][_eq]': code,
            'filter[is_active][_eq]': 'true'
        }).toString();

        const url = `${directusUrl}/items/coupons?${query}`;
        console.warn(`[Coupon][${traceId}] Directus Fetch URL: ${url}`);

        const response = await axios.get(url, getAuthConfig(directusToken));
        const results = response.data.data;

        if (results && results.length > 0) {
            console.warn(`[Coupon][${traceId}] Success! Found active coupon: ${results[0].id}`);
            return results[0];
        }

        // Step 2: Diagnostic lookup - find it even if inactive to see WHY it failed
        console.warn(`[Coupon][${traceId}] No active coupon found. Running diagnostic lookup for code: "${code}"`);
        const diagQuery = new URLSearchParams({
            'filter[coupon_code][_eq]': code
        }).toString();
        const diagUrl = `${directusUrl}/items/coupons?${diagQuery}`;
        const diagResponse = await axios.get(diagUrl, getAuthConfig(directusToken));
        const diagResults = diagResponse.data.data;

        if (diagResults && diagResults.length > 0) {
            const c = diagResults[0];
            console.warn(`[Coupon][${traceId}] DIAGNOSTIC: Coupon found but filtered out! is_active: ${c.is_active} (Type: ${typeof c.is_active}). ID: ${c.id}`);
        } else {
            console.warn(`[Coupon][${traceId}] DIAGNOSTIC: Coupon "${code}" NOT FOUND in Directus at all! (No filter check). URL: ${diagUrl}`);
        }

        return null;
    } catch (error) {
        console.error(`[Coupon][${traceId}] Directus Fetch Failed:`, error.response?.data || error.message);
        return null;
    }
}

/**
 * Werkt de usage_count van een coupon bij.
 */
async function updateCouponUsage(directusUrl, directusToken, id, newCount) {
    try {
        await axios.patch(
            `${directusUrl}/items/coupons/${id}`,
            { usage_count: newCount },
            getAuthConfig(directusToken)
        );
    } catch (error) {
        console.error(`Failed to update coupon usage for ${id}:`, error.message);
        // We don't necessarily want to throw here if it's just a stat update, 
        // but for consistency let's log and rethrow if critical, 
        // or just leave it for now if strictness isn't required by caller.
        // Given existing usage, let's keep it safe but maybe valid for future.
        // The user asked about rejection, which uses updateDirectusTransaction.
        // Let's stick to fixing the transaction/registration ones first.
        throw error;
    }
}

/**
 * Controleert of een gebruiker lid is van een specifieke commissie.
 * Als committeeName null is, checkt hij of de gebruiker in *een* commissie zit.
 */
async function checkUserCommittee(directusUrl, directusToken, userId, committeeName = null) {
    if (!userId) return false;

    try {
        let filter = {
            'user_id': { '_eq': userId }
        };

        if (committeeName) {
            // We moeten eerst de committee ID vinden op basis van de naam, 
            // of we gaan er vanuit dat de caller de ID weet. 
            // Voor nu, makkelijker: we checken of de opgehaalde rows een user hebben.
            // Complexere query: filter[committee_id][name][_eq] = committeeName
            filter['committee_id'] = { 'name': { '_eq': committeeName } };
        }

        const query = new URLSearchParams({
            'filter': JSON.stringify(filter),
            'fields': 'id'
        }).toString();

        const response = await axios.get(
            `${directusUrl}/items/committee_members?${query}`,
            getAuthConfig(directusToken)
        );

        return response.data.data.length > 0;
    } catch (error) {
        console.error(`Failed to check committee for user ${userId}:`, error.message);
        return false;
    }
}

module.exports = {
    createDirectusTransaction,
    updateDirectusTransaction,
    updateDirectusRegistration,
    updateDirectusItem,
    getDirectusRegistration,
    getDirectusItem,
    getTransaction,
    getCoupon,
    updateCouponUsage,
    // --- Payment Settings (via Site Settings) ---

    getPaymentSettings: async (directusUrl, token) => {
        try {
            // We piggyback on site_settings with page='payment_settings'
            // The actual config is stored as JSON in 'disabled_message'
            const query = new URLSearchParams({
                'filter[page][_eq]': 'payment_settings',
                'limit': '1'
            }).toString();

            const response = await axios.get(`${directusUrl}/items/site_settings?${query}`, getAuthConfig(token));

            const data = response.data;
            if (data.data && data.data.length > 0) {
                const settingsStr = data.data[0].disabled_message;
                try {
                    return JSON.parse(settingsStr) || { manual_approval: false };
                } catch (e) {
                    return { manual_approval: false };
                }
            }

            return { manual_approval: false };
        } catch (error) {
            console.error('Error fetching settings:', error.message);
            // Non-critical, return default
            return { manual_approval: false };
        }
    },

    updatePaymentSettings: async (directusUrl, token, settings) => {
        try {
            // First check if it exists
            const query = new URLSearchParams({
                'filter[page][_eq]': 'payment_settings',
                'limit': '1'
            }).toString();

            let existingId = null;
            try {
                const getRes = await axios.get(`${directusUrl}/items/site_settings?${query}`, getAuthConfig(token));
                const getData = getRes.data;
                existingId = (getData.data && getData.data.length > 0) ? getData.data[0].id : null;
            } catch (err) {
                console.warn('GET existing settings check failed, assuming distinct or error:', err.message);
            }

            const payload = {
                page: 'payment_settings',
                // We reuse disabled_message field to store our JSON config
                disabled_message: JSON.stringify(settings)
            };

            if (existingId) {
                await axios.patch(`${directusUrl}/items/site_settings/${existingId}`, payload, getAuthConfig(token));
            } else {
                await axios.post(`${directusUrl}/items/site_settings`, payload, getAuthConfig(token));
            }
            return settings;
        } catch (error) {
            console.error('Error updating settings FULL:', error.response?.data || error.message);
            throw new Error(`Failed to update settings: ${error.message}`);
        }
    },

    checkUserCommittee
};