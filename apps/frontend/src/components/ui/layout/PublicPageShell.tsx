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
            <div className="w-full relative min-h-[85vh] overflow-hidden flex flex-col">
                <div 
                    className="absolute inset-0 bg-cover bg-center pointer-events-none -z-10"
                    style={{
                        backgroundImage: `url(${backgroundImage})`,
                        filter: imageFilter
                    }}
                />
                <div className="absolute inset-0 bg-black/40 -z-10 pointer-events-none" />
                <div className="flex-grow relative z-10">
                    {children}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            {children}
        </div>
    );
}
