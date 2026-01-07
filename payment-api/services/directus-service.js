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
async function getCoupon(directusUrl, directusToken, code) {
    try {
        const query = new URLSearchParams({
            'filter[coupon_code][_eq]': code,
            'filter[is_active][_eq]': 'true'
        }).toString();

        const response = await axios.get(
            `${directusUrl}/items/coupons?${query}`,
            getAuthConfig(directusToken)
        );

        return response.data.data?.[0] || null;
    } catch (error) {
        console.error(`Failed to fetch coupon ${code}:`, error.message);
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
    getDirectusRegistration,
    getTransaction,
    getCoupon,
    updateCouponUsage,
    checkUserCommittee
};