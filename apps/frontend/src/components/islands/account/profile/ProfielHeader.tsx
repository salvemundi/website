'use client';

import React, { useMemo, useState } from 'react';
import { Camera, Star } from 'lucide-react';
import { Badge, Box, Center, FileButton, Group, Paper, Stack, Text, Title, UnstyledButton } from '@mantine/core';
import { Tile } from './ProfielUI';
import MediaAsset from '@/components/ui/media/MediaAsset';
import { getImageUrl } from '@/lib/utils/image-utils';
import { formatDate } from '@/shared/lib/utils/date';

interface Committee {
    id: string | number;
    name: string;
    is_leader: boolean;
}

interface ProfielHeaderProps {
    user: {
        first_name?: string | null;
        last_name?: string | null;
        avatar?: string | null;
        image?: string | null;
        committees?: Committee[];
        membership_expiry?: string | null;
        onAvatarChange?: (file: File) => void;
    };
    membershipStatus: {
        text: string;
        color: string;
        textColor: string;
    };
}

export default function ProfielHeader({ user, membershipStatus }: ProfielHeaderProps) {
    const isCommitteeMember = Array.isArray(user.committees) && user.committees.length > 0;
    const [random] = useState(() => (isCommitteeMember ? Math.floor(Math.random() * 500) : -1));
    const [avatarHovered, setAvatarHovered] = useState(false);

    const displayName = useMemo(() => {
        if (isCommitteeMember && random === 0) {
            return 'Vouw een Bak!';
        }

        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        return fullName || 'Niet ingesteld';
    }, [user.first_name, user.last_name, isCommitteeMember, random]);

    const statusBadgeProps = useMemo(() => {
        if (membershipStatus.color === 'error') {
            return { color: 'error', variant: 'filled' as const };
        }
        if (membershipStatus.color === 'brand-filled') {
            return { color: 'brand', variant: 'filled' as const };
        }
        return { color: 'brand', variant: 'light' as const };
    }, [membershipStatus.color]);

    return (
        <Tile>
            <Stack align="center" gap="lg" ta="center">
                <FileButton
                    onChange={(file) => {
                        if (file) user.onAvatarChange?.(file);
                    }}
                    accept="image/*"
                >
                    {(props) => (
                        <UnstyledButton
                            {...props}
                            type="button"
                            title="Profielfoto wijzigen"
                            aria-label="Profielfoto wijzigen"
                            onMouseEnter={() => setAvatarHovered(true)}
                            onMouseLeave={() => setAvatarHovered(false)}
                        >
                            <Box
                                pos="relative"
                                w={{ base: 112, sm: 128 }}
                                h={{ base: 112, sm: 128 }}
                                style={{
                                    borderRadius: '9999px',
                                    overflow: 'hidden',
                                    border: '4px solid color-mix(in srgb, var(--primary) 25%, transparent)',
                                    backgroundColor: 'var(--mantine-color-default)',
                                    boxShadow: 'var(--mantine-shadow-md)',
                                }}
                            >
                                {user.avatar ? (
                                    <MediaAsset
                                        asset={getImageUrl(user.avatar, { width: 250, height: 250, fit: 'cover' }) || ''}
                                        alt="avatar"
                                        width={128}
                                        height={128}
                                        className="size-full object-cover"
                                    />
                                ) : (
                                    <Center h="100%" style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 15%, transparent)' }}>
                                        <Text size="2.25rem" fw={700} c="brand">
                                            {user.first_name?.[0] || '?'}
                                        </Text>
                                    </Center>
                                )}

                                <Center
                                    pos="absolute"
                                    inset={0}
                                    style={{
                                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                        color: '#FFFFFF',
                                        opacity: avatarHovered ? 1 : 0,
                                        transition: 'opacity 150ms ease',
                                    }}
                                >
                                    <Stack align="center" gap={4}>
                                        <Camera size={26} />
                                        <Text size="xs" fw={900} tt="uppercase">
                                            Wijzigen
                                        </Text>
                                    </Stack>
                                </Center>
                            </Box>
                        </UnstyledButton>
                    )}
                </FileButton>

                <Stack gap="md" w="100%" align="center">
                    <Title order={2} size="h3" c="brand" style={{ wordBreak: 'break-word' }}>
                        {displayName}
                    </Title>

                    <Badge
                        size="lg"
                        radius="xl"
                        color={statusBadgeProps.color}
                        variant={statusBadgeProps.variant}
                    >
                        {membershipStatus.text || 'Gebruiker'}
                    </Badge>

                    {Array.isArray(user.committees) && user.committees.length > 0 && (
                        <Stack gap="xs" w="100%" align="center" mt="xs">
                            <Text size="xs" fw={900} tt="uppercase" c="brand">
                                Mijn Commissies
                            </Text>
                            <Group gap="xs" justify="center" wrap="wrap">
                                {user.committees.map((committee) => {
                                    const showLeaderStar = committee.is_leader && !committee.name.toLowerCase().includes('bestuur');
                                    return (
                                        <Badge
                                            key={committee.id}
                                            variant="light"
                                            color="brand"
                                            size="lg"
                                            radius="xl"
                                            leftSection={showLeaderStar ? <Star size={12} fill="currentColor" style={{ color: 'var(--accent)' }} /> : undefined}
                                        >
                                            {committee.name.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim()}
                                        </Badge>
                                    );
                                })}
                            </Group>
                        </Stack>
                    )}

                    <Stack gap={6} w="100%" mt="xs">
                        <Text size="xs" fw={900} tt="uppercase" c="brand">
                            Lidmaatschap tot
                        </Text>
                        <Paper p="md" withBorder>
                            <Text size="md" fw={700}>
                                {user.membership_expiry
                                    ? formatDate(user.membership_expiry, 'd MMM yyyy')
                                    : 'Niet van toepassing'}
                            </Text>
                        </Paper>
                    </Stack>
                </Stack>
            </Stack>
        </Tile>
    );
}
