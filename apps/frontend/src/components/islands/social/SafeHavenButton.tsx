'use client';

import { useRouter } from 'next/navigation';
import { Shield, ChevronRight } from 'lucide-react';
import { Card, Group, Stack, Text, ThemeIcon, Title, UnstyledButton } from '@mantine/core';

export default function SafeHavenButton() {
    const router = useRouter();

    return (
        <UnstyledButton
            type="button"
            w="100%"
            onClick={() => router.push('/safe-havens')}
        >
            <Card padding="lg" withBorder shadow="sm">
                <Group justify="space-between" wrap="nowrap" gap="md">
                    <Group gap="md" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
                        <ThemeIcon size="lg">
                            <Shield size={24} />
                        </ThemeIcon>
                        <Stack gap={2} style={{ minWidth: 0 }}>
                            <Title order={4} size="h4">
                                Safe Havens
                            </Title>
                            <Text size="sm" c="dimmed">
                                Veilig aanspreekpunt voor hulp
                            </Text>
                        </Stack>
                    </Group>
                    <Text span c="dimmed" lh={1}>
                        <ChevronRight size={20} />
                    </Text>
                </Group>
            </Card>
        </UnstyledButton>
    );
}
