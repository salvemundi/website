import React from 'react';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { redirect } from 'next/navigation';

interface SecureLayoutProps {
    children: React.ReactNode;
}

/**
 * SecureLayout: Essential Dynamic Boundary.
 * Enforces session isolation and prevents build-time prerendering for all protected routes.
 */
export default async function SecureLayout({ children }: SecureLayoutProps) {
    const session = await getEnrichedSession();

    if (!session?.user) {
        redirect('/?needLogin=true');
    }

    return <>{children}</>;
}