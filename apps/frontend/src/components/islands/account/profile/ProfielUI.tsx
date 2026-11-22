'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Lock, ExternalLink } from 'lucide-react';
import { Box, Button, Card, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core';

interface TileProps {
    title?: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    actions?: React.ReactNode;
}

export function Tile({
    title, icon, children, actions
}: TileProps) {
    return (
        <Card padding="xl" shadow="md">
            <Stack gap="lg">
                {(title || actions) && (
                    <Group justify="space-between" align="center" wrap="wrap" gap="md">
                        <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                            {icon && (
                                <ThemeIcon size="lg">
                                    {icon}
                                </ThemeIcon>
                            )}
                            {title && (
                                <Title order={2} size="h3" c="brand" style={{ wordBreak: 'break-word' }}>
                                    {title}
                                </Title>
                            )}
                        </Group>
                        {actions && <Box>{actions}</Box>}
                    </Group>
                )}
                <Box>{children}</Box>
            </Stack>
        </Card>
    );
}

interface QuickLinkProps {
    label: string;
    subtitle?: string;
    icon: React.ReactNode;
    onClick?: () => void;
    href?: string;
    locked?: boolean;
    external?: boolean;
}

export function QuickLink({
    label, subtitle, icon, onClick, href, locked, external
}: QuickLinkProps) {
    const rightSection = (
        <Group gap="xs" wrap="nowrap" c="dimmed">
            {locked && <Lock size={14} />}
            {external && <ExternalLink size={14} />}
            <ChevronRight size={16} />
        </Group>
    );

    const content = (
        <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
            <Text span inherit lh={1}>
                {icon}
            </Text>
            <Stack gap={0} align="flex-start" style={{ minWidth: 0 }}>
                <Text span inherit truncate>
                    {label}
                </Text>
                {subtitle && (
                    <Text size="xs" c="dimmed" fw={500} lh={1.2}>
                        {subtitle}
                    </Text>
                )}
            </Stack>
        </Group>
    );

    if (href) {
        return (
            <Button
                component={Link}
                href={href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noopener noreferrer' : undefined}
                fullWidth
                size="md"
                h="auto"
                py="sm"
                justify="space-between"
                rightSection={rightSection}
            >
                {content}
            </Button>
        );
    }

    return (
        <Button
            type="button"
            onClick={onClick}
            fullWidth
            size="md"
            h="auto"
            py="sm"
            justify="space-between"
            rightSection={rightSection}
        >
            {content}
        </Button>
    );
}

export const formatForBreak = (text: string | null | undefined) => {
    if (!text) return null;
    return text.split('').map((char, i) => (
        <Text span inherit key={i}>
            {char}
            {(char === '@' || char === '.' || char === '-' || char === '_') && <wbr />}
        </Text>
    ));
};
