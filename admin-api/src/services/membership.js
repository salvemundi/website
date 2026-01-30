const axios = require('axios');

async function provisionMember(membershipApiUrl, userId) {
    if (!userId) return;
    await axios.post(`${membershipApiUrl}/register`, { user_id: userId }, { timeout: 30000 });
}

async function createMember(membershipApiUrl, firstName, lastName, email, phoneNumber = null, dateOfBirth = null) {
    const payload = {
        first_name: firstName,
        last_name: lastName,
        personal_email: email
    };
    if (phoneNumber) payload.phone_number = phoneNumber;
    if (dateOfBirth) payload.date_of_birth = dateOfBirth;

    const response = await axios.post(`${membershipApiUrl}/create-user`, payload, { timeout: 30000 });
    return response.data;
}

module.exports = {
    provisionMember,
    createMember
};
