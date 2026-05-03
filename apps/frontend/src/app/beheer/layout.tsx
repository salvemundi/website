import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

interface BeheerLayoutProps {
    children: React.ReactNode;
}

type SessionUser = {
    committees?: Array<{ name?: string | null }>;
    email?: string | null;
};

import { connection } from 'next/server';

export default async function BeheerLayout({ children }: BeheerLayoutProps) {
    await connection();
    const session = await auth.api.getSession({
        headers: await headers()
    });

    const user = session?.user as SessionUser | undefined;
    
    // Deep RBAC: Controleer of de gebruiker minimaal één commissielidmaatschap heeft.
    // Dit is veilig omdat onze custom auth-plugin de committees al heeft geïnjecteerd op de server.
    const hasCommitteeAccess = Array.isArray(user?.committees) && user.committees.length > 0;

    if (!hasCommitteeAccess) {
        
        notFound();
    }

    return <>{children}</>;
}
