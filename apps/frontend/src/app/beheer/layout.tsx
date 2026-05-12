export const dynamic = 'force-dynamic';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { checkAdminAccess } from '@/server/actions/admin/admin-utils.actions';

interface BeheerLayoutProps {
    children: React.ReactNode;
}

export default async function BeheerLayout({ children }: BeheerLayoutProps) {
    await connection();
    
    // NUCLEAR SSR: Use centralized checkAdminAccess which handles committee enrichment
    const { user, isAuthorized } = await checkAdminAccess();
    
    // Deep RBAC: Controleer of de gebruiker geautoriseerd is (minimaal één commissie of ICT/Admin).
    if (!isAuthorized || !user) {
        notFound();
    }

    return <>{children}</>;
}

