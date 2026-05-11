import type { TripSignup } from '@salvemundi/validations/schema/admin-reis.zod';

/**
 * Bepaalt de kleur en het label voor de betalingsstatus van een reisaanmelding.
 */
export const getPaymentStatus = (signup: TripSignup) => {
    if (signup.full_payment_paid) {
        return { label: 'Volledig betaald', color: 'bg-[var(--beheer-active)]/10 text-[var(--beheer-active)]' };
    } else if (signup.deposit_paid) {
        return { label: 'Aanbetaling voldaan', color: 'bg-yellow-500/10 text-yellow-600' };
    } else {
        return { label: 'Nog geen betaling', color: 'bg-[var(--beheer-inactive)]/10 text-[var(--beheer-inactive)]' };
    }
};

/**
 * Bepaalt de kleur en het label voor de aanmeldstatus van een reisaanmelding.
 */
export const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
        registered: { label: 'Geregistreerd', color: 'bg-[var(--beheer-accent)]/10 text-[var(--beheer-accent)]' },
        waitlist: { label: 'Wachtlijst', color: 'bg-yellow-500/10 text-yellow-600' },
        confirmed: { label: 'Bevestigd', color: 'bg-[var(--beheer-active)]/10 text-[var(--beheer-active)]' },
        cancelled: { label: 'Geannuleerd', color: 'bg-[var(--beheer-inactive)]/10 text-[var(--beheer-inactive)]' }
    };
    return statusMap[status] || { label: status, color: 'bg-[var(--beheer-text-muted)]/10 text-[var(--beheer-text-muted)]' };
};
