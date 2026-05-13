import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from '@/components/islands/layout/ThemeToggle';
import { ROUTES } from '@/lib/config/routes';
import type { IconName } from '@/lib/utils/icons';
import { HeaderShell } from './navigation/HeaderShell';
import { NavUserSection } from './navigation/NavUserSection';
import { MobileNav } from './navigation/MobileNav';
import { type ExtendedSession } from '@/types/auth';

interface NavigationHeaderProps {
    disabledRoutes?: string[];
    initialSession?: ExtendedSession | null;
    isAdmin?: boolean;
}

/**
 * Navigation Header Component.
 */
const NavigationHeader = ({
    disabledRoutes = [],
    initialSession,
    isAdmin: initialIsAdmin
}: NavigationHeaderProps) => {
    const user = initialSession?.user ?? null;
    const isAuthenticated = !!user;

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
            <div className="w-full px-4 lg:px-8 z-10 relative @container h-20 flex items-center justify-between">
                {/* Logo Section */}
                <div className="flex-shrink-0">
                    <Link href="/" className="group flex items-center gap-3 transition-transform duration-300 hover:scale-[1.03] active:scale-95">
                        <div className="relative w-12 h-12">
                            <Image
                                src="/img/newlogo.svg"
                                alt="Salve Mundi Logo"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                        <div className="hidden text-left @[1024px]:block whitespace-nowrap transition-all duration-300">
                            <p className="text-[13px] font-semibold text-[var(--color-purple-500)] leading-none">Salve Mundi</p>
                            <p className="text-xs font-semibold text-[var(--text-main)] mt-0.5">Fontys ICT</p>
                        </div>
                    </Link>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden lg:flex flex-1 items-center justify-center px-4 gap-x-[clamp(0.4rem,0.8vw,1.1rem)] min-w-0">
                    {navItems.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="group relative inline-flex items-center gap-2 text-sm font-semibold transition-all duration-200 whitespace-nowrap text-[var(--text-main)] hover:text-[var(--color-purple-500)] shrink-0"
                        >
                            <span className="text-[clamp(13px,1vw,15px)] font-semibold">{link.name}</span>
                            <span className="absolute -bottom-2 left-0 h-0.5 w-full origin-left rounded-full bg-[var(--color-purple-50)] transition-transform duration-200 ease-out scale-x-0 group-hover:scale-x-100" />
                        </Link>
                    ))}
                </nav>

                {/* Right Actions */}
                <div className="flex-shrink-0 flex items-center justify-end gap-3">
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
        </HeaderShell>
    );
};

export default NavigationHeader;