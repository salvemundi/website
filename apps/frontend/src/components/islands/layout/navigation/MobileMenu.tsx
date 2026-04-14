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

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
    isAuthenticated: boolean;
    navItems: { name: string; href: string; icon: IconName }[];
    isCommitteeMember: boolean;
    onLogout: () => void;
    mounted: boolean;
}

export default function MobileMenu({
    isOpen,
    onClose,
    user,
    isAuthenticated,
    navItems,
    isCommitteeMember,
    onLogout,
    mounted
}: MobileMenuProps) {
    return (
        <div
            className={`lg:hidden ${isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
                } transition-opacity duration-200`}
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-[var(--color-purple-900)]/40 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden={!isOpen}
            />

            {/* Slide-out paneel */}
            <nav
                className={`fixed right-0 z-50 flex w-full max-w-xs flex-col gap-6 bg-[var(--bg-main)] px-6 py-8 shadow-xl transition-transform duration-300 overflow-y-auto ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
                style={{ top: 0, height: '100dvh' }}
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
                                    src={(user.avatar ? getImageUrl(user.avatar) : '') as string}
                                    alt={user.name || 'Profiel'}
                                    fill
                                    className="object-cover"
                                    priority
                                    unoptimized
                                />
                            ) : (
                                <Image
                                    src="/img/newlogo.png"
                                    alt=""
                                    width={28}
                                    height={28}
                                    className="h-7 w-7"
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
                    {isCommitteeMember && (
                        <Link
                            href={ROUTES.ADMIN}
                            onClick={onClose}
                            className="flex items-center gap-2 rounded-2xl bg-[var(--color-purple-500)] text-[var(--color-white)] px-4 py-3 text-sm font-semibold shadow-lg"
                        >
                            <Shield className="h-5 w-5" />
                            <span>Admin Panel</span>
                        </Link>
                    )}

                    {navItems.map((link) => {
                        const Icon = IconMap[link.icon];
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={onClose}
                                className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold text-[var(--text-main)] shadow-sm bg-[color-mix(in_srgb,var(--bg-card)_70%,transparent)]"
                            >
                                <span className="flex items-center gap-3 whitespace-nowrap">
                                    {Icon && <Icon className="h-5 w-5 text-[var(--text-main)]" aria-hidden />}
                                    <span>{link.name}</span>
                                </span>
                                <span aria-hidden className="text-[var(--text-muted)]">›</span>
                            </Link>
                        );
                    })}
                </div>

                {/* Word-lid-knop (niet ingelogd) */}
                {mounted && !isAuthenticated && (
                    <Link
                        href={ROUTES.MEMBERSHIP}
                        onClick={onClose}
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
                            href={ROUTES.SAFE_HAVENS}
                            onClick={onClose}
                            className="inline-flex items-center justify-center h-12 w-12 rounded-full text-[var(--text-main)] shadow-sm"
                            style={{ backgroundColor: 'color-mix(in srgb, var(--bg-card) 70%, transparent)' }}
                            aria-label="Safe Havens"
                        >
                            <Shield className="h-5 w-5" aria-hidden />
                            <span className="sr-only">Safe Havens</span>
                        </Link>

                        {mounted && (
                            isAuthenticated ? (
                                <button
                                    type="button"
                                    onClick={onLogout}
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
                                            // Handle error
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
                            )
                        )}
                    </div>
                </div>
            </nav>
        </div>
    );
}
