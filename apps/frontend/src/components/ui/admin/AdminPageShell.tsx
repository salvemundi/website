import React from 'react';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';

interface AdminPageShellProps {
    title: string;
    subtitle?: string;
    backHref?: string;
    actions?: React.ReactNode;
    children: React.ReactNode;
    hideToolbar?: boolean;
    centered?: boolean;
}

/**
 * Standardized Shell for all Beheer (Admin) pages.
 * NUCLEAR SSR: No internal suspense. Toolbar and content flush together.
 */
export default function AdminPageShell({
    title,
    subtitle,
    backHref,
    actions,
    children,
    hideToolbar = false,
    centered = false
}: AdminPageShellProps) {
    return (
        <>
            {!hideToolbar && (
                <>
                    <AdminToolbar 
                        title={title}
                        subtitle={subtitle}
                        backHref={backHref}
                        actions={actions}
                        centered={centered}
                    />
                    <div className="admin-container py-4 md:py-8 min-h-dvh">
                        {children}
                    </div>
                </>
            )}

            {hideToolbar && children}
        </>
    );
}
