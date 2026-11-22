'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { User, Shield } from 'lucide-react';
import { Avatar, Box, Button, Group } from '@mantine/core';
import { authClient } from '@/lib/auth';
import { getImageUrl } from '@/lib/utils/image-utils';
import { ROUTES } from '@/lib/config/routes';
import { getLoginCallbackURL } from '@/lib/utils/login-redirect';
import { type ExtendedSession } from '@/types/auth';

interface NavUserSectionProps {
    initialSession: ExtendedSession | null | undefined;
    canAccessAdmin: boolean;
}

export function NavUserSection({ initialSession, canAccessAdmin }: NavUserSectionProps) {
    const searchParams = useSearchParams();

    const session = initialSession;
    const user = session?.user ?? null;
    const isAuthenticated = !!user;

    const showAdmin = isAuthenticated && canAccessAdmin;

    return (
        <Group gap="xs" wrap="nowrap" justify="flex-end" style={{ flexShrink: 0 }}>
            {showAdmin && (
                <Button
                    component={Link}
                    href={ROUTES.ADMIN}
                    size="sm"
                    leftSection={<Shield size={16} />}
                    aria-label="Beheer"
                >
                    <Box component="span" visibleFrom="lg">
                        Beheer
                    </Box>
                </Button>
            )}

            {isAuthenticated ? (
                <Button
                    component={Link}
                    href={ROUTES.ACCOUNT}
                    size="sm"
                    leftSection={
                        <Avatar
                            src={user.avatar ? getImageUrl(user.avatar) : undefined}
                            alt={user.name || 'Profiel'}
                            size={22}
                            color="brand"
                        >
                            <User size={14} />
                        </Avatar>
                    }
                    aria-label="Mijn profiel"
                >
                    <Box component="span" visibleFrom="lg">
                        Mijn profiel
                    </Box>
                </Button>
            ) : (
                <Button
                    size="sm"
                    onClick={() => {
                        void authClient.signIn.social({
                            provider: 'microsoft',
                            callbackURL: getLoginCallbackURL(searchParams.get('callbackURL'), ROUTES.MEMBERSHIP)
                        });
                    }}
                    type="button"
                >
                    Inloggen
                </Button>
            )}
        </Group>
    );
}
