'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box, Group, Text } from '@mantine/core';
import { cn } from '@/lib/utils/cn';
import { isPathActive } from '@/lib/utils/link-utils';
import Image from 'next/image';
import { ThemeToggle } from '@/components/islands/layout/ThemeToggle';
import { getPublicNavRoutes, MIN_VISIBLE_NAV_ITEMS } from '@/lib/config/routes';
import { HeaderShell } from './navigation/HeaderShell';
import { NavUserSection } from './navigation/NavUserSection';
import { MobileNav } from './navigation/MobileNav';
import { type ExtendedSession } from '@/types/auth';

import { BRAND_CONFIG } from '@/lib/config/brand';

const NAV_ITEM_GAP_PX = 16;

interface NavigationHeaderProps {
    disabledRoutes?: string[];
    initialSession?: ExtendedSession | null;
    canAccessAdmin?: boolean;
}

const NavigationHeader = ({
    disabledRoutes = [],
    initialSession,
    canAccessAdmin: initialCanAccessAdmin = false
}: NavigationHeaderProps) => {
    const pathname = usePathname() || '/';
    const user = initialSession?.user ?? null;
    const isAuthenticated = !!user;

    const canAccessAdmin = !!(initialCanAccessAdmin || user?.permissions?.includes('ict') || (user?.committees && user.committees.length > 0));

    const navItems = useMemo(() => getPublicNavRoutes(disabledRoutes), [disabledRoutes]);
    const navRef = useRef<HTMLDivElement | null>(null);
    const measureRef = useRef<HTMLDivElement | null>(null);
    const [visibleHrefs, setVisibleHrefs] = useState<Set<string>>(
        () => new Set<string>(navItems.filter((item) => item.priority === 1).map((item) => item.href))
    );

    useEffect(() => {
        const navEl = navRef.current;
        const measureEl = measureRef.current;
        if (!navEl || !measureEl) return;

        const recalculate = () => {
            const availableWidth = navEl.clientWidth;
            const widthByHref = new Map<string, number>();

            for (const child of Array.from(measureEl.children)) {
                if (child instanceof HTMLElement && child.dataset.href) {
                    widthByHref.set(child.dataset.href, child.offsetWidth);
                }
            }

            const prioritized = [...navItems].sort((a, b) => a.priority - b.priority);
            const selected = new Set<string>();
            let usedWidth = 0;

            for (const item of prioritized) {
                const itemWidth = widthByHref.get(item.href) ?? 0;
                const nextWidth = selected.size === 0 ? itemWidth : usedWidth + NAV_ITEM_GAP_PX + itemWidth;

                if (nextWidth <= availableWidth) {
                    selected.add(item.href);
                    usedWidth = nextWidth;
                }
            }

            const threshold = Math.min(MIN_VISIBLE_NAV_ITEMS, navItems.length);
            const nextHrefs = selected.size < threshold ? new Set<string>() : selected;

            setVisibleHrefs((prev) => {
                if (prev.size === nextHrefs.size && [...prev].every((href) => nextHrefs.has(href))) {
                    return prev;
                }
                return nextHrefs;
            });
        };

        recalculate();
        const ro = new ResizeObserver(recalculate);
        ro.observe(navEl);
        return () => ro.disconnect();
    }, [navItems]);

    const visibleNavItems = navItems.filter((item) => visibleHrefs.has(item.href));
    const showHamburger = visibleHrefs.size === 0;

    return (
        <HeaderShell>
            <Group
                h={80}
                w="100%"
                justify="space-between"
                align="center"
                gap="md"
                px={{ base: 'md', lg: 'xl' }}
                wrap="nowrap"
                pos="relative"
                style={{ zIndex: 10 }}
            >
                <Box style={{ flexShrink: 0 }}>
                    <Link href="/" className="group hover:scale-1.03 flex items-center gap-3 transition-transform duration-300 active:scale-95">
                        <Box pos="relative" w={48} h={48}>
                            <Image
                                src={BRAND_CONFIG.logoLightMode}
                                alt="Salve Mundi Logo"
                                fill
                                className="object-contain dark:hidden"
                                priority
                            />
                            <Image
                                src={BRAND_CONFIG.logoDarkMode}
                                alt="Salve Mundi Logo"
                                fill
                                className="hidden object-contain dark:block"
                                priority
                            />
                        </Box>
                        <Box visibleFrom="md" style={{ whiteSpace: 'nowrap' }}>
                            <Text fz={13} lh={1} fw={600} c="brand">
                                Salve Mundi
                            </Text>
                            <Text fz="xs" fw={600} mt={2}>
                                Fontys ICT
                            </Text>
                        </Box>
                    </Link>
                </Box>

                <Box
                    component="nav"
                    ref={navRef}
                    pos="relative"
                    py={10}
                    style={{
                        flex: 1,
                        minWidth: 0,
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    aria-label="Hoofdnavigatie"
                >
                    <Group
                        ref={measureRef}
                        gap={NAV_ITEM_GAP_PX}
                        wrap="nowrap"
                        aria-hidden="true"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            visibility: 'hidden',
                            pointerEvents: 'none',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {navItems.map((link) => (
                            <Box
                                component="span"
                                key={link.href}
                                data-href={link.href}
                                fz="clamp(13px, 1vw, 15px)"
                                fw={600}
                                style={{
                                    display: 'inline-flex',
                                    flexShrink: 0,
                                    alignItems: 'center',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {link.name}
                            </Box>
                        ))}
                    </Group>

                    {visibleNavItems.length > 0 && (
                        <Group gap={NAV_ITEM_GAP_PX} justify="center" wrap="nowrap">
                            {visibleNavItems.map((link) => {
                                const active = isPathActive(pathname, link.href);
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        aria-current={active ? 'page' : undefined}
                                        className={cn(
                                            'group relative inline-flex shrink-0 items-center gap-2 text-sm font-semibold whitespace-nowrap transition-all duration-200',
                                            active ? 'text-primary' : 'text-foreground',
                                            !active && 'hover:text-primary'
                                        )}
                                    >
                                        <Text component="span" inherit fz="clamp(13px, 1vw, 15px)" fw={600}>
                                            {link.name}
                                        </Text>
                                        <Box
                                            component="span"
                                            mod={{ 'nav-underline': true }}
                                            pos="absolute"
                                            bottom={-8}
                                            left={0}
                                            h={2}
                                            w="100%"
                                            bg="var(--primary)"
                                            style={{
                                                transformOrigin: 'left',
                                                borderRadius: '9999px',
                                                transition: 'transform 200ms ease-out',
                                            }}
                                        />
                                    </Link>
                                );
                            })}
                        </Group>
                    )}
                </Box>

                <Group gap="xs" wrap="nowrap" justify="flex-end" style={{ flexShrink: 0 }}>
                    <NavUserSection
                        initialSession={initialSession}
                        canAccessAdmin={canAccessAdmin}
                    />

                    <ThemeToggle />

                    <MobileNav
                        user={user}
                        isAuthenticated={isAuthenticated}
                        navItems={navItems}
                        canAccessAdmin={canAccessAdmin}
                        visible={showHamburger}
                    />
                </Group>
            </Group>
        </HeaderShell>
    );
};

export default NavigationHeader;
