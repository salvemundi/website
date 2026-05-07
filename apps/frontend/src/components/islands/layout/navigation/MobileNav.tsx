'use client';

import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth';
import type { IconName } from '@/lib/utils/icons';
import MobileMenu from './MobileMenu';
import { type EnrichedUser } from '@/types/auth';

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
            if (typeof window !== 'undefined') {
                window.location.href = '/?noAuto=true';
            } else {
                router.push('/');
            }
        } catch (error) {
            console.error('Logout failed:', error);
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
                className="relative z-[210] inline-flex items-center justify-center rounded-full p-2 text-[var(--text-main)] shadow-sm transition hover:bg-[var(--color-purple-100)] xl:hidden"
                style={{ backgroundColor: 'color-mix(in srgb, var(--bg-card) 80%, transparent)' }}
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label={menuOpen ? "Sluit menu" : "Open menu"}
                aria-expanded={menuOpen}
            >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <MobileMenu 
                isOpen={menuOpen}
                onClose={() => setMenuOpen(false)}
                user={user}
                isAuthenticated={isAuthenticated}
                navItems={navItems}
                canAccessAdmin={canAccessAdmin}
                onLogout={onLogout}
                mounted={true}
            />
        </>
    );
}
