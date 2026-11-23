'use client';

import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth';
import type { IconName } from '@/lib/utils/icons';
import MobileMenu from './MobileMenu';
import { ActionIcon } from '@mantine/core';
import { type EnrichedUser } from '@/types/auth';
import { safeConsoleError } from '@/server/utils/logger';

interface MobileNavProps {
    user: EnrichedUser | null;
    isAuthenticated: boolean;
    navItems: { name: string; href: string; icon: IconName }[];
    canAccessAdmin: boolean;
    onLogout: () => void;
    visible?: boolean;
}

export function MobileNav({ user, isAuthenticated, navItems, canAccessAdmin, visible = true }: Omit<MobileNavProps, 'onLogout'>) {
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
        document.body.style.overflow = visible && menuOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [menuOpen, visible]);

    if (!visible) return null;

    return (
        <>
            <ActionIcon
                size="lg"
                pos="relative"
                style={{ zIndex: 210 }}
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label={menuOpen ? "Sluit menu" : "Open menu"}
                aria-expanded={menuOpen}
            >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </ActionIcon>

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
