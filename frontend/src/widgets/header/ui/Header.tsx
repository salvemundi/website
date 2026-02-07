'use client';

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Sparkles, Shield, MapPin, LogOut, Home, User, CalendarDays, Users, Beer, Map, Mail } from "lucide-react";
import { useAuth, useAuthActions } from "@/features/auth/providers/auth-provider";
import { getImageUrl } from "@/shared/lib/api/salvemundi";
import { useSalvemundiSiteSettings } from "@/shared/lib/hooks/useSalvemundiApi";
import { ROUTES } from "@/shared/lib/routes";
import { ThemeToggle } from "@/features/theme/ui/ThemeToggle";
import { directusFetch } from "@/shared/lib/directus";

const Header: React.FC = () => {
    const pathname = usePathname();
    const { isAuthenticated, user, logout } = useAuth();
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isCommitteeMember, setIsCommitteeMember] = useState(false);
    const headerRef = useRef<HTMLElement | null>(null);
    const { data: siteSettings } = useSalvemundiSiteSettings('intro');
    const introEnabled = siteSettings?.show ?? true;
    const { data: kroegentochtSettings } = useSalvemundiSiteSettings('kroegentocht');
    const kroegentochtEnabled = kroegentochtSettings?.show ?? true;
    const { data: reisSettings } = useSalvemundiSiteSettings('reis');
    const reisEnabled = reisSettings?.show ?? true;
    const { loginWithMicrosoft, loginWithRedirect } = useAuthActions();

    const handleLogin = async () => {
        try {
            await loginWithMicrosoft();
        } catch (error) {
            // If popup is blocked or fails, fallback to redirect
            console.warn('[Header] Popup login failed, falling back to redirect:', error);
            await loginWithRedirect(window.location.pathname);
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Check if user is a committee member
    useEffect(() => {
        const checkCommitteeMembership = async () => {
            if (!user?.id) {
                setIsCommitteeMember(false);
                return;
            }

            try {
                // Prefer committees that were fetched during auth
                const committees = (user as any).committees;

                if (Array.isArray(committees)) {
                    // User has committees data loaded
                    const isMember = committees.length > 0;
                    setIsCommitteeMember(isMember);
                    return;
                }

                // Fallback: fetch from API if committees not loaded yet

                // Get user's committee memberships with committee details including is_visible
                const memberships = await directusFetch<any[]>(
                    `/items/committee_members?filter[user_id][_eq]=${user.id}&fields=committee_id.id,committee_id.is_visible`
                );

                // Check if user is member of at least one visible committee
                const isMember = Array.isArray(memberships) &&
                    memberships.some(m => m.committee_id?.is_visible !== false);
                setIsCommitteeMember(isMember);
            } catch (error) {
                // Error checking committee membership
                setIsCommitteeMember(false);
            }
        };

        checkCommitteeMembership();
    }, [user?.id, user]);

    // Measure header height and expose as CSS variable so other components
    // (like the Hero) can size themselves relative to the header. Use
    // ResizeObserver to handle dynamic height changes (menus, toolbars).
    useEffect(() => {
        const el = headerRef.current;
        if (!el || typeof window === 'undefined') return;

        const applyHeight = (h: number) => {
            document.documentElement.style.setProperty('--header-height', `${h}px`);
        };

        // initial set
        applyHeight(el.offsetHeight || 64);

        let ro: ResizeObserver | null = null;
        try {
            ro = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    const height = entry.contentRect?.height ?? el.offsetHeight ?? 64;
                    applyHeight(Math.round(height));
                }
            });
            ro.observe(el);
        } catch (e) {
            // ResizeObserver might not be available in some environments -> fallback to resize
            const onResize = () => applyHeight(el.offsetHeight ?? 64);
            window.addEventListener('resize', onResize);
            return () => window.removeEventListener('resize', onResize);
        }

        return () => {
            if (ro) ro.disconnect();
        };
    }, [menuOpen]);

    const navItems = [
        { name: "Home", href: ROUTES.HOME, icon: Home },
        ...(introEnabled ? [{ name: "Intro", href: ROUTES.INTRO, icon: Sparkles }] : []),
        { name: "Lidmaatschap", href: ROUTES.MEMBERSHIP, icon: User },
        { name: "Activiteiten", href: ROUTES.ACTIVITIES, icon: CalendarDays },
        { name: "Commissies", href: ROUTES.COMMITTEES, icon: Users },
        ...(kroegentochtEnabled ? [{ name: "Kroegentocht", href: ROUTES.PUB_CRAWL, icon: Beer }] : []),
        ...(reisEnabled ? [{ name: "Reis", href: ROUTES.TRIP, icon: Map }] : []),
        { name: "Safe Havens", href: "/safe-havens", icon: MapPin },
        { name: "Contact", href: ROUTES.CONTACT, icon: Mail },
    ];

    const getLinkClassName = (href: string) => {
        const isActive = pathname === href || (href !== '/' && pathname?.startsWith(href));
        return [
            "group relative inline-flex items-center gap-2 text-sm font-semibold transition-all duration-200",
            isActive ? "text-theme-purple" : "text-theme hover:text-theme-purple",
        ].join(" ");
    };

    useEffect(() => {
        if (menuOpen) {
            setMenuOpen(false);
        }
    }, [pathname]);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (menuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [menuOpen]);

    // Hide main header only on intro blog and planning pages for immersive experience
    // Keep header visible on main /intro signup page
    if (pathname?.startsWith('/intro/blog') || pathname?.startsWith('/intro/planning')) {
        return null;
    }

    return (
        <header
            ref={headerRef}
            className="fixed top-0 z-40 w-full bg-[var(--bg-main)]/80 backdrop-blur-md shadow-sm transition-all duration-300"
            style={{
                marginTop: 'calc(-1 * env(safe-area-inset-top))',
                paddingTop: 'env(safe-area-inset-top)'
            }}
        >
            {/* Scrolled state shadow/border overlay */}
            <div
                className={`pointer-events-none absolute inset-0 transition-all duration-300 ${isScrolled
                    ? "shadow-xl shadow-black/10 opacity-100 border-b border-theme-purple/10"
                    : "opacity-0"
                    }`}
            />
            <div className="relative">
                <div className="mx-auto flex items-center max-w-app justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8 z-10 relative">
                    <Link
                        href="/"
                        className="flex items-center gap-3 rounded-full bg-[var(--bg-card)]/80 px-4 py-2 shadow-sm hover:shadow-md transition"
                    >
                        <img className="h-9" src="/logo_purple.svg" alt="Salve Mundi" />
                        <div className="hidden text-left sm:block">
                            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-theme-purple">
                                Salve Mundi
                            </p>
                            <p className="text-sm font-semibold text-theme">
                                Fontys ICT
                            </p>
                        </div>
                    </Link>

                    {isCommitteeMember && (
                        <Link
                            href="/admin"
                            className="hidden lg:flex items-center gap-2 rounded-full bg-theme-purple text-white px-3 py-1.5 text-sm font-medium shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                            title="Admin Panel"
                        >
                            <Shield className="h-4 w-4" />
                            <span className="hidden xl:inline">Admin</span>
                        </Link>
                    )}

                    <nav className="hidden items-center gap-4 xl:gap-5 lg:flex">
                        {navItems.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={getLinkClassName(link.href)}
                                prefetch={false}
                            >
                                <span>{link.name}</span>
                                <span
                                    className={`absolute -bottom-2 left-0 h-0.5 w-full origin-left rounded-full bg-theme-purple transition-transform duration-200 ease-out ${pathname === link.href ||
                                        (link.href !== '/' && pathname?.startsWith(link.href))
                                        ? "scale-x-100"
                                        : "scale-x-0 group-hover:scale-x-100"
                                        }`}
                                />
                            </Link>
                        ))}
                    </nav>


                    <div className="flex items-center gap-3">
                        {isCommitteeMember && (
                            <Link
                                href="/admin"
                                title="Admin Panel"
                                className="inline-flex lg:hidden items-center justify-center rounded-full bg-theme-purple text-white p-2 shadow-sm transition hover:shadow-lg"
                            >
                                <Shield className="h-4 w-4" />
                            </Link>
                        )}

                        {isAuthenticated ? (
                            <Link
                                href={ROUTES.ACCOUNT}
                                className="flex items-center gap-2 rounded-full  px-3 py-1.5 text-sm font-medium text-theme shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                            >
                                <div className="relative h-8 w-8 rounded-full overflow-hidden">
                                    <Image
                                        src={user?.avatar ? getImageUrl(user.avatar) : "/logo_purple.svg"}
                                        alt={user?.email || "profiel"}
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
                                onClick={handleLogin}
                                className="flex items-center gap-2 rounded-full  bg-primary-100 dark:bg-theme-purple/20 text-theme-purple-darker dark:text-theme-white font-semibold px-3 py-1.5 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                            >
                                Inloggen
                            </button>
                        )}

                        {!isAuthenticated && (
                            <Link
                                href={ROUTES.MEMBERSHIP}
                                className="hidden items-center gap-2 rounded-full bg-gradient-theme px-4 py-2 text-sm font-bold text-theme-purple dark:text-theme-white shadow-lg shadow-theme-purple/30 transition hover:-translate-y-0.5 hover:shadow-xl md:inline-flex"
                            >
                                <Sparkles className="h-4 w-4" />
                                Word lid
                            </Link>
                        )}

                        <ThemeToggle />

                        <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-full bg-[var(--bg-card)]/80 p-2 text-theme shadow-sm transition hover:bg-theme-purple/5 lg:hidden"
                            onClick={() => setMenuOpen(!menuOpen)}
                            aria-expanded={menuOpen}
                            aria-label="Open navigatie"
                        >
                            {menuOpen ? (
                                <X className="h-5 w-5" />
                            ) : (
                                <Menu className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <div
                className={`lg:hidden ${menuOpen
                    ? "pointer-events-auto opacity-100"
                    : "pointer-events-none opacity-0"
                    } transition-opacity duration-200`}
            >
                <div
                    className="fixed inset-0 z-40 bg-theme-purple-darker/40 backdrop-blur-sm"
                    onClick={() => setMenuOpen(false)}
                    aria-hidden={!menuOpen}
                />
                <nav
                    className={`fixed right-0 z-50 flex w-full max-w-xs flex-col gap-6 bg-[var(--bg-main)] px-6 py-8 shadow-xl transition-transform duration-300 overflow-y-auto ${menuOpen ? "translate-x-0" : "translate-x-full"
                        }`}
                    style={{
                        top: 'env(safe-area-inset-top, 0px)',
                        height: 'calc(100dvh - env(safe-area-inset-top, 0px))',
                        paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))'
                    }}
                >
                    <div className="flex items-center justify-between">
                        <Link
                            href="/"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3"
                        >
                            <span className="inline-flex relative h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-card)] shadow-sm overflow-hidden">
                                {user?.avatar ? (
                                    <Image
                                        src={getImageUrl(user.avatar)}
                                        alt={user.email || "profiel"}
                                        fill
                                        sizes="40px"
                                        className="object-cover"
                                        priority
                                    />
                                ) : (
                                    <img className="h-7 w-7" src="/logo_purple.svg" alt="" />
                                )}
                            </span>
                            <span className="text-sm font-semibold text-theme">
                                Salve Mundi
                            </span>
                        </Link>
                        <button
                            type="button"
                            onClick={() => setMenuOpen(false)}
                            className="rounded-full bg-[var(--bg-card)] p-2 text-theme shadow-sm transition hover:bg-theme-purple/5"
                            aria-label="Sluit navigatie"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {isCommitteeMember && (
                            <Link
                                href="/admin"
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center gap-2 rounded-2xl bg-theme-purple text-white px-4 py-3 text-sm font-semibold shadow-lg"
                            >
                                <Shield className="h-5 w-5" />
                                <span>Admin Panel</span>
                            </Link>
                        )}

                        {navItems.map((link) => {
                            const Icon = (link as any).icon as any;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMenuOpen(false)}
                                    className="flex items-center justify-between rounded-2xl bg-[var(--bg-card)]/70 px-4 py-3 text-sm font-semibold text-theme shadow-sm"
                                >
                                    <span className="flex items-center gap-3">
                                        {Icon ? <Icon className="h-5 w-5 text-theme" aria-hidden /> : null}
                                        <span>{link.name}</span>
                                    </span>
                                    <span aria-hidden className="text-theme/60">›</span>
                                </Link>
                            );
                        })}
                    </div>

                    {!isAuthenticated && (
                        <Link
                            href={ROUTES.MEMBERSHIP}
                            onClick={() => setMenuOpen(false)}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-theme px-4 py-3 text-sm font-semibold text-theme-purple dark:text-theme-white shadow-lg shadow-theme-purple/40"
                        >
                            <Sparkles className="h-4 w-4" />
                            Word lid
                        </Link>
                    )}

                    {/* Bottom actions: Stickers + Logout (pinned to bottom) */}
                    <div className="mt-auto w-full">
                        <div className="flex items-center justify-between px-2">
                            <Link
                                href={ROUTES.STICKERS}
                                onClick={() => setMenuOpen(false)}
                                className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-[var(--bg-card)]/70 text-theme shadow-sm"
                                aria-label="Stickers"
                            >
                                <MapPin className="h-5 w-5" aria-hidden />
                                <span className="sr-only">Stickers</span>
                            </Link>

                            {isAuthenticated ? (
                                <button
                                    type="button"
                                    onClick={async () => {
                                        try {
                                            await logout();
                                        } catch (e) {
                                            // ignore
                                        }
                                        setMenuOpen(false);
                                        // Use window.location.href for logout redirect to ensure a clean state
                                        // and break potential auto-login loops.
                                        if (typeof window !== 'undefined') {
                                            window.location.href = "/?noAuto=true";
                                        } else {
                                            router.push("/");
                                        }
                                    }}
                                    className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-red-600 text-white shadow-sm"
                                    aria-label="Logout"
                                >
                                    <LogOut className="h-5 w-5" aria-hidden />
                                    <span className="sr-only">Logout</span>
                                </button>
                            ) : (
                                // keep an empty placeholder to preserve spacing when not authenticated
                                <div className="h-12 w-12" aria-hidden />
                            )}
                        </div>
                    </div>
                </nav>
            </div>

        </header>
    );
};

export default Header;

