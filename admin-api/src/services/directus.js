const axios = require('axios');
const util = require('util');

const getAuthConfig = (token) => ({
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
});

async function getTransaction(url, token, id) {
    try {
        const response = await axios.get(`${url}/items/transactions/${id}`, getAuthConfig(token));
        return response.data.data;
    } catch (err) {
        console.error('[Directus] getTransaction failed:', err.message || err);
        if (err.response) console.error('[Directus] Response data:', util.inspect(err.response.data, { depth: 3 }));
        throw err;
    }
}

async function updateDirectusTransaction(url, token, id, data) {
    try {
        await axios.patch(`${url}/items/transactions/${id}`, data, getAuthConfig(token));
    } catch (err) {
        console.error('[Directus] updateDirectusTransaction failed for', id, ':', err.message || err);
        if (err.response) console.error('[Directus] Response data:', util.inspect(err.response.data, { depth: 3 }));
        throw err;
    }
}

async function updateDirectusItem(url, token, collection, id, data) {
    const path = collection === 'users' ? `/users/${id}` : `/items/${collection}/${id}`;
    try {
        const response = await axios.patch(`${url}${path}`, data, getAuthConfig(token));
        return response.data;
    } catch (err) {
        console.error('[Directus] updateDirectusItem failed for', collection, id, ':', err.message || err);
        if (err.response) console.error('[Directus] Response data:', util.inspect(err.response.data, { depth: 3 }));
        throw err;
    }
}

async function createDirectusUser(url, token, userData) {
    const payload = {
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone_number: userData.phone_number || null,
        date_of_birth: userData.date_of_birth || null,
        password: userData.password || (Math.random().toString(36).slice(-10)),
        status: userData.status || 'active',
        entra_id: userData.entra_id,
        membership_status: userData.membership_status,
        membership_expiry: userData.membership_expiry
    };
    try {
        const response = await axios.post(`${url}/users`, payload, getAuthConfig(token));
        return response.data.data;
    } catch (err) {
        console.error('[Directus] createDirectusUser failed:', err.message || err);
        if (err.response) console.error('[Directus] Response data:', util.inspect(err.response.data, { depth: 3 }));
        throw err;
    }
}

async function getUser(url, token, userId, fields = '*') {
    try {
        const response = await axios.get(`${url}/users/${userId}?fields=${fields}`, getAuthConfig(token));
        return response.data.data;
    } catch (err) {
        console.error('[Directus] getUser failed for', userId, ':', err.message || err);
        if (err.response) console.error('[Directus] Response data:', util.inspect(err.response.data, { depth: 3 }));
        throw err;
    }
}

async function getUserByEmail(url, token, email) {
    try {
        const response = await axios.get(`${url}/users?filter[email][_eq]=${encodeURIComponent(email)}&fields=id,entra_id,first_name,last_name`, getAuthConfig(token));
        return response.data.data?.[0];
    } catch (err) {
        console.error('[Directus] getUserByEmail failed for', email, ':', err.message || err);
        if (err.response) console.error('[Directus] Response data:', util.inspect(err.response.data, { depth: 3 }));
        throw err;
    }
}

module.exports = {
    getTransaction,
    updateDirectusTransaction,
    updateDirectusItem,
    createDirectusUser,
    getUser,
    getUserByEmail
};
