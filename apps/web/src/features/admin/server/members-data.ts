'use server';

import { serverDirectusFetch } from '@/shared/lib/server-directus';
import { verifyUserPermissions } from './secure-check';
import { COMMITTEE_TOKENS } from '@/shared/config/committee-tokens';

export interface Member {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    date_of_birth: string | null;
    membership_expiry: string | null;
    status: string;
    phone_number?: string | null; // Added optional fields for details
    avatar?: string | null;
}

export interface CommitteeMembership {
    id: string;
    is_leader: boolean;
    committee_id: {
        id: string;
        name: string;
        is_visible: boolean;
    };
}

export interface MemberDetail {
    member: Member;
    committees: CommitteeMembership[];
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

// Privileged roles definition
const PRIVILEGED_TOKENS = [
    COMMITTEE_TOKENS.BESTUUR,
    COMMITTEE_TOKENS.ICT,
    COMMITTEE_TOKENS.KANDI,
    COMMITTEE_TOKENS.KAS
];

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
    const isPrivileged = isAdmin || committees.some(c => PRIVILEGED_TOKENS.includes((c.token ? c.token.toLowerCase() : '') as any));

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

export async function getMemberDetailAction(id: string): Promise<MemberDetail | null> {
    // 1. Authenticate & Verify Permissions
    let userContext;
    try {
        userContext = await verifyUserPermissions({});
    } catch (e) {
        throw new Error('Unauthorized');
    }

    const { committees, role } = userContext;
    const isAdmin = role && role.toLowerCase() === 'administrator';
    const isPrivileged = isAdmin || committees.some(c => PRIVILEGED_TOKENS.includes((c.token ? c.token.toLowerCase() : '') as any));

    const hasBasicAccess = committees.length > 0 || isAdmin;
    if (!hasBasicAccess) throw new Error('Unauthorized: Must be a committee member');

    // 2. Fetch Data
    try {
        const [memberData, committeesData] = await Promise.all([
            serverDirectusFetch<Member>(`/users/${id}?fields=id,first_name,last_name,email,date_of_birth,membership_expiry,status,phone_number,avatar`),
            serverDirectusFetch<CommitteeMembership[]>(`/items/committee_members?filter[user_id][_eq]=${id}&fields=id,is_leader,committee_id.id,committee_id.name,committee_id.is_visible`)
        ]);

        if (!memberData) return null;

        // 3. Redact if not privileged
        let safeMember = memberData;
        if (!isPrivileged) {
            safeMember = {
                ...memberData,
                email: 'Afgeschermd',
                date_of_birth: null,
                phone_number: 'Alleen zichtbaar voor bevoegden', // Redact phone number too
                // Keep name and avatar visible as they are somewhat public internally
            };
        }

        // Ensure committeesData is an array to avoid crashes
        const safeCommittees = Array.isArray(committeesData) ? committeesData : [];

        return {
            member: safeMember,
            committees: safeCommittees
        };

    } catch (error) {
        console.error('[getMemberDetailAction] Failed to fetch member detail:', error);
        return null;
    }
}

export async function getMembersByCommitteeAction(committeeToken: string): Promise<Member[]> {
    // 1. Authenticate & Verify Permissions
    await verifyUserPermissions({});

    // 2. Fetch members by committee token
    try {
        const data = await serverDirectusFetch<any[]>(
            `/items/committee_members?filter[committee_id][commissie_token][_eq]=${committeeToken.toLowerCase()}&fields=user_id.id,user_id.first_name,user_id.last_name,user_id.email,user_id.status&limit=-1`
        );

        if (!Array.isArray(data)) return [];

        return data
            .filter(m => m.user_id)
            .map(m => ({
                id: m.user_id.id,
                first_name: m.user_id.first_name,
                last_name: m.user_id.last_name,
                email: m.user_id.email,
                status: m.user_id.status,
                date_of_birth: null,
                membership_expiry: null
            }));
    } catch (error) {
        console.error('[getMembersByCommitteeAction] Failed:', error);
        return [];
    }
}
