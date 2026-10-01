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

export default function PublicPageShell({ 
    children, 
    backgroundImage, 
    imageFilter = 'brightness(0.65)' 
}: PublicPageShellProps) {
    if (backgroundImage) {
        return (
            <div className="relative flex min-h-dvh w-full flex-col overflow-hidden">
                <div 
                    className="pointer-events-none absolute inset-0 -z-10 bg-cover bg-center"
                    style={{
                        backgroundImage: `url(${backgroundImage})`,
                        filter: imageFilter
                    }}
                />
                <div className="pointer-events-none absolute inset-0 -z-10 bg-black/40" />
                <div className="relative z-10 grow">
                    {children}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-dvh w-full">
            {children}
        </div>
    );
}
