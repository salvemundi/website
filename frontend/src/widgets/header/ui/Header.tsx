'use client';

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Sparkles } from "lucide-react";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { getImageUrl } from "@/shared/lib/api/salvemundi";
import { useSalvemundiSiteSettings } from "@/shared/lib/hooks/useSalvemundiApi";
import { ROUTES } from "@/shared/lib/routes";
import { ThemeToggle } from "@/features/theme/ui/ThemeToggle";

const Header: React.FC = () => {
    const pathname = usePathname();
    const { isAuthenticated, user } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const headerRef = useRef<HTMLElement | null>(null);
    const { data: siteSettings } = useSalvemundiSiteSettings('intro');
    const introEnabled = siteSettings?.show ?? true;

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

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
        { name: "Home", href: ROUTES.HOME },
        ...(introEnabled ? [{ name: "Intro", href: ROUTES.INTRO }] : []),
        { name: "Lidmaatschap", href: ROUTES.MEMBERSHIP },
        { name: "Activiteiten", href: ROUTES.ACTIVITIES },
        { name: "Commissies", href: ROUTES.COMMITTEES },
        { name: "Safe Havens", href: "/safe-havens" },
        { name: "Contact", href: ROUTES.CONTACT },
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

    return (
        <header ref={headerRef} className="sticky top-0 z-50 w-full">
            <div className="relative">
                <div
                    className={`pointer-events-none absolute inset-0 -z-10 backdrop-blur-xl bg-[var(--bg-main)]/90 transition-opacity duration-300 ${isScrolled ? "opacity-100" : "opacity-0"
                        }`}
                />
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

                    <nav className="hidden items-center gap-3 lg:gap-4 xl:gap-5 md:flex">
                        {navItems.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={getLinkClassName(link.href)}
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
                        {isAuthenticated ? (
                            <Link
                                href={ROUTES.ACCOUNT}
                                className="flex items-center gap-2 rounded-full  px-3 py-1.5 text-sm font-medium text-theme shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                            >
                                <img
                                    src={user?.avatar ? getImageUrl(user.avatar) : "/logo_old.svg"}
                                    alt={user?.email || "profiel"}
                                    className="h-8 w-8 rounded-full object-cover"
                                />
                                <span className="hidden sm:inline">Mijn profiel</span>
                            </Link>
                        ) : (
                            <Link
                                href={ROUTES.LOGIN}
                                className="flex items-center gap-2 rounded-full  bg-primary-100 text-theme-purple-darker font-semibold  px-3 py-1.5 text-sm  text-theme shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                            >
                                Inloggen
                            </Link>
                        )}

                        {!isAuthenticated && (
                            <Link
                                href={ROUTES.MEMBERSHIP}
                                className="hidden items-center gap-2 rounded-full bg-gradient-theme px-4 py-2 text-sm font-bold text-theme-white shadow-lg shadow-theme-purple/30 transition hover:-translate-y-0.5 hover:shadow-xl md:inline-flex"
                            >
                                <Sparkles className="h-4 w-4" />
                                Word lid
                            </Link>
                        )}

                        <ThemeToggle />

                        <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-full bg-[var(--bg-card)]/80 p-2 text-theme shadow-sm transition hover:bg-theme-purple/5 md:hidden"
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
                className={`md:hidden ${menuOpen
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
                    className={`fixed top-0 right-0 z-50 flex h-full w-full max-w-xs flex-col gap-6 bg-[var(--bg-main)] px-6 py-8 shadow-xl transition-transform duration-300 ${menuOpen ? "translate-x-0" : "translate-x-full"
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <Link
                            href="/"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3"
                        >
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-card)] shadow-sm overflow-hidden">
                                {user?.avatar ? (
                                    <img
                                        src={getImageUrl(user.avatar)}
                                        alt={user.email || "profiel"}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <img className="h-7 w-7" src="/logo_old.svg" alt="" />
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
                        {navItems.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center justify-between rounded-2xl bg-[var(--bg-card)]/70 px-4 py-3 text-sm font-semibold text-theme shadow-sm"
                            >
                                <span>{link.name}</span>
                            </Link>
                        ))}
                    </div>

                    {!isAuthenticated && (
                        <Link
                            href={ROUTES.MEMBERSHIP}
                            onClick={() => setMenuOpen(false)}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-theme px-4 py-3 text-sm font-semibold text-theme-white shadow-lg shadow-theme-purple/40"
                        >
                            <Sparkles className="h-4 w-4" />
                            Word lid
                        </Link>
                    )}
                </nav>
            </div>
        </header>
    );
};

export default Header;
