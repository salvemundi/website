// payment-api/services/directus-service.js

const axios = require('axios');


function getAuthConfig(directusToken) {
    return {
        headers: {
            'Authorization': `Bearer ${directusToken}`,
            'Content-Type': 'application/json'
        }
    };
}


async function createDirectusTransaction(directusUrl, directusToken, data) {
    try {
        const response = await axios.post(`${directusUrl}/items/transactions`, data, getAuthConfig(directusToken));
        return response.data.data.id;
    } catch (error) {
        throw new Error(`Directus Create Failed: ${error.response?.data?.errors?.[0]?.message || error.message}`);
    }
}


async function createDirectusUser(directusUrl, directusToken, userData) {
    try {
        const payload = {
            email: userData.email,
            first_name: userData.first_name,
            last_name: userData.last_name,
            phone_number: userData.phone_number || null,
            date_of_birth: userData.date_of_birth || null,
            password: userData.password || (Math.random().toString(36).slice(-10)),
            status: userData.status || 'active'
        };

        const response = await axios.post(`${directusUrl}/users`, payload, getAuthConfig(directusToken));
        // Return full created object when possible
        return response.data.data;
    } catch (error) {
        console.error(`Failed to create Directus user ${userData.email}:`, error.response?.data || error.message);
        throw error;
    }
}


async function updateDirectusTransaction(directusUrl, directusToken, id, data) {
    try {
        await axios.patch(`${directusUrl}/items/transactions/${id}`, data, getAuthConfig(directusToken));
    } catch (error) {
        console.error(`Failed to update transaction ${id}:`, error.message);
        throw error;
    }
}


async function updateDirectusRegistration(directusUrl, directusToken, id, data) {
    try {
        await axios.patch(`${directusUrl}/items/event_signups/${id}`, data, getAuthConfig(directusToken));
    } catch (error) {
        console.error(`Failed to update registration ${id}:`, error.message);
        throw error;
    }
}


async function createDirectusItem(directusUrl, directusToken, collection, data) {
    try {
        console.log(`[DirectusService] Creating item in ${collection} with data:`, JSON.stringify(data));
        const endpoint = collection === 'users' ? `${directusUrl}/users` : `${directusUrl}/items/${collection}`;
        const response = await axios.post(endpoint, data, getAuthConfig(directusToken));
        const createdId = response.data.data.id;
        console.log(`[DirectusService] ✅ Successfully created ${collection}/${createdId}`);
        return response.data.data;
    } catch (error) {
        console.error(`[DirectusService] ❌ Failed to create item in ${collection}:`, error.message);
        if (error.response) {
            console.error(`[DirectusService] Response status:`, error.response.status);
            console.error(`[DirectusService] Response data:`, JSON.stringify(error.response.data));
        }
        throw error;
    }
}


async function updateDirectusItem(directusUrl, directusToken, collection, id, data) {
    try {
        console.log(`[DirectusService] Updating ${collection}/${id} with data:`, JSON.stringify(data));
        const endpoint = collection === 'users' ? `${directusUrl}/users/${id}` : `${directusUrl}/items/${collection}/${id}`;
        const response = await axios.patch(endpoint, data, getAuthConfig(directusToken));
        console.log(`[DirectusService] ✅ Successfully updated ${collection}/${id}`);
        return response.data;
    } catch (error) {
        console.error(`[DirectusService] ❌ Failed to update ${collection} ${id}:`, error.message);
        if (error.response) {
            console.error(`[DirectusService] Response status:`, error.response.status);
            console.error(`[DirectusService] Response data:`, JSON.stringify(error.response.data));
        }
        throw error;
    }
}


async function getDirectusRegistration(directusUrl, directusToken, id) {
    try {
        const response = await axios.get(`${directusUrl}/items/event_signups/${id}?fields=qr_token,participant_name`, getAuthConfig(directusToken));
        return response.data.data;
    } catch (error) {
        console.error(`Failed to fetch registration ${id}:`, error.message);
        throw error;
    }
}


async function getDirectusItem(directusUrl, directusToken, collection, id, fields = '*') {
    try {
        const response = await axios.get(`${directusUrl}/items/${collection}/${id}?fields=${fields}`, getAuthConfig(directusToken));
        return response.data.data;
    } catch (error) {
        console.error(`Failed to fetch ${collection} ${id}:`, error.message);
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Data:`, JSON.stringify(error.response.data));
        }
        return null;
    }
}


async function getUser(directusUrl, directusToken, userId, fields = '*') {
    try {
        const response = await axios.get(`${directusUrl}/users/${userId}?fields=${fields}`, getAuthConfig(directusToken));
        return response.data.data;
    } catch (error) {
        console.error(`Failed to fetch user ${userId}:`, error.message);
        return null;
    }
}


async function getUserByEmail(directusUrl, directusToken, email) {
    try {
        const query = new URLSearchParams({
            'filter[email][_eq]': email,
            'fields': 'id,email'
        }).toString();
        const response = await axios.get(`${directusUrl}/users?${query}`, getAuthConfig(directusToken));
        return response.data.data?.[0] || null;
    } catch (error) {
        console.error(`Failed to fetch user by email ${email}:`, error.message);
        return null;
    }
}


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
 * Fetch selected activities for a trip signup
 */
async function getTripSignupActivities(directusUrl, directusToken, signupId) {
    try {
        const params = new URLSearchParams();
        params.append('filter[trip_signup_id][_eq]', String(signupId));
        params.append('fields', 'id,selected_options,trip_activity_id.*');

        const url = `${directusUrl}/items/trip_signup_activities?${params.toString()}`;
        const response = await axios.get(url, getAuthConfig(directusToken));
        return response.data.data;
    } catch (error) {
        console.error(`Failed to fetch trip_signup_activities for ${signupId}:`, error.response?.data || error.message);
        throw error;
    }
}

/**
 * Zoekt een coupon op basis van de coupon code.
 */
async function getCoupon(directusUrl, directusToken, code, traceId = 'no-trace') {
    try {
        const query = new URLSearchParams({
            'filter[coupon_code][_eq]': code
        }).toString();

        const url = `${directusUrl}/items/coupons?${query}`;
        console.warn(`[Coupon][${traceId}] Directus Fetch URL: ${url}`);

        const response = await axios.get(url, getAuthConfig(directusToken));
        const results = response.data.data;

        if (results && results.length > 0) {
            const coupon = results[0];
            console.warn(`[Coupon][${traceId}] Success! Found coupon: ${coupon.id}, Code: ${coupon.coupon_code}, Active: ${coupon.is_active}`);
            return coupon;
        }

        console.warn(`[Coupon][${traceId}] Coupon "${code}" NOT FOUND in Directus.`);
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
        const params = new URLSearchParams();
        params.append('filter[user_id][_eq]', userId);

        if (committeeName) {
            params.append('filter[committee_id][name][_eq]', committeeName);
        }

        params.append('fields', 'id');

        const query = params.toString();

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
    createDirectusUser,
    updateDirectusTransaction,
    updateDirectusRegistration,
    createDirectusItem,
    updateDirectusItem,
    getDirectusRegistration,
    getDirectusItem,
    getTransaction,
    getTripSignupActivities,
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

    checkUserCommittee,
    getUser,
    getUserByEmail
};
