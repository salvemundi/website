import { Badge } from '@mantine/core';
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
            <Badge color="success" variant="light" size="sm" leftSection={<CheckCircle size={12} />}>
                Lid
            </Badge>
        );
    }
    return (
        <Badge variant="default" size="sm" leftSection={<User size={12} />}>
            Gast
        </Badge>
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
            <Badge color="brand" variant="light" size="sm" leftSection={<CheckCircle2 size={12} />}>
                {typeof amount === 'number' ? formatAmount(amount) : 'Betaald'}
            </Badge>
        );
    }
    if (status === 'open') {
        return (
            <Badge color="accent" variant="light" size="sm" leftSection={<CreditCard size={12} />}>
                {typeof amount === 'number' ? `Open · ${formatAmount(amount)}` : 'Open'}
            </Badge>
        );
    }
    return null;
}
