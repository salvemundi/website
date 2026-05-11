'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from '@/components/islands/layout/ThemeToggle';
import { ROUTES } from '@/lib/config/routes';
import type { IconName } from '@/lib/utils/icons';
import { HeaderShell } from './navigation/HeaderShell';
import { NavUserSection } from './navigation/NavUserSection';
import { MobileNav } from './navigation/MobileNav';
import { type EnrichedUser, type ImpersonationInfo, type ExtendedSession } from '@/types/auth';

interface NavigationHeaderProps {
    disabledRoutes?: string[];
    initialSession?: ExtendedSession | null;
    impersonation?: ImpersonationInfo | null;
    isAdmin?: boolean;
}

/**
 * Navigation Header Component.
 * Implements the "Nuclear SSR" (Zero-Skeleton) standard.
 */
const NavigationHeader: React.FC<NavigationHeaderProps> = ({ 
    disabledRoutes = [], 
    initialSession, 
    impersonation,
    isAdmin: initialIsAdmin
}) => {
    const user = initialSession?.user ?? null;
    const isAuthenticated = !!user;
    
    // Prioritize the passed isAdmin flag from checkAdminAccess (database source of truth)
    const canAccessAdmin = !!(initialIsAdmin || user?.isAdmin || user?.isICT || user?.canAccessIntro);

    const navItems = ([
        { name: 'Home', href: ROUTES.HOME, icon: 'Home' },
        { name: 'Intro', href: ROUTES.INTRO, icon: 'Sparkles' },
        { name: 'Lidmaatschap', href: ROUTES.MEMBERSHIP, icon: 'User' },
        { name: 'Activiteiten', href: ROUTES.ACTIVITIES, icon: 'CalendarDays' },
        { name: 'Commissies', href: ROUTES.COMMITTEES, icon: 'Users' },
        { name: 'Kroegentocht', href: ROUTES.PUB_CRAWL, icon: 'Beer' },
        { name: 'Reis', href: ROUTES.TRIP, icon: 'Map' },
        { name: 'Safe Havens', href: ROUTES.SAFE_HAVENS, icon: 'Shield' },
        { name: 'Stickers', href: ROUTES.STICKERS, icon: 'MapPin' },
        { name: 'Contact', href: ROUTES.CONTACT, icon: 'Mail' },
    ] as const).filter(item => !disabledRoutes.includes(item.href as string)) as { name: string; href: string; icon: IconName }[];

    return (
        <HeaderShell>
            <div className="mx-auto max-w-app px-4 lg:px-6 z-10 relative @container w-full">
                <div className="grid grid-cols-[auto_1fr_auto] items-center gap-[clamp(0.75rem,1.5vw,2rem)]">
                    {/* Logo Section */}
                    <div className="flex items-center gap-3">
                        <Link href="/" className="group flex items-center gap-3 shrink-0 transition-transform duration-300 hover:scale-[1.03] active:scale-95">
                            <div className="relative w-12 h-12 shrink-0">
                                <Image 
                                    src="/img/newlogo.svg" 
                                    alt="Salve Mundi Logo" 
                                    fill 
                                    className="object-contain" 
                                    priority 
                                />
                            </div>
                            <div className="hidden text-left @[1024px]:block whitespace-nowrap shrink-0 transition-all duration-300">
                                <p className="text-[13px] font-semibold text-[var(--color-purple-500)] leading-none">Salve Mundi</p>
                                <p className="text-xs font-semibold text-[var(--text-main)] mt-0.5">Fontys ICT</p>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden items-center justify-center gap-[clamp(0.4rem,0.8vw,1.1rem)] lg:flex whitespace-nowrap">
                        {navItems.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="group relative inline-flex items-center gap-2 text-sm font-semibold transition-all duration-200 whitespace-nowrap text-[var(--text-main)] hover:text-[var(--color-purple-500)]"
                            >
                                <span className="text-[clamp(13px,1vw,15px)] font-semibold">{link.name}</span>
                                <span className="absolute -bottom-2 left-0 h-0.5 w-full origin-left rounded-full bg-[var(--color-purple-50)] transition-transform duration-200 ease-out scale-x-0 group-hover:scale-x-100" />
                            </Link>
                        ))}
                    </nav>

                    {/* Right Actions */}
                    <div className="flex items-center justify-end gap-3 shrink-0 flex-nowrap">
                        <NavUserSection 
                            initialSession={initialSession}
                            canAccessAdmin={canAccessAdmin}
                        />
                        
                        <ThemeToggle />

                        <MobileNav 
                            user={user}
                            isAuthenticated={isAuthenticated}
                            navItems={navItems}
                            canAccessAdmin={canAccessAdmin}
                        />
                    </div>
                </div>
            </div>
        </HeaderShell>
    );
};

export default NavigationHeader;