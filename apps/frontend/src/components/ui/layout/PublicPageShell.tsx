import React from 'react';

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

export default function PublicPageShell({ children }: PublicPageShellProps) {
    return (
        <div className="w-full">
            {children}
        </div>
    );
}
