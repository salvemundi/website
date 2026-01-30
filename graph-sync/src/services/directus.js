import axios from 'axios';

const getAuthConfig = (token) => ({
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
});

export const getTransaction = async (url, token, id) => {
    const response = await axios.get(`${url}/items/transactions/${id}`, getAuthConfig(token));
    return response.data.data;
};

export const updateDirectusTransaction = async (url, token, id, data) => {
    await axios.patch(`${url}/items/transactions/${id}`, data, getAuthConfig(token));
};

export const updateDirectusItem = async (url, token, collection, id, data) => {
    const response = await axios.patch(`${url}/items/${collection}/${id}`, data, getAuthConfig(token));
    return response.data;
};

export const createDirectusUser = async (url, token, userData) => {
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
};

export const getUser = async (url, token, userId, fields = '*') => {
    const response = await axios.get(`${url}/users/${userId}?fields=${fields}`, getAuthConfig(token));
    return response.data.data;
};
