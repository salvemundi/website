import React from 'react';
import BeheerToolbar from '@/components/ui/beheer/BeheerToolbar';

interface AdminPageShellProps {
    title: string;
    subtitle?: string;
    titleBadge?: React.ReactNode;
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
export default function BeheerPageShell({
    title,
    subtitle,
    titleBadge,
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
                    <BeheerToolbar
                        title={title}
                        subtitle={subtitle}
                        titleBadge={titleBadge}
                        backHref={backHref}
                        actions={actions}
                        centered={centered}
                    />
                    <div className="admin-container min-h-dvh py-4 md:py-8">
                        {children}
                    </div>
                </>
            )}

            {hideToolbar && children}
        </>
    );
}
