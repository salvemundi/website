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
                    isLoading={false}
                    title={title}
                    subtitle={subtitle}
                    backHref={backHref}
                    actions={actions}
                />
            )}
            
            {children}
        </div>
    );
}
