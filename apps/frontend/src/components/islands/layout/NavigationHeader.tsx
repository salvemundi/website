import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from '@/components/islands/layout/ThemeToggle';
import { ROUTES } from '@/lib/config/routes';
import type { IconName } from '@/lib/utils/icons';
import { HeaderShell } from './navigation/HeaderShell';
import { NavUserSection } from './navigation/NavUserSection';
import { MobileNav } from './navigation/MobileNav';

interface NavigationHeaderProps {
    disabledRoutes?: string[];
    initialSession?: any;
    impersonation?: any;
}

/**
 * Server Component — Hoofdnavigatie van de website.
 * V7.12 RSC: Now fully server-side for maximum performance.
 * Interactive parts are extracted to client islands.
 */
const NavigationHeader: React.FC<NavigationHeaderProps> = ({ disabledRoutes = [], initialSession, impersonation }) => {
    const user = initialSession?.user ?? null;
    const isAuthenticated = !!user;
    
    const isCommitteeMember = Array.isArray(user?.committees) && user.committees.length > 0;

    const navItems = ([
        { name: 'Home', href: ROUTES.HOME, icon: 'Home' },
        { name: 'Intro', href: ROUTES.INTRO, icon: 'Sparkles' },
        { name: 'Lidmaatschap', href: ROUTES.MEMBERSHIP, icon: 'User' },
        { name: 'Activiteiten', href: ROUTES.ACTIVITIES, icon: 'CalendarDays' },
        { name: 'De Vereniging', href: ROUTES.COMMITTEES, icon: 'Users' },
        { name: 'Kroegentocht', href: ROUTES.PUB_CRAWL, icon: 'Beer' },
        { name: 'Reis', href: ROUTES.TRIP, icon: 'Map' },
        { name: 'Safe Havens', href: ROUTES.SAFE_HAVENS, icon: 'Shield' },
        { name: 'Stickers', href: ROUTES.STICKERS, icon: 'MapPin' },
        { name: 'Contact', href: ROUTES.CONTACT, icon: 'Mail' },
    ] as const).filter(item => !disabledRoutes.includes(item.href as string)) as { name: string; href: string; icon: IconName }[];

    return (
        <HeaderShell 
            mobileMenu={
                <MobileNav 
                    user={user}
                    isAuthenticated={isAuthenticated}
                    navItems={navItems}
                    isCommitteeMember={isCommitteeMember}
                />
            }
        >
            <div className="mx-auto max-w-app h-full px-4 sm:px-6 lg:px-8 z-10 relative">
                <div className="grid h-full grid-cols-[auto_1fr_auto] items-center gap-4 lg:gap-8">
                    {/* Logo Section */}
                    <Link href="/" className="flex items-center gap-3 shrink-0">
                        <Image src="/img/newlogo.png" alt="Logo" width={48} height={48} className="w-12 h-12" priority />
                        <div className="hidden text-left sm:block whitespace-nowrap shrink-0">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-purple-500)]">Salve Mundi</p>
                            <p className="text-sm font-semibold text-[var(--text-main)]">Fontys ICT</p>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden items-center justify-center gap-5 lg:flex whitespace-nowrap">
                        {navItems.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="group relative inline-flex items-center gap-2 text-sm font-semibold transition-all duration-200 whitespace-nowrap text-[var(--text-main)] hover:text-[var(--color-purple-500)]"
                            >
                                <span>{link.name}</span>
                                <span className="absolute -bottom-2 left-0 h-0.5 w-full origin-left rounded-full bg-[var(--color-purple-50)] transition-transform duration-200 ease-out scale-x-0 group-hover:scale-x-100" />
                            </Link>
                        ))}
                    </nav>

                    {/* Right Actions */}
                    <div className="flex items-center justify-end gap-3 shrink-0 flex-nowrap">
                        <NavUserSection 
                            initialSession={initialSession}
                            isCommitteeMember={isCommitteeMember}
                        />
                        
                        <ThemeToggle />
                        
                        {/* Mobile trigger is inside MobileNav island */}
                    </div>
                </div>
            </div>
        </HeaderShell>
    );
};

export default NavigationHeader;
