import React from 'react';
import Link from '@/components/ui/Link';
import { ChevronRight } from 'lucide-react';
import { Anchor, Card, Group, Stack, Text, ThemeIcon } from '@mantine/core';

type ActionCardColor = 'brand' | 'accent';

interface ActionCardProps {
    title?: string;
    subtitle?: string;
    value?: string | number;
    icon?: React.ReactNode;
    href?: string;
    pulse?: boolean;
    color?: ActionCardColor;
    disabled?: boolean;
    isExternal?: boolean;
}

export function ActionCard({
    title = '',
    subtitle,
    value,
    icon,
    href,
    pulse = false,
    color = 'brand',
    disabled = false,
    isExternal = false,
}: ActionCardProps) {
    const isLink = !disabled && Boolean(href);

    const cardContent = (
        <Card
            withBorder
            padding="sm"
            style={{
                opacity: disabled ? 0.5 : 1,
                cursor: disabled ? 'not-allowed' : isLink ? 'pointer' : undefined,
                borderColor: pulse ? `var(--mantine-color-${color}-filled)` : undefined,
            }}
        >
            <Group justify="space-between" wrap="nowrap" gap="sm">
                <Group gap="sm" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
                    {icon && (
                        <ThemeIcon
                            size="md"
                            color={color}
                        >
                            {React.isValidElement(icon)
                                ? React.cloneElement(icon as React.ReactElement<{ size?: number }>, { size: 19 })
                                : icon}
                        </ThemeIcon>
                    )}

                    <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
                        <Text size="sm" fw={600} truncate="end">
                            {title}
                        </Text>
                        {subtitle && (
                            <Text size="xs" c="dimmed" truncate="end">
                                {subtitle}
                            </Text>
                        )}
                    </Stack>
                </Group>

                <Group gap="xs" wrap="nowrap">
                    {value !== undefined && (
                        <Text size="lg" fw={700} style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {value}
                        </Text>
                    )}

                    {isLink && (
                        <ChevronRight size={16} opacity={0.45} />
                    )}
                </Group>
            </Group>
        </Card>
    );

    if (isLink && href) {
        if (isExternal) {
            return (
                <Anchor
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="never"
                    display="block"
                >
                    {cardContent}
                </Anchor>
            );
        }

        return (
            <Anchor
                component={Link}
                href={href}
                underline="never"
                display="block"
            >
                {cardContent}
            </Anchor>
        );
    }

    return cardContent;
}
