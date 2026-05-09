import React from 'react';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';

interface AdminPageShellProps {
    title: string;
    subtitle?: string;
    backHref?: string;
    actions?: React.ReactNode;
    children: React.ReactNode;
    hideToolbar?: boolean;
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
    hideToolbar = false
}: AdminPageShellProps) {
    return (
        <div className="w-full">
            {!hideToolbar && (
                <AdminToolbar 
                    title={title}
                    subtitle={subtitle}
                    backHref={backHref}
                    actions={actions}
                />
            )}
            
            <div className="container mx-auto px-2 sm:px-4 py-4 md:py-8 max-w-7xl">
                {children}
            </div>
        </div>
    );
}
