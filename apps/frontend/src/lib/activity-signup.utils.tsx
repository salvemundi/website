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
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-semibold tracking-wider border border-emerald-500/20">
                <CheckCircle className="h-3 w-3" />
                <span>Lid</span>
            </div>
        );
    }
    return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--beheer-card-soft)] text-[var(--beheer-text-muted)] text-[9px] font-semibold tracking-wider border border-[var(--beheer-border)]">
            <User className="h-3 w-3 opacity-50" />
            <span>Gast</span>
        </div>
    );
}

/**
 * Renders a payment status badge.
 */
export function PaymentBadge({ status }: { status: string }) {
    if (status === 'paid') {
        return (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--beheer-accent)]/10 text-[var(--beheer-accent)] text-[9px] font-semibold tracking-wider border border-[var(--beheer-accent)]/20">
                <CheckCircle2 className="h-3 w-3" />
                <span>Betaald</span>
            </div>
        );
    }
    if (status === 'open') {
        return (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 text-[9px] font-semibold tracking-wider border border-amber-500/20">
                <CreditCard className="h-3 w-3" />
                <span>Open</span>
            </div>
        );
    }
    return null;
}
