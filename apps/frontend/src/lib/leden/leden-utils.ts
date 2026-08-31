import { toISODate } from '@/lib/utils/date-utils';
import { safeConsoleError } from '@/server/utils/logger';

export interface MembershipUserLike {
    membership_expiry?: string | Date | null;
    membership_status?: string | null;
}

export function isMembershipActive(member: MembershipUserLike | null | undefined): boolean {
    if (!member || !member.membership_expiry) return false;

    if (member.membership_status && ['suspended', 'cancelled', 'banned'].includes(member.membership_status.toLowerCase())) {
        return false;
    }

    try {
        const expiryDateStr = toISODate(member.membership_expiry);
        if (!expiryDateStr) return false;

        const todayStr = toISODate(new Date());
        return expiryDateStr >= todayStr;
    } catch (error) {
        safeConsoleError('[leden-utils.ts][isMembershipActive]', error);
        return false;
    }
}
