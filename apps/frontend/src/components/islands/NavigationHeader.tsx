'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
    Menu, X, Sparkles, Shield, MapPin, LogOut,
    Home, User, CalendarDays, Users, Beer, Map, Mail,
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { ThemeToggle } from '@/components/islands/ThemeToggle';
import { ROUTES } from '@/lib/routes';
interface NavigationHeaderProps {
    disabledRoutes?: string[];
}

const NavigationHeader: React.FC<NavigationHeaderProps> = ({ disabledRoutes = [] }) => {
    const pathname = usePathname();
    const router = useRouter();

    // Better Auth sessie — uitsluitend via useSession() conform V7-advies
    const { data: session } = authClient.useSession();
    const isAuthenticated = !!session?.user;
    const user = session?.user ?? null;

    const [menuOpen, setMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isCommitteeMember, setIsCommitteeMember] = useState(false);
    const headerRef = useRef<HTMLElement | null>(null);

    // Scroll-effect: voegt schaduw toe na scrollen
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Commissielidmaatschap controleren via Better Auth sessie-metadata
    useEffect(() => {
        if (!user) {
            setIsCommitteeMember(false);
            return;
        }
        // Commissies zitten als metadata op de sessie (geladen tijdens auth)
        const committees = (user as Record<string, unknown>).committees;
        if (Array.isArray(committees)) {
            setIsCommitteeMember(committees.length > 0);
        }
    }, [user]);

    // Header-hoogte beschikbaar stellen als CSS-variabele voor andere componenten
    useEffect(() => {
        const el = headerRef.current;
        if (!el) return;

        const applyHeight = (h: number) => {
            document.documentElement.style.setProperty('--header-height', `${h}px`);
            document.documentElement.style.setProperty('--header-total-height', `${h}px`);
        };

        applyHeight(el.offsetHeight || 72);

        let ro: ResizeObserver | null = null;
        try {
            ro = new ResizeObserver((entries) => {
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

        return () => ro?.disconnect();
    }, [menuOpen]);

    // Mobiel menu sluiten bij routewijziging
    useEffect(() => { setMenuOpen(false); }, [pathname]);

    // Scrollen van body blokkeren wanneer mobiel menu open is
    useEffect(() => {
        document.body.style.overflow = menuOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [menuOpen]);

    // Verberg header op intro-subroutes voor een immersieve ervaring
    if (pathname?.startsWith('/intro/blog') || pathname?.startsWith('/intro/planning')) {
        return null;
    }

    const allNavItems = [
        { name: 'Home', href: ROUTES.HOME, icon: Home },
        { name: 'Intro', href: ROUTES.INTRO, icon: Sparkles },
        { name: 'Lidmaatschap', href: ROUTES.MEMBERSHIP, icon: User },
        { name: 'Activiteiten', href: ROUTES.ACTIVITIES, icon: CalendarDays },
        { name: 'De Vereniging', href: ROUTES.COMMITTEES, icon: Users },
        { name: 'Kroegentocht', href: ROUTES.PUB_CRAWL, icon: Beer },
        { name: 'Reis', href: ROUTES.TRIP, icon: Map },
        { name: 'Safe Havens', href: ROUTES.STICKERS, icon: MapPin },
        { name: 'Contact', href: ROUTES.CONTACT, icon: Mail },
    ];

    // Filter items die expliciet zijn uitgeschakeld via Feature Flags
    const navItems = allNavItems.filter(item => !disabledRoutes.includes(item.href));

    const getLinkClassName = (href: string) => {
        const isActive = pathname === href || (href !== '/' && pathname?.startsWith(href));
        return [
            'group relative inline-flex items-center gap-2 text-sm font-semibold transition-all duration-200 whitespace-nowrap',
            isActive
                ? 'text-[var(--color-purple-500)]'
                : 'text-[var(--text-main)] hover:text-[var(--color-purple-500)]',
        ].join(' ');
    };

    const handleLogout = async () => {
        try {
            await authClient.signOut();
        } catch {
            // Fout bij uitloggen — negeren
        }
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
            className="fixed top-0 z-40 w-full backdrop-blur-md shadow-sm transition-all duration-300"
            style={{ backgroundColor: 'color-mix(in srgb, var(--bg-main) 80%, transparent)' }}
        >
            {/* Schaduw-overlay bij scrollen */}
            <div
                className={`pointer-events-none absolute inset-0 transition-all duration-300 ${isScrolled
                    ? 'shadow-xl shadow-black/10 opacity-100 border-b border-[var(--color-purple-500)]/10'
                    : 'opacity-0'
                    }`}
            />

            <div className="relative">
                <div className="mx-auto flex items-center max-w-full justify-between gap-4 px-6 py-4 sm:px-10 lg:px-12 z-10 relative">
                    {/* Logo Section */}
                    <div className="flex-shrink-0">
                        <Link
                            href="/"
                            className="flex items-center gap-3 rounded-full px-4 py-2 shadow-sm hover:shadow-md transition"
                            style={{ backgroundColor: 'color-mix(in srgb, var(--bg-card) 80%, transparent)' }}
                        >
                            <img className="h-9" src="/img/newlogo.png" alt="Salve Mundi" />
                            <div className="hidden text-left sm:block whitespace-nowrap">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-purple-500)]">
                                    Salve Mundi
                                </p>
                                <p className="text-sm font-semibold text-[var(--text-main)]">
                                    Fontys ICT
                                </p>
                            </div>
                        </Link>
                    </div>

                    {/* Spacer to push logo to the left */}
                    <div className="flex-1" />

                    {/* Admin-knop (desktop) */}
                    {isCommitteeMember && (
                        <Link
                            href={ROUTES.ADMIN}
                            className="hidden lg:flex items-center gap-2 rounded-full bg-[var(--color-purple-500)] text-[var(--color-white)] px-3 py-1.5 text-sm font-medium shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                            title="Admin Panel"
                        >
                            <Shield className="h-4 w-4" />
                            <span className="hidden xl:inline">Admin</span>
                        </Link>
                    )}

                    {/* Desktopnavigatie */}
                    <nav className="hidden items-center gap-4 xl:gap-5 lg:flex">
                        {navItems.map((link) => {
                            const isActive =
                                pathname === link.href ||
                                (link.href !== '/' && pathname?.startsWith(link.href));
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={getLinkClassName(link.href)}
                                    prefetch={false}
                                >
                                    <span>{link.name}</span>
                                    <span
                                        className={`absolute -bottom-2 left-0 h-0.5 w-full origin-left rounded-full bg-[var(--color-purple-500)] transition-transform duration-200 ease-out ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                                            }`}
                                    />
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Rechts: acties */}
                    <div className="flex items-center gap-3">
                        {/* Admin-knop (mobiel) */}
                        {isCommitteeMember && (
                            <Link
                                href={ROUTES.ADMIN}
                                title="Admin Panel"
                                className="inline-flex lg:hidden items-center justify-center rounded-full bg-[var(--color-purple-500)] text-[var(--color-white)] p-2 shadow-sm transition hover:shadow-lg"
                            >
                                <Shield className="h-4 w-4" />
                            </Link>
                        )}

                        {/* Profielknop of inlogknop */}
                        {isAuthenticated ? (
                            <Link
                                href={ROUTES.ACCOUNT}
                                className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-[var(--text-main)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                            >
                                <div className="relative h-8 w-8 rounded-full overflow-hidden">
                                    <Image
                                        src={
                                            (user as Record<string, unknown>)?.image
                                                ? String((user as Record<string, unknown>).image)
                                                : '/img/newlogo.png'
                                        }
                                        alt={(user as Record<string, unknown>)?.email
                                            ? String((user as Record<string, unknown>).email)
                                            : 'Profiel'}
                                        fill
                                        sizes="32px"
                                        className="object-cover"
                                        priority
                                    />
                                </div>
                                <span className="hidden sm:inline">Mijn profiel</span>
                            </Link>
                        ) : (
                            <button
                                type="button"
                                onClick={async () => {
                                    try {
                                        await authClient.signIn.social({ provider: 'microsoft', callbackURL: '/profiel' });
                                    } catch (error) {
                                        console.error('Fout bij inloggen:', error);
                                    }
                                }}
                                className="flex cursor-pointer items-center gap-2 rounded-full font-semibold px-3 py-1.5 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                                style={{
                                    backgroundColor: 'var(--color-purple-50)',
                                    color: 'var(--color-purple-700)',
                                }}
                            >
                                Inloggen
                            </button>
                        )}

                        {/* Word-lid-knop (niet ingelogd) */}
                        {!isAuthenticated && (
                            <Link
                                href={ROUTES.MEMBERSHIP}
                                className="hidden items-center gap-2 rounded-full px-4 py-2 text-sm font-bold shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl md:inline-flex"
                                style={{
                                    background: 'linear-gradient(to right, var(--color-purple-100), var(--color-purple-200))',
                                    color: 'var(--color-purple-700)',
                                }}
                            >
                                <Sparkles className="h-4 w-4" />
                                Word lid
                            </Link>
                        )}

                        <ThemeToggle />

                        {/* Hamburger-knop (mobiel) */}
                        <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-full p-2 text-[var(--text-main)] shadow-sm transition hover:bg-[var(--color-purple-100)] lg:hidden"
                            style={{ backgroundColor: 'color-mix(in srgb, var(--bg-card) 80%, transparent)' }}
                            onClick={() => setMenuOpen(!menuOpen)}
                            aria-expanded={menuOpen}
                            aria-label="Open navigatie"
                        >
                            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobiel menu */}
            <div
                className={`lg:hidden ${menuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
                    } transition-opacity duration-200`}
            >
                {/* Backdrop */}
                <div
                    className="fixed inset-0 z-40 bg-[var(--color-purple-900)]/40 backdrop-blur-sm"
                    onClick={() => setMenuOpen(false)}
                    aria-hidden={!menuOpen}
                />

                {/* Slide-out paneel */}
                <nav
                    className={`fixed right-0 z-50 flex w-full max-w-xs flex-col gap-6 bg-[var(--bg-main)] px-6 py-8 shadow-xl transition-transform duration-300 overflow-y-auto ${menuOpen ? 'translate-x-0' : 'translate-x-full'
                        }`}
                    style={{ top: 0, height: '100dvh' }}
                >
                    {/* Koptekst van het paneel */}
                    <div className="flex items-center justify-between">
                        <Link
                            href="/"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3"
                        >
                            <span className="inline-flex relative h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-card)] shadow-sm overflow-hidden">
                                {(user as Record<string, unknown>)?.image ? (
                                    <Image
                                        src={String((user as Record<string, unknown>).image)}
                                        alt={String((user as Record<string, unknown>).email ?? '')}
                                        fill
                                        sizes="40px"
                                        className="object-cover"
                                        priority
                                    />
                                ) : (
                                    <img className="h-7 w-7" src="/img/newlogo.png" alt="" />
                                )}
                            </span>
                            <span className="text-sm font-semibold text-[var(--text-main)]">
                                Salve Mundi
                            </span>
                        </Link>
                        <button
                            type="button"
                            onClick={() => setMenuOpen(false)}
                            className="rounded-full bg-[var(--bg-card)] p-2 text-[var(--text-main)] shadow-sm transition hover:bg-[var(--color-purple-100)]"
                            aria-label="Sluit navigatie"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Navigatielinks */}
                    <div className="space-y-4">
                        {isCommitteeMember && (
                            <Link
                                href={ROUTES.ADMIN}
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center gap-2 rounded-2xl bg-[var(--color-purple-500)] text-[var(--color-white)] px-4 py-3 text-sm font-semibold shadow-lg"
                            >
                                <Shield className="h-5 w-5" />
                                <span>Admin Panel</span>
                            </Link>
                        )}

                        {navItems.map((link) => {
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMenuOpen(false)}
                                    className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold text-[var(--text-main)] shadow-sm"
                                    style={{ backgroundColor: 'color-mix(in srgb, var(--bg-card) 70%, transparent)' }}
                                >
                                    <span className="flex items-center gap-3 whitespace-nowrap">
                                        <Icon className="h-5 w-5 text-[var(--text-main)]" aria-hidden />
                                        <span>{link.name}</span>
                                    </span>
                                    <span aria-hidden className="text-[var(--text-muted)]">›</span>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Word-lid-knop (niet ingelogd) */}
                    {!isAuthenticated && (
                        <Link
                            href={ROUTES.MEMBERSHIP}
                            onClick={() => setMenuOpen(false)}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold shadow-lg"
                            style={{
                                background: 'linear-gradient(to right, var(--color-purple-100), var(--color-purple-200))',
                                color: 'var(--color-purple-700)',
                            }}
                        >
                            <Sparkles className="h-4 w-4" />
                            Word lid
                        </Link>
                    )}

                    {/* Onderste acties: stickers-link + uitlogknop */}
                    <div className="mt-auto w-full">
                        <div className="flex items-center justify-between px-2">
                            <Link
                                href={ROUTES.STICKERS}
                                onClick={() => setMenuOpen(false)}
                                className="inline-flex items-center justify-center h-12 w-12 rounded-full text-[var(--text-main)] shadow-sm"
                                style={{ backgroundColor: 'color-mix(in srgb, var(--bg-card) 70%, transparent)' }}
                                aria-label="Safe Havens"
                            >
                                <MapPin className="h-5 w-5" aria-hidden />
                                <span className="sr-only">Safe Havens</span>
                            </Link>

                            {isAuthenticated ? (
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-red-600 text-white shadow-sm"
                                    aria-label="Uitloggen"
                                >
                                    <LogOut className="h-5 w-5" aria-hidden />
                                    <span className="sr-only">Uitloggen</span>
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={async () => {
                                        try {
                                            await authClient.signIn.social({ provider: 'microsoft', callbackURL: '/profiel' });
                                        } catch (error) {
                                            console.error('Fout bij inloggen:', error);
                                        }
                                    }}
                                    className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold shadow-sm transition cursor-pointer"
                                    style={{
                                        backgroundColor: 'var(--color-purple-50)',
                                        color: 'var(--color-purple-700)',
                                    }}
                                >
                                    Inloggen
                                </button>
                            )}
                        </div>
                    </div>
                </nav>
            </div>
        </header>
    );
};

export default NavigationHeader;
