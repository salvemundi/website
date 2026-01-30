const axios = require('axios');

const getAuthConfig = (token) => ({
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
});

async function getTransaction(url, token, id) {
    const response = await axios.get(`${url}/items/transactions/${id}`, getAuthConfig(token));
    return response.data.data;
}

async function updateDirectusTransaction(url, token, id, data) {
    await axios.patch(`${url}/items/transactions/${id}`, data, getAuthConfig(token));
}

async function updateDirectusItem(url, token, collection, id, data) {
    const path = collection === 'users' ? `/users/${id}` : `/items/${collection}/${id}`;
    const response = await axios.patch(`${url}${path}`, data, getAuthConfig(token));
    return response.data;
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
    const response = await axios.post(`${url}/users`, payload, getAuthConfig(token));
    return response.data.data;
}

async function getUser(url, token, userId, fields = '*') {
    const response = await axios.get(`${url}/users/${userId}?fields=${fields}`, getAuthConfig(token));
    return response.data.data;
}

async function getUserByEmail(url, token, email) {
    const response = await axios.get(`${url}/users?filter[email][_eq]=${encodeURIComponent(email)}&fields=id,entra_id,first_name,last_name`, getAuthConfig(token));
    return response.data.data?.[0];
}

module.exports = {
    getTransaction,
    updateDirectusTransaction,
    updateDirectusItem,
    createDirectusUser,
    getUser,
    getUserByEmail
};
