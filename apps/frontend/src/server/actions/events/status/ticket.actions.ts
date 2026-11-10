'use server';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { getTicketsForEmail } from '@/server/services/member-tickets';

export async function getMyTickets() {
    const session = await getEnrichedSession();
    if (!session) return [];
    try { return await getTicketsForEmail(session.user.email); } catch { return []; }
}
