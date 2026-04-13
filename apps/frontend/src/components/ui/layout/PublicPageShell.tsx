import React, { Suspense } from 'react';

interface PublicPageShellProps {
    title?: string;
    subtitle?: string;
    description?: string;
    backgroundImage?: string;
    backgroundPosition?: string;
    imageFilter?: string;
    backLink?: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
    hideHeader?: boolean;
}

/**
 * Standardized Shell for all Public pages.
 * V7.12 Industrial SSR: Clean architecture, zero layout shift.
 * The PageHeader component is intentionally removed from this shell to prevent
 * hydration-based layout shifts and redundant headers on the homepage.
 * Props are kept for backward compatibility with existing route pages.
 */
export default function PublicPageShell({
    children,
    fallback
}: PublicPageShellProps) {
    return (
        <div className="min-h-screen">
            <Suspense fallback={
                fallback || (
                    <main className="w-full px-4 py-8 sm:py-10 md:py-12 animate-pulse">
                        <div className="max-w-app mx-auto h-96 bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-color)]" />
                    </main>
                )
            }>
                {children}
            </Suspense>
        </div>
    );
}
