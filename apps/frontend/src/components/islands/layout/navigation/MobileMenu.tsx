'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
    X, Shield, Sparkles, LogOut
} from 'lucide-react';
import { ROUTES } from '@/lib/config/routes';
import { getImageUrl } from '@/lib/utils/image-utils';
import { authClient } from '@/lib/auth';
import { IconMap, type IconName } from '@/lib/utils/icons';

interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    avatar?: string | null;
    isAdmin?: boolean;
    isICT?: boolean;
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
    return (
        <div
            className={`xl:hidden ${isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
                } transition-opacity duration-200`}
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[190] bg-black/40 backdrop-blur-sm transition-all duration-300"
                onClick={onClose}
                aria-hidden={!isOpen}
                role="presentation"
            />

            {/* Slide-out paneel */}
            <nav
                className={`fixed right-0 z-[200] flex w-full max-w-xs flex-col gap-6 bg-[var(--bg-main)] px-6 py-8 shadow-2xl transition-transform duration-300 overflow-y-auto ${isOpen ? 'translate-x-0' : 'translate-x-full'
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
                        <span className="inline-flex relative h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-card)] shadow-sm overflow-hidden">
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
                                <Image
                                    src="/img/newlogo.svg"
                                    alt="Logo"
                                    width={32}
                                    height={32}
                                    className="h-8 w-8 object-contain"
                                />
                            )}
                        </span>
                        <span className="text-sm font-semibold text-[var(--text-main)]">
                            Salve Mundi
                        </span>
                    </Link>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full bg-[var(--bg-card)] p-2 text-[var(--text-main)] shadow-sm transition hover:bg-[var(--color-purple-100)]"
                        aria-label="Sluit navigatie"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Navigatielinks */}
                <div className="space-y-4">
                    {canAccessAdmin && (
                        <Link
                            href={ROUTES.ADMIN}
                            onClick={onClose}
                            className="flex items-center gap-2 rounded-2xl bg-[var(--color-purple-500)] text-white px-4 py-3 text-sm font-semibold shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
                        >
                            <Shield className="h-5 w-5" />
                            <span>Beheer</span>
                        </Link>
                    )}

                    {isAuthenticated && (
                        <Link
                            href={ROUTES.ACCOUNT}
                            onClick={onClose}
                            className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold text-[var(--text-main)] shadow-sm bg-[var(--bg-card)] border border-[var(--border-color)]/10 active:scale-95 transition-all"
                        >
                            <span className="flex items-center gap-3">
                                <IconMap.User className="h-5 w-5 text-[var(--color-purple-500)]" />
                                <span>Mijn Profiel</span>
                            </span>
                            <span aria-hidden className="text-[var(--text-muted)]">›</span>
                        </Link>
                    )}

                    {navItems
                        .filter(item => {
                            // Verwijder redundant lidmaatschap link als we de "Word lid" knop tonen
                            if (!isAuthenticated && item.href === ROUTES.MEMBERSHIP) return false;
                            return true;
                        })
                        .map((link) => {
                            const Icon = IconMap[link.icon];
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={onClose}
                                    className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold text-[var(--text-main)] shadow-sm bg-[color-mix(in_srgb,var(--bg-card)_70%,transparent)] active:scale-[0.98] transition-all"
                                >
                                    <span className="flex items-center gap-3 whitespace-nowrap">
                                        {Icon && <Icon className="h-5 w-5 text-[var(--color-purple-500)]" aria-hidden="true" />}
                                        <span>{link.name}</span>
                                    </span>
                                    <span aria-hidden="true" className="text-[var(--text-muted)]">›</span>
                                </Link>
                            );
                        })}
                </div>

                {/* Word-lid-knop (niet ingelogd) */}
                {mounted && !isAuthenticated && (
                    <Link
                        href={ROUTES.MEMBERSHIP}
                        onClick={onClose}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold shadow-lg shadow-purple-500/10 active:scale-95 transition-all"
                        style={{
                            background: 'linear-gradient(135deg, var(--color-purple-500), var(--color-purple-700))',
                            color: 'white',
                        }}
                    >
                        <Sparkles className="h-4 w-4" />
                        Word lid
                    </Link>
                )}

                {/* Onderste acties: uitlogknop / inlogknop */}
                <div className="mt-auto pt-6 border-t border-[var(--border-color)]/10">
                    {mounted && (
                        isAuthenticated ? (
                            <button
                                type="button"
                                onClick={onLogout}
                                className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-red-500 bg-red-500/5 hover:bg-red-500/10 active:scale-95 transition-all"
                            >
                                <LogOut className="h-5 w-5" />
                                <span>Uitloggen</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={async () => {
                                    try {
                                        await authClient.signIn.social({ 
                                            provider: 'microsoft', 
                                            callbackURL: '/profiel'
                                        });
                                    } catch (error) {
                                        // Handle error
                                    }
                                }}
                                className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold shadow-lg shadow-purple-500/10 active:scale-95 transition-all"
                                style={{
                                    backgroundColor: 'var(--color-purple-500)',
                                    color: 'white',
                                }}
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
