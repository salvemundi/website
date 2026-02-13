'use server';

import { serverDirectusFetch } from '@/shared/lib/server-directus';
import { verifyUserPermissions } from './secure-check';

export interface Member {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    date_of_birth: string | null;
    membership_expiry: string | null;
    status: string;
}

const EXCLUDED_EMAILS = [
    'youtube@salvemundi.nl',
    'github@salvemundi.nl',
    'intern@salvemundi.nl',
    'ik.ben.de.website@salvemundi.nl',
    'voorzitter@salvemundi.nl',
    'twitch@salvemundi.nl',
    'secretaris@salvemundi.nl',
    'penningmeester@salvemundi.nl',
    'noreply@salvemundi.nl',
    'extern@salvemundi.nl',
    'commissaris.administratie@salvemundi.nl',
    'apibot@salvemundi.nl'
];

function isRealUser(member: Member) {
    if (!member.email) return false;
    const lowerEmail = member.email.toLowerCase();
    if (EXCLUDED_EMAILS.includes(lowerEmail)) return false;
    if (lowerEmail.startsWith('test-')) return false;
    return true;
}

export async function getMembersAction(): Promise<Member[]> {
    // 1. Authenticate & Verify Permissions
    let userContext;
    try {
        userContext = await verifyUserPermissions({});
    } catch (e) {
        throw new Error('Unauthorized');
    }

    const { committees, role } = userContext;

    // 2. Determine Access Level
    const isAdmin = role && role.toLowerCase() === 'administrator';

    // Privileged committees that can see sensitive data
    // Includes: Bestuur, ICT, Kandidaatsbestuur, Kascommissie
    const privilegedTokens = ['bestuur', 'ict', 'ict-commissie', 'ka', 'kandidaatsbestuur', 'kascommissie'];
    const isPrivileged = isAdmin || committees.some(c => privilegedTokens.includes(c.token.toLowerCase()));

    // Basic access check: Must be in at least one committee or be an admin
    const hasBasicAccess = committees.length > 0 || isAdmin;

    if (!hasBasicAccess) {
        throw new Error('Unauthorized: Must be a committee member');
    }

    // 3. Fetch Data securely (Server-Side)
    try {
        // Fetch all fields needed. We will filter sensitive ones in memory before returning.
        const data = await serverDirectusFetch<Member[]>('/users?fields=id,first_name,last_name,email,date_of_birth,membership_expiry,status&limit=-1');

        if (!Array.isArray(data)) {
            console.error('[getMembersAction] Data is not an array:', data);
            return [];
        }

        // 4. Filter & Redact
        return data
            .filter(isRealUser)
            .map(member => {
                // If privileged, return all data
                if (isPrivileged) {
                    return member;
                }

                // If not privileged, redact sensitive fields
                return {
                    ...member,
                    email: 'Afgeschermd', // Redacted
                    date_of_birth: null,   // Redacted
                    // We allow viewing membership expiry and status
                    membership_expiry: member.membership_expiry,
                    status: member.status
                };
            });

    } catch (error) {
        console.error('[getMembersAction] Failed to fetch members:', error);
        throw new Error('Failed to load members data');
    }
}
