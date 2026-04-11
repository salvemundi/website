'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
    Menu, X, Sparkles, Shield, User, LogOut,
    Home, CalendarDays, Users, Beer, Map, Mail, MapPin
} from 'lucide-react';
import { authClient } from '@/lib/auth';
import { ThemeToggle } from '@/components/islands/layout/ThemeToggle';
import { ROUTES } from '@/lib/config/routes';
import { getImageUrl } from '@/lib/utils/image-utils';

import MobileMenu from './navigation/MobileMenu';

interface NavigationHeaderProps {
    disabledRoutes?: string[];
    initialSession?: { user?: SessionUser | null } | null;
    impersonation?: { 
        name: string; 
        avatar?: string | null; 
        email?: string | null;
        error?: string;
    } | null;
}

type CommitteeMeta = {
    id?: number | string;
    name?: string | null;
    is_leader?: boolean | null;
};

type SessionUser = {
    name?: string | null;
    display_name?: string | null;
    email?: string | null;
    avatar?: string | null;
    image?: string | null;
    membership_status?: string | null;
    committees?: CommitteeMeta[] | null;
};

const NavigationHeader: React.FC<NavigationHeaderProps> = ({ disabledRoutes = [], initialSession }) => {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [mounted, setMounted] = useState(false);

    // Auto-login flow wanneer proxy een 302 uitvoert naar /?needLogin=true
    useEffect(() => {
        if (!mounted) return;
        const needLogin = searchParams.get('needLogin');
        const callbackURL = searchParams.get('callbackURL') || '/profiel';

        if (needLogin === 'true') {
            router.replace(pathname || '/');
            authClient.signIn.social({ provider: 'microsoft', callbackURL }).catch(console.error);
        }
    }, [mounted, searchParams, pathname, router]);

    const { data: session } = authClient.useSession();
    
    const user = useMemo(() => {
        const sUser = session?.user as any;
        const iUser = initialSession?.user ?? null;
        if (!mounted) return iUser;
        if (sUser && !sUser.committees && iUser?.committees) {
            return { ...sUser, committees: iUser.committees };
        }
        return sUser || iUser;
    }, [mounted, session?.user, initialSession]);

    const isAuthenticated = !!user;
    const [menuOpen, setMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const isCommitteeMember = useMemo(() => {
        const committees = user?.committees;
        return Array.isArray(committees) && committees.length > 0;
    }, [user]);
    const headerRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const el = headerRef.current;
        if (!el) return;
        const applyHeight = (h: number) => {
            document.documentElement.style.setProperty('--header-height', `${h}px`);
        };
        applyHeight(el.offsetHeight || 72);
        try {
            const ro = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    applyHeight(Math.round(entry.contentRect?.height ?? el.offsetHeight ?? 64));
                }
            });
            ro.observe(el);
        } catch {
            const onResize = () => applyHeight(el.offsetHeight ?? 64);
            window.addEventListener('resize', onResize);
            return () => window.removeEventListener('resize', onResize);
        }
    }, [menuOpen]);

    useEffect(() => { setMenuOpen(false); }, [pathname]);

    useEffect(() => {
        document.body.style.overflow = menuOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [menuOpen]);

    if (pathname?.startsWith('/intro/blog') || pathname?.startsWith('/intro/planning')) {
        return null;
    }

    const navItems = [
        { name: 'Home', href: ROUTES.HOME, icon: Home },
        { name: 'Intro', href: ROUTES.INTRO, icon: Sparkles },
        { name: 'Lidmaatschap', href: ROUTES.MEMBERSHIP, icon: User },
        { name: 'Activiteiten', href: ROUTES.ACTIVITIES, icon: CalendarDays },
        { name: 'De Vereniging', href: ROUTES.COMMITTEES, icon: Users },
        { name: 'Kroegentocht', href: ROUTES.PUB_CRAWL, icon: Beer },
        { name: 'Reis', href: ROUTES.TRIP, icon: Map },
        { name: 'Safe Havens', href: ROUTES.SAFE_HAVENS, icon: Shield },
        { name: 'Stickers', href: ROUTES.STICKERS, icon: MapPin },
        { name: 'Contact', href: ROUTES.CONTACT, icon: Mail },
    ].filter(item => !disabledRoutes.includes(item.href));

    const handleLogout = async () => {
        try {
            await authClient.signOut();
        } catch { }
        setMenuOpen(false);
        if (typeof window !== 'undefined') {
            window.location.href = '/?noAuto=true';
        } else {
            router.push('/');
        }
    };

    return (
        <header
            ref={headerRef}
            className="fixed top-0 z-50 w-full backdrop-blur-md shadow-sm transition-all duration-300 bg-[color-mix(in_srgb,var(--bg-main)_80%,transparent)]"
        >
            <div
                className={`pointer-events-none absolute inset-0 transition-all duration-300 ${isScrolled
                    ? 'shadow-xl shadow-black/10 opacity-100 border-b border-[var(--color-purple-500)]/10'
                    : 'opacity-0'
                    }`}
            />

            <div className="mx-auto h-16 items-center px-6 sm:px-10 lg:px-12 z-10 relative flex justify-between gap-4 lg:gap-5">
                    {/* Logo Section */}
                    <Link
                        href="/"
                        className="flex items-center gap-3 rounded-full px-4 py-2 shadow-sm hover:shadow-md transition shrink-0 bg-[color-mix(in_srgb,var(--bg-card)_80%,transparent)]"
                    >
                        <Image src="/img/newlogo.png" alt="Salve Mundi" width={36} height={36} className="h-9 w-9 shrink-0" priority />
                        <div className="hidden text-left sm:block whitespace-nowrap shrink-0">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-purple-500)]">Salve Mundi</p>
                            <p className="text-sm font-semibold text-[var(--text-main)]">Fontys ICT</p>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden items-center justify-center gap-5 lg:flex whitespace-nowrap">
                        {navItems.map((link) => {
                            const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href));
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`group relative inline-flex items-center gap-2 text-sm font-semibold transition-all duration-200 whitespace-nowrap ${isActive ? 'text-[var(--color-purple-500)]' : 'text-[var(--text-main)] hover:text-[var(--color-purple-500)]'}`}
                                >
                                    <span>{link.name}</span>
                                    <span className={`absolute -bottom-2 left-0 h-0.5 w-full origin-left rounded-full bg-[var(--color-purple-50)] transition-transform duration-200 ease-out ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right Actions */}
                    <div className="flex items-center justify-end gap-3 shrink-0">
                        {isCommitteeMember && (
                            <Link
                                href={ROUTES.ADMIN}
                                className="flex items-center gap-2 rounded-full bg-[var(--color-purple-500)] text-[var(--color-white)] px-3 py-1.5 h-8 text-sm font-medium shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg shrink-0"
                            >
                                <Shield className="h-4 w-4 shrink-0" />
                                <span className="hidden xl:inline">Admin</span>
                            </Link>
                        )}

                        {isAuthenticated ? (
                            mounted ? (
                                <Link
                                    href={ROUTES.ACCOUNT}
                                    className="flex items-center gap-2 rounded-full px-3 py-1.5 h-8 text-sm font-medium text-[var(--text-main)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg min-w-[136px] justify-center"
                                >
                                    <div className="relative h-6 w-6 rounded-full overflow-hidden shrink-0 bg-[var(--color-purple-50)] dark:bg-white/10 flex items-center justify-center">
                                        {user.avatar ? (
                                            <Image src={getImageUrl(user.avatar)} alt={user.name || 'Profiel'} fill className="object-cover" priority unoptimized />
                                        ) : (
                                            <User className="h-3.5 w-3.5 text-[var(--color-purple-600)]" />
                                        )}
                                    </div>
                                    <span className="hidden sm:inline">Mijn profiel</span>
                                </Link>
                            ) : <div className="h-8 w-[136px] rounded-full bg-[var(--color-purple-100)]/10 animate-pulse" />
                        ) : (
                            <button
                                onClick={() => authClient.signIn.social({ provider: 'microsoft', callbackURL: '/profiel' })}
                                className="flex cursor-pointer items-center justify-center gap-2 rounded-full font-semibold px-3 py-1.5 h-8 w-[88px] text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg bg-[var(--color-purple-50)] text-[var(--color-purple-700)]"
                            >
                                Inloggen
                            </button>
                        )}

                        <ThemeToggle />

                        <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-full p-2 text-[var(--text-main)] shadow-sm transition hover:bg-[var(--color-purple-100)] lg:hidden"
                            style={{ backgroundColor: 'color-mix(in srgb, var(--bg-card) 80%, transparent)' }}
                            onClick={() => setMenuOpen(!menuOpen)}
                        >
                            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                </div>
            </div>

            <MobileMenu 
                isOpen={menuOpen}
                onClose={() => setMenuOpen(false)}
                user={user}
                isAuthenticated={isAuthenticated}
                navItems={navItems}
                isCommitteeMember={isCommitteeMember}
                onLogout={handleLogout}
                mounted={mounted}
            />
        </header>
    );
};

export default NavigationHeader;
