/* Mobile menu - client component */
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { isPathActive } from '@/lib/utils/link-utils';
import Image from 'next/image';
import {
    Shield, Sparkles, LogOut
} from 'lucide-react';
import { ROUTES } from '@/lib/config/routes';
import { getImageUrl } from '@/lib/utils/image-utils';
import { BRAND_CONFIG } from '@/lib/config/brand';
import { authClient } from '@/lib/auth';
import { IconMap, type IconName } from '@/lib/utils/icons';

interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    avatar?: string | null;
}

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    isAuthenticated: boolean;
    navItems: { name: string; href: string; icon: IconName }[];
    canAccessAdmin: boolean;
    onLogout: () => void;
    mounted: boolean;
}

export default function MobileMenu({
    isOpen,
    onClose,
    user,
    isAuthenticated,
    navItems,
    canAccessAdmin,
    onLogout,
    mounted
}: MobileMenuProps) {
    const pathname = usePathname() || '/';
    return (
        <div
            className={`lg:hidden ${isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
                } transition-opacity duration-200`}
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-190 bg-black/40 backdrop-blur-sm transition-all duration-300"
                onClick={onClose}
                aria-hidden={!isOpen}
                role="presentation"
            />

            {/* Slide-out paneel */}
            <nav
                className={`fixed right-0 z-200 flex w-full max-w-xs flex-col gap-6 overflow-y-auto bg-(--bg-main) px-6 pt-[calc(2rem+env(safe-area-inset-top,0px))] pb-[calc(2rem+env(safe-area-inset-bottom,0px))] shadow-2xl transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
                style={{ top: 0, height: '100dvh' }}
                aria-label="Mobiele navigatie"
                role="dialog"
                aria-modal="true"
            >
                {/* Koptekst van het paneel */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/"
                        onClick={onClose}
                        className="flex items-center gap-3"
                    >
                        <span className="relative inline-flex size-10 items-center justify-center overflow-hidden rounded-full bg-(--bg-card) shadow-sm">
                            {mounted && (user?.avatar || user?.image) ? (
                                <Image
                                    src={(user.avatar ? getImageUrl(user.avatar) : (user.image || '')) as string}
                                    alt={user.name || 'Profiel'}
                                    fill
                                    className="object-cover"
                                    priority
                                    unoptimized
                                />
                            ) : (
                                <div className="relative size-8">
                                    <Image
                                        src={BRAND_CONFIG.logoLightMode}
                                        alt="Logo"
                                        fill
                                        className="object-contain dark:hidden"
                                    />
                                    <Image
                                        src={BRAND_CONFIG.logoDarkMode}
                                        alt="Logo"
                                        fill
                                        className="hidden object-contain dark:block"
                                    />
                                </div>
                            )}
                        </span>
                        <span className="text-sm font-semibold text-(--text-main)">
                            Salve Mundi
                        </span>
                    </Link>
                </div>

                {/* Navigatielinks */}
                <div className="space-y-4">
                    {canAccessAdmin && (
                        <Link
                            href={ROUTES.ADMIN}
                            onClick={onClose}
                            className="beheer-button beheer-button w-full justify-start"
                        >
                            <Shield className="size-5" />
                            <span>Beheer</span>
                        </Link>
                    )}

                    {isAuthenticated && (
                        <Link
                            href={ROUTES.ACCOUNT}
                            onClick={onClose}
                            className="flex items-center justify-between rounded-2xl border border-(--border-color)/10 bg-(--bg-card) px-4 py-3 text-sm font-semibold text-(--text-main) shadow-sm transition-all active:scale-95"
                        >
                            <span className="flex items-center gap-3">
                                <IconMap.User className="size-5 text-theme-purple" />
                                <span>Mijn Profiel</span>
                            </span>
                            <span aria-hidden className="text-(--text-muted)">›</span>
                        </Link>
                    )}

                    {navItems
                        .filter(item => {
                            if (!isAuthenticated && item.href === ROUTES.MEMBERSHIP) return false;
                            return true;
                        })
                        .map((link) => {
                            const Icon = IconMap[link.icon];
                            const active = isPathActive(pathname, link.href);

                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={onClose}
                                    className={cn(
                                        'active:scale-0.98 flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold shadow-sm transition-all',
                                        active
                                            ? 'bg-theme-purple/10 text-theme-purple'
                                            : 'bg-[color-mix(in_srgb,var(--bg-card)_70%,transparent)] text-(--text-main)'
                                    )}
                                >
                                    <span className="flex items-center gap-3 whitespace-nowrap">
                                        <Icon className="size-5 text-theme-purple" aria-hidden="true" />
                                        <span>{link.name}</span>
                                    </span>
                                    <span aria-hidden="true" className="text-(--text-muted)">›</span>
                                </Link>
                            );
                        })}
                </div>

                {/* Word-lid-knop (niet ingelogd) */}
                {mounted && !isAuthenticated && (
                    <Link
                        href={ROUTES.MEMBERSHIP}
                        onClick={onClose}
                        className="beheer-button form-button"
                    >
                        <Sparkles className="size-4" />
                        Word lid
                    </Link>
                )}

                {/* Onderste acties: uitlogknop / inlogknop */}
                <div className="mt-auto border-t border-theme-purple/10 pt-6">
                    {mounted && (
                        isAuthenticated ? (
                            <button
                                type="button"
                                onClick={onLogout}
                                className="form-button w-full bg-red-500/10 text-red-500 hover:bg-red-500/20"
                            >
                                <LogOut className="size-5" />
                                <span>Uitloggen</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => {
                                    void (async () => {
                                        try {
                                            await authClient.signIn.social({
                                                provider: 'microsoft',
                                                callbackURL: '/profiel'
                                            });
                                        } catch {
                                        }
                                    })();
                                }}
                                className="form-button w-full"
                            >
                                Inloggen
                            </button>
                        )
                    )}
                </div>
            </nav>
        </div>
    );
}
