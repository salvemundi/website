import { connection } from 'next/server';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

interface SecureLayoutProps {
    children: React.ReactNode;
}

/**
 * SecureLayout: Essential Dynamic Boundary.
 * Enforces session isolation and prevents build-time prerendering for all protected routes.
 */
export default async function SecureLayout({ children }: SecureLayoutProps) {
    await connection();
    
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session?.user) {
        redirect('/login');
    }

    return <>{children}</>;
}
