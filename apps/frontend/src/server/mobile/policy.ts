// Shared fail-closed policy, kept independent from Next.js for automated verification.
export function mobileEnabled(): boolean {
    return process.env.ENV_NAME === 'acc' && process.env.MOBILE_API_ENABLED === 'true';
}

export function mobileAssociationID(): string | null {
    const teamID = process.env.MOBILE_APPLE_TEAM_ID || '';
    return mobileEnabled() && /^[A-Z0-9]{10}$/.test(teamID) ? `${teamID}.nl.salvemundi.ios` : null;
}
