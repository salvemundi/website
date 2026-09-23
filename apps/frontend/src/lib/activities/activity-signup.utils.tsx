import React from 'react';
import { User, CheckCircle, CheckCircle2, CreditCard } from 'lucide-react';
import { type Signup } from '@/components/islands/admin/activities/ActiviteitAanmeldingenIsland';

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
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-semibold tracking-wider text-emerald-500">
                <CheckCircle className="size-3" />
                <span>Lid</span>
            </div>
        );
    }
    return (
        <div className="inline-flex items-center gap-1.5 rounded-full border border-(--beheer-border) bg-(--beheer-card-soft) px-2.5 py-1 text-[9px] font-semibold tracking-wider text-(--beheer-text-muted)">
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
            <div className="inline-flex items-center gap-1.5 rounded-full border border-(--beheer-accent)/20 bg-(--beheer-accent)/10 px-2.5 py-1 text-[9px] font-semibold tracking-wider text-(--beheer-accent)">
                <CheckCircle2 className="size-3" />
                <span>{typeof amount === 'number' ? formatAmount(amount) : 'Betaald'}</span>
            </div>
        );
    }
    if (status === 'open') {
        return (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[9px] font-semibold tracking-wider text-amber-600">
                <CreditCard className="size-3" />
                <span>{typeof amount === 'number' ? `Open · ${formatAmount(amount)}` : 'Open'}</span>
            </div>
        );
    }
    return null;
}
