import axios from 'axios';

export const provisionMember = async (membershipApiUrl, userId) => {
    if (!userId) return;
    await axios.post(`${membershipApiUrl}/register`, { user_id: userId }, { timeout: 30000 });
};

export const createMember = async (membershipApiUrl, firstName, lastName, email, phoneNumber = null, dateOfBirth = null) => {
    const payload = {
        first_name: firstName,
        last_name: lastName,
        personal_email: email
    };
    if (phoneNumber) payload.phone_number = phoneNumber;
    if (dateOfBirth) payload.date_of_birth = dateOfBirth;

    const response = await axios.post(`${membershipApiUrl}/create-user`, payload, { timeout: 30000 });
    return response.data;
};

export const syncUserWithGraph = async (graphSyncBaseUrl, azureUserId) => {
    if (!azureUserId) return;
    try {
        // Since we are inside graph-sync, we could theoretically call the function directly,
        // but for compatibility with existing logic we'll provide the tool or just call the sync function later.
        // Actually, in graph-sync we'll just call the internal function.
    } catch (error) {
        console.error(`Local sync trigger failed for ${azureUserId}:`, error.message);
    }
};
