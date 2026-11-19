'use client';

import { Card, Stack, Text } from '@mantine/core';

interface StatCardProps {
    label: string;
    value: number | string;
}

export default function StatCard({ label, value }: StatCardProps) {
    return (
        <Card padding="md" radius="lg" h="100%">
            <Stack gap={4} justify="center" h="100%">
                <Text size="xs" fw={800} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.08em' }}>
                    {label}
                </Text>
                <Text fz={{ base: 'lg', xl: '1.35rem' }} fw={900} lh={1.15} style={{ overflowWrap: 'anywhere' }}>
                    {value}
                </Text>
            </Stack>
        </Card>
    );
}
