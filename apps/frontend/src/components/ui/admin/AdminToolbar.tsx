'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface AdminToolbarProps {
    title?: string;
    subtitle?: string;
    titleBadge?: React.ReactNode;
    backHref?: string;
    onBack?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
    actions?: React.ReactNode;
    centered?: boolean;
}

export default function AdminToolbar({
    title,
    subtitle,
    titleBadge,
    backHref,
    onBack,
    actions,
    centered = false
}: AdminToolbarProps) {
    const [hidden, setHidden] = useState(false);
    const lastScrollY = useRef(0);

    useEffect(() => {
        lastScrollY.current = window.scrollY;

        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const delta = currentScrollY - lastScrollY.current;

            if (currentScrollY < 80) {
                setHidden(false);
            } else if (delta > 4) {
                setHidden(true);
            } else if (delta < -4) {
                setHidden(false);
            }

            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header
            className="sticky top-(--header-total-height) z-30 w-full border-b border-border-color bg-bg-card transition-transform duration-300"
            style={{ transform: hidden ? 'translateY(calc(-100% - var(--header-total-height)))' : 'translateY(0)' }}
        >
            <div className="admin-container py-4">
                <div className={`flex flex-col ${centered ? 'mx-auto items-center text-center' : 'items-start justify-between md:flex-row md:items-center'} gap-4`}>
                    <div className={`flex items-center gap-4 ${centered ? 'flex-col' : ''}`}>
                        {backHref && (
                            <Link
                                href={backHref}
                                title="Terug"
                                onClick={onBack}
                                className="rounded-xl border border-border-color bg-bg-card p-2 text-text-muted shadow-sm transition-all hover:text-theme-purple active:scale-95"
                            >
                                <ChevronLeft className="size-4" />
                            </Link>
                        )}
                        <div className={`flex flex-col ${centered ? 'items-center' : ''}`}>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                <h1 className="text-xl leading-tight font-semibold tracking-tight text-theme-purple md:text-2xl">
                                    {title}
                                </h1>
                                {titleBadge}
                            </div>
                            {subtitle && (
                                <p className="mt-0.5 text-sm leading-tight font-medium text-text-muted">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>

                    {actions && (
                        <div className="flex w-full flex-wrap items-center gap-2 sm:gap-3 md:w-auto">
                            {actions}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
