'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Newspaper, Calendar, ChevronRight } from 'lucide-react';

export default function IntroLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

    // Show sidebar/nav for any intro route (including /intro)
    const isIntroSubpage = pathname?.startsWith('/intro');

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
            <div className="relative">
                {/* Desktop Sidebar Navigation - Only show on subpages */}
                {isIntroSubpage && (
                    <aside
                        className={`hidden md:block fixed left-4 bg-[var(--bg-card)] border border-theme-purple/10 rounded-xl transition-all duration-300 z-50 shadow-lg ${
                            isSidebarExpanded ? 'w-56' : 'w-14'
                        }`}
                        onMouseEnter={() => setIsSidebarExpanded(true)}
                        onMouseLeave={() => setIsSidebarExpanded(false)}
                        style={{ top: 'calc(var(--pageheader-height, var(--header-height, 80px)) + 1rem)' }}
                    >
                        <div className="flex flex-col py-4">
                        {/* Logo/Indicator */}
                        <div className="px-3 mb-6 flex items-center justify-center">
                            <div className={`w-7 h-7 rounded-full bg-gradient-theme flex items-center justify-center transition-all duration-300 ${
                                isSidebarExpanded ? 'scale-110' : ''
                            }`}>
                                <ChevronRight className={`w-4 h-4 text-white transition-transform duration-300 ${
                                    isSidebarExpanded ? 'rotate-180' : ''
                                }`} />
                            </div>
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
                )}

                {/* Mobile Top Navigation */}
                <nav className="md:hidden bg-[var(--bg-card)] border-b border-theme-purple/10 sticky top-0 z-40 backdrop-blur-lg bg-opacity-90">
                <div className="px-4 py-3">
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

                {/* Page Content - no margin needed since sidebar is now floating */}
                <div className="flex-1 w-full">
                    {children}
                </div>
            </div>
        </div>
    );
}
