'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Newspaper, Calendar } from 'lucide-react';

export default function IntroLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

    // Determine which intro page we're on
    const isMainIntroPage = pathname === '/intro';
    const isBlogOrPlanning = pathname?.startsWith('/intro/blog') || pathname?.startsWith('/intro/planning');

    const navItems = [
        { href: '/intro', label: 'Aanmelden', icon: Users },
        { href: '/intro/blog', label: 'Blog & Updates', icon: Newspaper },
        { href: '/intro/planning', label: 'Planning', icon: Calendar },
    ];

    const isActive = (href: string) => {
        if (href === '/intro') {
            return pathname === '/intro';
        }
        return pathname?.startsWith(href);
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Floating Back to Main Site Button - Only on blog/planning pages */}
            {isBlogOrPlanning && (
                <Link
                    href="/"
                    className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-[var(--bg-card)] hover:bg-gradient-theme hover:text-white text-theme-purple rounded-full shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-sm group"
                >
                    <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="hidden sm:inline">Terug naar hoofdsite</span>
                    <span className="sm:hidden">Terug</span>
                </Link>
            )}

            <div className="relative">
                {/* Desktop Sidebar Navigation - Always show, position based on page */}
                <aside
                    className={`hidden md:block fixed left-4 bg-[var(--bg-card)] border border-theme-purple/10 rounded-xl transition-all duration-300 z-40 shadow-lg ${
                        isSidebarExpanded ? 'w-56' : 'w-14'
                    }`}
                    style={isMainIntroPage ? { top: '50%', transform: 'translateY(-50%)' } : { top: '1rem' }}
                    onMouseEnter={() => setIsSidebarExpanded(true)}
                    onMouseLeave={() => setIsSidebarExpanded(false)}
                >
                    <div className="flex flex-col py-4">
                        {/* Logo/Branding */}
                        <div className="px-3 mb-6 flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full bg-gradient-theme flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                                isSidebarExpanded ? 'scale-110' : ''
                            }`}>
                                <img src="/logo_old.svg" alt="Intro" className="w-5 h-5" />
                            </div>
                            <span className={`font-bold text-theme-purple text-sm transition-all duration-300 whitespace-nowrap ${
                                isSidebarExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 w-0 overflow-hidden'
                            }`}>
                                Intro Week
                            </span>
                        </div>

                        {/* Navigation Items */}
                        <nav className="flex-1 space-y-1 px-2">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.href);
                                
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-2 px-2 py-2.5 rounded-lg font-semibold transition-all duration-300 group ${
                                            active
                                                ? 'bg-gradient-theme text-white shadow-lg'
                                                : 'text-theme hover:bg-theme-purple/10'
                                        }`}
                                    >
                                        <Icon className={`w-5 h-5 flex-shrink-0 ${
                                            active ? '' : 'group-hover:scale-110 transition-transform'
                                        }`} />
                                        <span className={`whitespace-nowrap text-sm transition-all duration-300 ${
                                            isSidebarExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 w-0 overflow-hidden'
                                        }`}>
                                            {item.label}
                                        </span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </aside>

                {/* Mobile Navigation - Only on blog/planning pages */}
                {isBlogOrPlanning && (
                    <nav 
                        className="md:hidden bg-[var(--bg-card)] border-b border-theme-purple/10 sticky z-40 backdrop-blur-lg bg-opacity-90"
                        style={{ top: '0' }}
                    >
                        <div className="px-4 py-3 pt-16">
                            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    const active = isActive(item.href);
                                    
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all duration-300 whitespace-nowrap text-sm ${
                                                active
                                                    ? 'bg-gradient-theme text-white shadow-lg'
                                                    : 'bg-theme-purple/10 text-theme'
                                            }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </nav>
                )}

                {/* Page Content */}
                <div className="flex-1 w-full">
                    {children}
                </div>
            </div>
        </div>
    );
}
