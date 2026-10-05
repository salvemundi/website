import React from 'react';
import { User, CheckCircle, CheckCircle2, CreditCard } from 'lucide-react';
import { type Signup } from '@/components/islands/beheer/activities/ActiviteitAanmeldingenIsland';

/**
 * Returns the formatted name of a participant.
 */
export function getSignupName(signup: Signup): string {
    if (signup.participant_name) return signup.participant_name;
    if (signup.directus_relations?.first_name) {
        return `${signup.directus_relations.first_name} ${signup.directus_relations.last_name || ''}`.trim();
    }
    return 'Onbekend';
}

/**
 * Returns the email of a participant.
 */
export function getSignupEmail(signup: Signup): string {
    return signup.participant_email || signup.directus_relations?.email || '-';
}

/**
 * Returns the phone number of a participant.
 */
export function getSignupPhone(signup: Signup): string {
    return signup.participant_phone || signup.directus_relations?.phone_number || '-';
}

/**
 * Renders a member/guest badge.
 */
export function MemberBadge({ signup }: { signup: Signup }) {
    if (signup.is_member || signup.directus_relations) {
        return (
            <div className="badge-pill-success">
                <CheckCircle className="size-3" />
                <span>Lid</span>
            </div>
        );
    }
    return (
        <div className="badge-pill-muted">
            <User className="size-3 opacity-50" />
            <span>Gast</span>
        </div>
    );
}

const formatAmount = (amount: number) =>
    new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);

/**
 * Renders a payment status badge, including the amount paid (or owed) when known.
 */
export function PaymentBadge({ status, amount }: { status: string; amount?: number | null }) {
    if (status === 'paid') {
        return (
            <div className="badge-pill-accent">
                <CheckCircle2 className="size-3" />
                <span>{typeof amount === 'number' ? formatAmount(amount) : 'Betaald'}</span>
            </div>
        );
    }
    if (status === 'open') {
        return (
            <div className="badge-pill-warning">
                <CreditCard className="size-3" />
                <span>{typeof amount === 'number' ? `Open · ${formatAmount(amount)}` : 'Open'}</span>
            </div>
        );
    }
    return null;
}
