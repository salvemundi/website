/**
 * Utility functions for member-related logic used in committees and other member displays.
 */

export function getMemberFullName(member: any) {
    if (member?.member_id) {
        const m = member.member_id;
        const first = m.first_name || m.firstname || m.name || m.display_name;
        const last = m.last_name || m.lastname || m.surname || '';
        const combined = `${first || ''} ${last || ''}`.trim();
        if (combined) return combined;
    }

    if (member?.user_id) {
        const u = member.user_id;
        const first = u.first_name || u.firstname || u.name || u.display_name;
        const last = u.last_name || u.lastname || u.surname || '';
        const combined = `${first || ''} ${last || ''}`.trim();
        if (combined) return combined;
    }

    if (member?.name) return member.name;
    if (member?.full_name) return member.full_name;
    if (member?.first_name || member?.last_name) return `${member.first_name || ''} ${member.last_name || ''}`.trim();

    return 'Onbekend';
}

export function getMemberEmail(member: any) {
    return member?.user_id?.email || member?.email || '';
}

export function resolveMemberAvatar(member: any) {
    const candidates = [
        member?.user_id?.avatar,
        member?.user_id?.picture,
        member?.member_id?.avatar,
        member?.member_id?.picture,
        member?.picture,
        member?.avatar
    ];
    for (const c of candidates) if (c) return c;
    return null;
}

export function getMemberTitle(member: any, slug: string) {
    const specificTitle = member?.user_id?.title || member?.title || member?.member_id?.title || member?.functie;
    if (specificTitle) {
        return specificTitle;
    }

    const isBestuur = slug === 'bestuur';

    if (member?.is_leader) {
        return isBestuur ? 'Voorzitter' : 'Commissie Leider';
    }

    return isBestuur ? 'Bestuurslid' : 'Commissielid';
}
