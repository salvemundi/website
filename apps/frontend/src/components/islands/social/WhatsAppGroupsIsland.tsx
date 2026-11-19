'use client';

import { type WhatsAppGroup } from '@salvemundi/validations/schema/profiel.zod';
import { MessageCircle, ExternalLink, ShieldAlert, Info, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Alert, Anchor, Badge, Button, Card, Container, Divider, Group, List, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { stripHtml } from '@/shared/lib/text';

interface WhatsAppGroupsIslandProps {
    groups: WhatsAppGroup[];
    gedragscodeUrl: string;
}

export const WhatsAppGroupsIsland: React.FC<WhatsAppGroupsIslandProps> = ({ groups, gedragscodeUrl }) => {
    const handleJoinGroup = (inviteLink: string) => {
        window.open(inviteLink, '_blank', 'noopener,noreferrer');
    };

    return (
        <Container size="lg" p={0}>
            <Stack gap="lg">
                <Alert
                    color="brand"
                    variant="light"
                    radius="lg"
                    title="Over WhatsApp Groepen"
                    icon={<Info size={20} />}
                >
                    Deze groepen zijn exclusief voor actieve leden. Klik op een groep om via WhatsApp lid te worden.
                    Wees respectvol en volg de groepsregels.
                </Alert>

                {groups.length === 0 ? (
                    <Card padding="xl" radius="xl" ta="center">
                        <Stack align="center" gap="sm" py="lg">
                            <ThemeIcon size={64} radius="xl" variant="light" color="brand">
                                <MessageCircle size={32} />
                            </ThemeIcon>
                            <Text fw={600}>
                                Momenteel geen WhatsApp groepen beschikbaar.
                            </Text>
                            <Text size="sm" c="dimmed">
                                Kom later terug voor nieuwe groepen om lid van te worden!
                            </Text>
                        </Stack>
                    </Card>
                ) : (
                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                        {groups.map((group) => (
                            <Card key={group.id} padding="lg" radius="xl" shadow="md">
                                <Stack justify="space-between" h="100%" gap="md">
                                    <Group align="flex-start" wrap="nowrap" gap="md">
                                        <ThemeIcon size={56} radius="xl" variant="light" color="brand">
                                            <MessageCircle size={28} />
                                        </ThemeIcon>
                                        <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                                            <Title order={3} size="h4">
                                                {group.name}
                                            </Title>
                                            {group.description && (
                                                <Text size="sm" c="dimmed" style={{ whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
                                                    {stripHtml(group.description)}
                                                </Text>
                                            )}
                                        </Stack>
                                    </Group>

                                    <Divider />

                                    <Group justify="space-between" align="center">
                                        <Badge
                                            variant="light"
                                            color="brand"
                                            size="md"
                                            leftSection={<ShieldAlert size={12} />}
                                        >
                                            Alleen Leden
                                        </Badge>
                                        <Button
                                            type="button"
                                            onClick={() => handleJoinGroup(group.invite_link)}
                                            rightSection={<ArrowRight size={16} />}
                                        >
                                            Word Lid
                                        </Button>
                                    </Group>
                                </Stack>
                            </Card>
                        ))}
                    </SimpleGrid>
                )}

                <Card padding="lg" radius="xl" shadow="md">
                    <Stack gap="sm">
                        <Title order={3} size="h5">
                            Groepsregels
                        </Title>
                        <List size="sm" c="dimmed" spacing="xs">
                            <List.Item>Wees respectvol naar alle leden</List.Item>
                            <List.Item>Houd gesprekken relevant voor het groepsonderwerp</List.Item>
                            <List.Item>Geen spam of promotionele inhoud</List.Item>
                            <List.Item>
                                Volg de{' '}
                                <Anchor
                                    component={Link}
                                    href={gedragscodeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    c="brand"
                                    fw={600}
                                >
                                    gedragscode van Salve Mundi <ExternalLink size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
                                </Anchor>
                            </List.Item>
                        </List>
                    </Stack>
                </Card>
            </Stack>
        </Container>
    );
};
