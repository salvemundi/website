const axios = require('axios');

async function provisionMember(membershipApiUrl, userId) {
    if (!userId) return;

    try {
        await axios.post(`${membershipApiUrl}/register`, {
            user_id: userId
        }, { timeout: 30000 });
    } catch (error) {
        console.error(`[MembershipService] Provisioning failed: ${error.message}`);
    }
}

async function createMember(membershipApiUrl, firstName, lastName, email) {
    try {
        const response = await axios.post(`${membershipApiUrl}/create-user`, {
            first_name: firstName,
            last_name: lastName,
            personal_email: email
        }, { timeout: 30000 });
        return response.data;
    } catch (error) {
        console.error(`[MembershipService] User creation failed: ${error.message}`);
        return null;
    }
}

module.exports = {
    provisionMember,
    createMember
};