'use client';

import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth';
import type { IconName } from '@/lib/utils/icons';
import MobileMenu from './MobileMenu';
import { type EnrichedUser } from '@/types/auth';
import { safeConsoleError } from '@/server/utils/logger';

interface MobileNavProps {
    user: EnrichedUser | null;
    isAuthenticated: boolean;
    navItems: { name: string; href: string; icon: IconName }[];
    canAccessAdmin: boolean;
    onLogout: () => void;
}

export function MobileNav({ user, isAuthenticated, navItems, canAccessAdmin }: Omit<MobileNavProps, 'onLogout'>) {
    const [menuOpen, setMenuOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    const onLogout = async () => {
        try {
            await authClient.signOut();
            setMenuOpen(false);
            router.push('/?noAuto=true');
            router.refresh();
        } catch (error) {
            safeConsoleError('[MobileNav.tsx][MobileNav] Logout function failed:', error);
        }
    };

    useEffect(() => {
        setMenuOpen(false);
    }, [pathname]);

    useEffect(() => {
        document.body.style.overflow = menuOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [menuOpen]);

    return (
        <>
            <button
                type="button"
                className="relative z-210 icon-button inline-flex items-center justify-center rounded-full p-2 text-(--text-main) shadow-sm transition-transform duration-200 hover:scale-110 hover:bg-purple-100 active:scale-95 lg:hidden dark:hover:bg-white/10"
                style={{ backgroundColor: 'color-mix(in srgb, var(--bg-card) 80%, transparent)' }}
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label={menuOpen ? "Sluit menu" : "Open menu"}
                aria-expanded={menuOpen}
            >
                {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>

            <MobileMenu
                isOpen={menuOpen}
                onClose={() => setMenuOpen(false)}
                user={user}
                isAuthenticated={isAuthenticated}
                navItems={navItems}
                canAccessAdmin={canAccessAdmin}
                onLogout={() => { void onLogout(); }}
                mounted={true}
            />
        </>
    );
}
