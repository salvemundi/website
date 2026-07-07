'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { isPathActive } from '@/lib/utils/link-utils';
import Image from 'next/image';
import { ThemeToggle } from '@/components/islands/layout/ThemeToggle';
import { ROUTES } from '@/lib/config/routes';
import type { IconName } from '@/lib/utils/icons';
import { HeaderShell } from './navigation/HeaderShell';
import { NavUserSection } from './navigation/NavUserSection';
import { MobileNav } from './navigation/MobileNav';
import { type ExtendedSession } from '@/types/auth';

import { BRAND_CONFIG } from '@/lib/config/brand';

interface NavigationHeaderProps {
    disabledRoutes?: string[];
    initialSession?: ExtendedSession | null;
    canAccessAdmin?: boolean;
}

const NavigationHeader = ({
    disabledRoutes = [],
    initialSession,
    canAccessAdmin: initialCanAccessAdmin = false
}: NavigationHeaderProps) => {
    const pathname = usePathname() || '/';
    const user = initialSession?.user ?? null;
    const isAuthenticated = !!user;

    const canAccessAdmin = !!(initialCanAccessAdmin || user?.permissions?.includes('ict') || (user?.committees && user.committees.length > 0));

    const navItems = ([
        { name: 'Home', href: ROUTES.HOME, icon: 'Home' },
        { name: 'Intro', href: ROUTES.INTRO, icon: 'Sparkles' },
        { name: 'Webshop', href: ROUTES.WEBSHOP, icon: 'Shirt' },
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
                <div className="shrink-0">
                    <Link href="/" className="group flex items-center gap-3 transition-transform duration-300 hover:scale-[1.03] active:scale-95">
                        <div className="relative w-12 h-12">
                            <Image
                                src={BRAND_CONFIG.logoLightMode}
                                alt="Salve Mundi Logo"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                        <div className="hidden text-left @[1024px]:block whitespace-nowrap transition-all duration-300">
                            <p className="text-[13px] font-semibold text-purple-500 leading-none">Salve Mundi</p>
                            <p className="text-xs font-semibold text-(--text-main) mt-0.5">Fontys ICT</p>
                        </div>
                    </Link>
                </div>

                <nav className="hidden lg:flex flex-1 items-center justify-center px-4 gap-x-[clamp(0.4rem,0.8vw,1.1rem)] min-w-0">
                    {navItems.map((link) => {
                        const active = isPathActive(pathname, link.href);
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    'group relative inline-flex items-center gap-2 text-sm font-semibold transition-all duration-200 whitespace-nowrap shrink-0',
                                    active ? 'text-purple-500' : 'text-(--text-main)',
                                    !active && 'hover:text-purple-500'
                                )}
                            >
                                <span className="text-[clamp(13px,1vw,15px)] font-semibold">{link.name}</span>
                                <span className={cn(
                                    'absolute -bottom-2 left-0 h-0.5 w-full origin-left rounded-full bg-purple-50 transition-transform duration-200 ease-out',
                                    active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                                )} />
                            </Link>
                        );
                    })}
                </nav>

                <div className="shrink-0 flex items-center justify-end gap-3">
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
