'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { authClient } from '@/lib/auth';
import { safeConsoleError } from '@/server/utils/logger';

interface HeaderShellProps {
    children: React.ReactNode;
    mobileMenu?: React.ReactNode;
}

export function HeaderShell({ children, mobileMenu }: HeaderShellProps) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isScrolled, setIsScrolled] = useState(false);
    const [mounted, setMounted] = useState(false);
    const headerRef = useRef<HTMLElement | null>(null);
 
    // Auto-login flow
    useEffect(() => {
        const needLogin = searchParams.get('needLogin');
        const callbackURL = searchParams.get('callbackURL') || '/lidmaatschap';
 
        if (needLogin === 'true') {
            router.replace(pathname || '/');
            authClient.signIn.social({ 
                provider: 'microsoft', 
                callbackURL
            }).catch(err => safeConsoleError('[HeaderShell][useEffect:Auto-login] Error during social sign-in', err));
        }
    }, [searchParams, pathname, router]);
 
    // Scroll listener & mounting
    useEffect(() => {
        setMounted(true);
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Height calculation (CSS variables) - Optimized to avoid forced reflows
    useEffect(() => {
        const el = headerRef.current;
        if (!el) return;

        const applyHeight = (h: number) => {
            // Gebruik requestAnimationFrame om style updates te batchen
            requestAnimationFrame(() => {
                document.documentElement.style.setProperty('--header-height', `${Math.round(h)}px`);
            });
        };

        // Initiële meting
        applyHeight(el.offsetHeight || 80);
        
        const ro = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry) {
                // Gebruik de data uit de observer entry in plaats van el.offsetHeight te pollen
                const height = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
                applyHeight(height);
            }
        });

        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // Hide header on certain routes
    if (pathname?.startsWith('/intro/blog') || pathname?.startsWith('/intro/planning')) {
        return null;
    }

    return (
        <header
            ref={headerRef}
            className={cn(
                "sticky z-[100] w-full transition-all duration-300 flex flex-col justify-center",
                (mounted && isScrolled)
                    ? "bg-white/95 dark:bg-black/95 backdrop-blur-md shadow-md"
                    : "bg-white/50 dark:bg-black/50 backdrop-blur-sm"
            )}
            style={{
                top: 'var(--impersonation-banner-height, 0px)',
                minHeight: 'calc(80px + env(safe-area-inset-top, 0px))',
                paddingTop: 'env(safe-area-inset-top, 0px)'
            }}
        >
            <div className="w-full flex-1 flex items-center min-h-[80px]">
                {children}
            </div>
            {mobileMenu}
        </header>
    );
}
