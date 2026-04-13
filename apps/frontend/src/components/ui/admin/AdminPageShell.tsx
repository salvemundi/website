import React, { Suspense } from 'react';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import { AdminGenericLoading } from '@/components/ui/admin/AdminLoadingFallbacks';

interface AdminPageShellProps {
    title: string;
    subtitle?: string;
    backHref?: string;
    actions?: React.ReactNode;
    children: React.ReactNode;
    fallback?: React.ReactNode;
    hideToolbar?: boolean;
}

/**
 * Standardized Shell for all Beheer (Admin) pages.
 * Implements Ultra-PPR by rendering the toolbar in the static HTML shell.
 */
export default function AdminPageShell({
    title,
    subtitle,
    backHref,
    actions,
    children,
    fallback,
    hideToolbar = false
}: AdminPageShellProps) {
    return (
        <div className="min-h-screen bg-[var(--bg-main)]">
            {!hideToolbar && (
                <AdminToolbar 
                    isLoading={false}
                    title={title}
                    subtitle={subtitle}
                    backHref={backHref}
                    actions={actions}
                />
            )}
            
            <Suspense fallback={fallback || null}>
                {children}
            </Suspense>
        </div>
    );
}
