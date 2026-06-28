import type { TripSignup } from '@salvemundi/validations/schema/admin-trip.zod';

/**
 * Bepaalt de kleur en het label voor de betalingsstatus van een reisaanmelding.
 */
export const getPaymentStatus = (signup: TripSignup) => {
    if (signup.full_payment_paid) {
        return { label: 'Volledig betaald', color: 'bg-(--beheer-active)/10 text-(--beheer-active)' };
    } else if (signup.deposit_paid) {
        return { label: 'Aanbetaling voldaan', color: 'bg-yellow-500/10 text-yellow-600' };
    } else {
        return { label: 'Nog geen betaling', color: 'bg-(--beheer-inactive)/10 text-(--beheer-inactive)' };
    }
};

/**
 * Bepaalt de kleur en het label voor de aanmeldstatus van een reisaanmelding.
 */
export const getStatusBadge = (status: string) => {
    const statusMap = new Map<string, { label: string; color: string }>([
        ['registered', { label: 'Geregistreerd', color: 'bg-(--beheer-accent)/10 text-(--beheer-accent)' }],
        ['waitlist', { label: 'Wachtlijst', color: 'bg-yellow-500/10 text-yellow-600' }],
        ['confirmed', { label: 'Bevestigd', color: 'bg-(--beheer-active)/10 text-(--beheer-active)' }],
        ['cancelled', { label: 'Geannuleerd', color: 'bg-(--beheer-inactive)/10 text-(--beheer-inactive)' }]
    ]);
    return statusMap.get(status) || { label: status, color: 'bg-(--beheer-text-muted)/10 text-(--beheer-text-muted)' };
};
