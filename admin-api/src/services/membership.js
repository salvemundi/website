const axios = require('axios');
const util = require('util');

async function provisionMember(membershipApiUrl, userId) {
    if (!userId) return;
    try {
        console.debug('[Membership] Calling provision endpoint for', userId);
        const response = await axios.post(`${membershipApiUrl}/register`, { user_id: userId }, { timeout: 30000 });
        console.debug('[Membership] Provision response:', util.inspect(response.data, { depth: 2 }));
        return response.data;
    } catch (err) {
        console.error('[Membership] provisionMember failed:', err.message || err);
        if (err.response) console.error('[Membership] Response data:', util.inspect(err.response.data, { depth: 3 }));
        throw err;
    }
}

async function createMember(membershipApiUrl, firstName, lastName, email, phoneNumber = null, dateOfBirth = null) {
    const payload = {
        first_name: firstName,
        last_name: lastName,
        personal_email: email
    };
    if (phoneNumber) payload.phone_number = phoneNumber;
    if (dateOfBirth) payload.date_of_birth = dateOfBirth;

    try {
        console.debug('[Membership] createMember payload:', util.inspect(payload, { depth: 2 }));
        const response = await axios.post(`${membershipApiUrl}/create-user`, payload, { timeout: 30000 });
        console.debug('[Membership] createMember response:', util.inspect(response.data, { depth: 2 }));
        return response.data;
    } catch (err) {
        console.error('[Membership] createMember failed:', err.message || err);
        if (err.response) console.error('[Membership] Response data:', util.inspect(err.response.data, { depth: 3 }));
        throw err;
    }
}

module.exports = {
    provisionMember,
    createMember
};
