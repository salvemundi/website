import React, { Suspense } from 'react';
import PageHeader from '@/components/ui/layout/PageHeader';

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
 * Ensures the PageHeader is part of the static shell in the PPR model.
 */
export default function PublicPageShell({
    title = "Salve Mundi",
    subtitle,
    description,
    backgroundImage,
    backgroundPosition,
    imageFilter = 'brightness(0.65)',
    backLink,
    children,
    fallback
}: PublicPageShellProps) {
    return (
        <div className="min-h-screen">
            <PageHeader
                title={title}
                description={description || subtitle}
                backgroundImage={backgroundImage}
                backgroundPosition={backgroundPosition}
                isLoading={false}
                variant="centered"
                contentPadding="py-20"
                imageFilter={imageFilter}
                backLink={backLink}
            />
            
            <Suspense fallback={
                fallback || (
                    <main className="w-full px-4 py-8 sm:py-10 md:py-12 animate-pulse">
                        <div className="max-w-app mx-auto h-96 bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-color)] skeleton-active" />
                    </main>
                )
            }>
                {children}
            </Suspense>
        </div>
    );
}
