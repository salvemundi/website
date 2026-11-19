'use client';

import { Mail, Send, Info } from 'lucide-react';
import {
    Alert,
    Box,
    Button,
    Card,
    Divider,
    GridCol,
    Group,
    SimpleGrid,
    Stack,
    Text,
    Textarea,
    TextInput,
    ThemeIcon,
    Title,
} from '@mantine/core';
import { TickItem } from './MailComponents';

interface MailEditorProps {
    emailType: 'custom' | 'deposit_request' | 'final_request';
    subject: string;
    setSubject: (subjectText: string) => void;
    message: string;
    setMessage: (messageText: string) => void;
    sending: boolean;
    onSend: () => void;
    filteredCount: number;
}

export default function MailEditor({
    emailType,
    subject,
    setSubject,
    message,
    setMessage,
    sending,
    onSend,
    filteredCount
}: MailEditorProps) {
    return (
        <GridCol span={{ base: 12, lg: 9 }}>
            <Card withBorder radius="lg" padding="xl">
                <Stack gap="lg">
                    <Group gap="md" wrap="nowrap">
                        <ThemeIcon size={48} radius="md" color="accent" variant="filled">
                            <Mail size={22} />
                        </ThemeIcon>
                        <Title order={2} size="h4">
                            Verstuur bulk communicatie naar geselecteerde groep
                        </Title>
                    </Group>

                    <Divider />

                    {emailType === 'custom' ? (
                        <Stack gap="md">
                            <TextInput
                                label="Onderwerp van de e-mail"
                                placeholder="Bijv: Belangrijke update over de reis..."
                                value={subject}
                                onChange={(e) => setSubject(e.currentTarget.value)}
                            />
                            <Textarea
                                label="Inhoud van het bericht"
                                rows={10}
                                placeholder="Typ hier je bericht voor de deelnemers..."
                                value={message}
                                onChange={(e) => setMessage(e.currentTarget.value)}
                            />
                        </Stack>
                    ) : (
                        <Alert
                            color="accent"
                            variant="light"
                            radius="lg"
                            title="Automatisch Betaalverzoek"
                            icon={<Info size={20} />}
                        >
                            <Stack gap="md">
                                <Text size="sm">
                                    Je staat op het punt om een automatisch{' '}
                                    <Text span fw={700}>
                                        {emailType === 'deposit_request' ? 'aanbetaling' : 'restbetaling'}
                                    </Text>{' '}
                                    email te sturen naar{' '}
                                    <Text span fw={700} c="accent">
                                        {filteredCount}
                                    </Text>{' '}
                                    reizigers.
                                </Text>
                                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
                                    <TickItem>Gepersonaliseerde aanhef</TickItem>
                                    <TickItem>Directe betaallink (Mollie)</TickItem>
                                    <TickItem>Bedrag details &amp; overzicht</TickItem>
                                    <TickItem>Unieke referentie per mail</TickItem>
                                </SimpleGrid>
                            </Stack>
                        </Alert>
                    )}

                    <Divider />

                    <Group justify="space-between" wrap="wrap" gap="md">
                        <Group gap="xs">
                            <Box
                                w={6}
                                h={6}
                                bg="accent"
                                style={{ borderRadius: '50%' }}
                            />
                            <Text size="xs" fw={700} tt="uppercase" c="dimmed" fs="italic">
                                Controleer de filters voor verzenden
                            </Text>
                        </Group>
                        <Button
                            type="button"
                            color="accent"
                            loading={sending}
                            onClick={onSend}
                            disabled={sending || filteredCount === 0 || (emailType === 'custom' && (!subject.trim() || !message.trim()))}
                            leftSection={<Send size={16} />}
                            w={{ base: '100%', sm: 'auto' }}
                        >
                            Bericht Verzenden
                        </Button>
                    </Group>
                </Stack>
            </Card>
        </GridCol>
    );
}
