import type { TripSignup } from '@salvemundi/validations';

/**
 * Bepaalt de kleur en het label voor de betalingsstatus van een reisaanmelding.
 */
export const getPaymentStatus = (signup: TripSignup) => {
    if (signup.full_payment_paid) {
        return { label: 'Volledig betaald', color: 'success' };
    } else if (signup.deposit_paid) {
        return { label: 'Aanbetaling voldaan', color: 'accent' };
    } else {
        return { label: 'Nog geen betaling', color: 'error' };
    }
};

/**
 * Bepaalt de kleur en het label voor de aanmeldstatus van een reisaanmelding.
 */
export const getStatusBadge = (status: string) => {
    const statusMap = new Map<string, { label: string; color: string }>([
        ['registered', { label: 'Geregistreerd', color: 'brand' }],
        ['waitlist', { label: 'Wachtlijst', color: 'accent' }],
        ['confirmed', { label: 'Bevestigd', color: 'success' }],
        ['cancelled', { label: 'Geannuleerd', color: 'error' }]
    ]);
    return statusMap.get(status) || { label: status, color: 'dimmed' };
};
