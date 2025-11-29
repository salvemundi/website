const axios = require('axios');

async function provisionMember(membershipApiUrl, userId) {
    if (!userId) {
        return;
    }

    try {
        await axios.post(`${membershipApiUrl}/register`, {
            user_id: userId
        });
    } catch (error) {
        console.error(`[MembershipService] Provisioning failed: ${error.message}`);
    }
}

module.exports = {
    provisionMember
};