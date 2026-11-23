'use client';

import { useTransition } from 'react';
import { Shield, X, User } from 'lucide-react';
import { Badge, Box, Button, Container, Group, Text } from '@mantine/core';
import { clearImpersonateToken } from '@/server/actions/beheer/impersonation/beheer-impersonation.actions';

interface Props {
    targetName: string;
    adminName: string;
    committees: string[];
}

export default function ImpersonationBanner({ targetName, adminName, committees }: Props) {
    const [isPending, startTransition] = useTransition();

    const handleStop = () => {
        startTransition(async () => {
            await clearImpersonateToken();
            window.location.reload();
        });
    };

    return (
        <Box
            pos="fixed"
            top={0}
            left={0}
            right={0}
            bg="accent"
            c="darkBase"
            style={{ zIndex: 9999 }}
        >
            <Container size="xl" py={6} px="md">
                <Group justify="space-between" gap="md" wrap="nowrap">
                    <Group gap="xs" wrap="nowrap" style={{ minWidth: 0, overflow: 'hidden' }}>
                        <Shield size={16} style={{ flexShrink: 0 }} />
                        <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
                            <Text size="sm" fw={600} visibleFrom="sm">
                                Test Modus Actief:
                            </Text>
                            <Badge
                                color="darkBase"
                                size="md"
                                leftSection={<User size={12} />}
                            >
                                {targetName}
                            </Badge>
                            <Text size="sm" fs="italic" visibleFrom="lg">
                                (Geïmiteerd door {adminName})
                            </Text>
                            {committees.length > 0 && (
                                <Text size="sm" truncate="end" visibleFrom="md">
                                    – ({committees.join(', ')})
                                </Text>
                            )}
                        </Group>
                    </Group>

                    <Button
                        type="button"
                        size="xs"
                        onClick={handleStop}
                        loading={isPending}
                        leftSection={<X size={12} />}
                        style={{ flexShrink: 0 }}
                    >
                        Stop Testen
                    </Button>
                </Group>
            </Container>
        </Box>
    );
}
