export const dynamic = 'force-dynamic';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { checkAdminAccess } from '@/server/actions/admin/admin-utils.actions';

interface BeheerLayoutProps {
    children: React.ReactNode;
}

export default async function BeheerLayout({ children }: BeheerLayoutProps) {
    await connection();
    
    const { user, isAuthorized } = await checkAdminAccess();
    
    if (!isAuthorized || !user) {
        notFound();
    }

    return <>{children}</>;
}

