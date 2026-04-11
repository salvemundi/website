import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { isSuperAdmin } from '@/lib/auth';

export async function requireReisAdmin() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || !session.user) {
        throw new Error('Niet geautoriseerd');
    }

    const user = session.user;
    const { fetchUserCommittees } = await import('./qr-db.utils');
    const committees = await fetchUserCommittees(user.id);

    if (!isSuperAdmin(committees)) {
        throw new Error('Forbidden: SuperAdmin rechten vereist voor reisbeheer');
    }

    return session.user;
}
