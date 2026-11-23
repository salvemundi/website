'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Shield, Sparkles, LogOut, ChevronRight, X } from 'lucide-react';
import {
    ActionIcon,
    Anchor,
    Avatar,
    Box,
    Button,
    Divider,
    Drawer,
    Group,
    NavLink,
    Stack,
    Text,
} from '@mantine/core';
import { isPathActive } from '@/lib/utils/link-utils';
import { ROUTES } from '@/lib/config/routes';
import { getLoginCallbackURL } from '@/lib/utils/login-redirect';
import { getImageUrl } from '@/lib/utils/image-utils';
import { BRAND_CONFIG } from '@/lib/config/brand';
import { authClient } from '@/lib/auth';
import { IconMap, type IconName } from '@/lib/utils/icons';
import { safeConsoleError } from '@/server/utils/logger';
import { type EnrichedUser } from '@/types/auth';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    user: EnrichedUser | null;
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
    mounted,
}: MobileMenuProps) {
    const pathname = usePathname() || '/';

    return (
        <Drawer
            opened={isOpen}
            onClose={onClose}
            position="right"
            size="xs"
            zIndex={200}
            withCloseButton={false}
            padding="lg"
            aria-label="Mobiele navigatie"
        >
            <Stack
                gap="lg"
                mih="calc(100dvh - 2.5rem)"
                style={{
                    paddingTop: 'env(safe-area-inset-top, 0px)',
                    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                }}
            >
                <Group justify="space-between" wrap="nowrap">
                    <Anchor component={Link} href="/" onClick={onClose} underline="never" c="inherit">
                        <Group gap="sm" wrap="nowrap">
                            {mounted && (user?.avatar || user?.image) ? (
                                <Avatar
                                    src={user.avatar ? getImageUrl(user.avatar) : (user.image || undefined)}
                                    alt={user.name || 'Profiel'}
                                    size={40}
                                    color="brand"
                                />
                            ) : (
                                <Avatar
                                    size={40}
                                    bg="var(--mantine-color-default)"
                                    style={{ boxShadow: 'var(--mantine-shadow-xs)' }}
                                >
                                    <Box pos="relative" w={32} h={32}>
                                        <Image
                                            src={BRAND_CONFIG.logoLightMode}
                                            alt="Logo"
                                            fill
                                            className="object-contain dark:hidden"
                                        />
                                        <Image
                                            src={BRAND_CONFIG.logoDarkMode}
                                            alt="Logo"
                                            fill
                                            className="hidden object-contain dark:block"
                                        />
                                    </Box>
                                </Avatar>
                            )}
                            <Text size="sm" fw={600}>
                                Salve Mundi
                            </Text>
                        </Group>
                    </Anchor>

                    <ActionIcon
                        type="button"
                        size="lg"
                        onClick={onClose}
                        aria-label="Sluit menu"
                    >
                        <X size={20} />
                    </ActionIcon>
                </Group>

                <Stack gap="xs">
                    {canAccessAdmin && (
                        <Button
                            component={Link}
                            href={ROUTES.ADMIN}
                            onClick={onClose}
                            leftSection={<Shield size={18} />}
                            fullWidth
                            justify="flex-start"
                        >
                            Beheer
                        </Button>
                    )}

                    {isAuthenticated && (
                        <NavLink
                            component={Link}
                            href={ROUTES.ACCOUNT}
                            onClick={onClose}
                            label="Mijn Profiel"
                            leftSection={<IconMap.User size={18} />}
                            rightSection={<ChevronRight size={14} />}
                            active={isPathActive(pathname, ROUTES.ACCOUNT)}
                            variant="light"
                            color="brand"
                            style={{ borderRadius: 'var(--mantine-radius-md)' }}
                        />
                    )}

                    {navItems.map((link) => {
                            const Icon = IconMap[link.icon];
                            const active = isPathActive(pathname, link.href);

                            return (
                                <NavLink
                                    key={link.href}
                                    component={Link}
                                    href={link.href}
                                    onClick={onClose}
                                    label={link.name}
                                    leftSection={<Icon size={18} aria-hidden="true" />}
                                    rightSection={<ChevronRight size={14} />}
                                    active={active}
                                    variant="light"
                                    color="brand"
                                    style={{ borderRadius: 'var(--mantine-radius-md)' }}
                                />
                            );
                        })}
                </Stack>

                {mounted && !isAuthenticated && (
                    <Button
                        component={Link}
                        href={ROUTES.MEMBERSHIP}
                        onClick={onClose}
                        leftSection={<Sparkles size={16} />}
                        fullWidth
                    >
                        Word lid
                    </Button>
                )}

                <Box mt="auto">
                    <Divider mb="md" />
                    {mounted && (
                        isAuthenticated ? (
                            <Button
                                type="button"
                                color="error"
                                fullWidth
                                leftSection={<LogOut size={18} />}
                                onClick={onLogout}
                            >
                                Uitloggen
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                fullWidth
                                onClick={() => {
                                    void authClient.signIn
                                        .social({
                                            provider: 'microsoft',
                                            callbackURL: getLoginCallbackURL(
                                                new URLSearchParams(window.location.search).get('callbackURL'),
                                                ROUTES.ACCOUNT
                                            ),
                                        })
                                        .catch((err) => {
                                            safeConsoleError('[MobileMenu.tsx][MobileMenu] Sign-in failed:', err);
                                        });
                                }}
                            >
                                Inloggen
                            </Button>
                        )
                    )}
                </Box>
            </Stack>
        </Drawer>
    );
}
