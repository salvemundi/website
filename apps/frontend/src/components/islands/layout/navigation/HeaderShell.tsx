'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { authClient } from '@/lib/auth';

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
            }).catch(console.error);
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

    // Height calculation (CSS variables)
    useEffect(() => {
        const el = headerRef.current;
        if (!el) return;
        const applyHeight = (h: number) => {
            document.documentElement.style.setProperty('--header-height', `${h}px`);
        };
        applyHeight(el.offsetHeight || 80);
        
        const ro = new ResizeObserver(() => {
            applyHeight(el.offsetHeight || 80);
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
                "fixed z-[100] w-full transition-all duration-300 flex flex-col justify-center",
                (mounted && isScrolled) 
                    ? "bg-white/95 dark:bg-black/95 backdrop-blur-md shadow-md" 
                    : "bg-white/50 dark:bg-black/50 backdrop-blur-sm"
            )}
            style={{ 
                top: 'calc(var(--impersonation-banner-height, 0px) - 1px)',
                minHeight: 'calc(80px + env(safe-area-inset-top, 0px))',
                paddingTop: 'env(safe-area-inset-top, 0px)'
            }}
        >
            <div className="w-full flex-1 flex items-center justify-center min-h-[80px]">
                {children}
            </div>
            {mobileMenu}
        </header>
    );
}
