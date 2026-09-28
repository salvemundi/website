export const dynamic = 'force-dynamic';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { checkBeheerAccess } from '@/server/actions/beheer/beheer-utils.actions';

interface BeheerLayoutProps {
    children: React.ReactNode;
}

export default async function BeheerLayout({ children }: BeheerLayoutProps) {
    await connection();
    
    const { user, isAuthorized } = await checkBeheerAccess();
    
    if (!isAuthorized || !user) {
        notFound();
    }

    return <>{children}</>;
}

