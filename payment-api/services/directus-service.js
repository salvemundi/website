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

module.exports = {
    createDirectusTransaction,
    updateDirectusTransaction,
    updateDirectusRegistration,
    getDirectusRegistration,
    getTransaction
};