'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, ChevronLeft, Key, Save, Shield, Trash } from 'lucide-react';
import {
    ActionIcon,
    Alert,
    Badge,
    Button,
    Card,
    Code,
    Container,
    Group,
    List,
    PasswordInput,
    Stack,
    Text,
    Title,
} from '@mantine/core';
import { setImpersonateToken, clearImpersonateToken } from '@/server/actions/beheer/impersonation/beheer-impersonation.actions';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import { safeConsoleError } from '@/server/utils/logger';

interface Props {
    activeToken: string | null;
    impersonatedName: string | null;
    impersonatedCommittees: string[];
}

export default function ImpersonateIsland({ activeToken, impersonatedName, impersonatedCommittees }: Props) {
    const router = useRouter();
    const { showToast } = useAdminToast();
    const [token, setToken] = useState('');
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [isPending, startTransition] = useTransition();

    const handleSave = () => {
        if (!token || isPending) return;
        setStatus('idle');

        startTransition(async () => {
            try {
                const result = await setImpersonateToken(token);
                if (result.success) {
                    setStatus('success');
                    setToken('');
                    showToast('Test modus succesvol geactiveerd', 'success');
                    setTimeout(() => {
                        router.push('/');
                        router.refresh();
                    }, 600);
                } else {
                    setStatus('error');
                    showToast(result.error || 'Ongeldige token of fout bij valideren.', 'error');
                }
            } catch (error) {
                safeConsoleError('[ImpersonateIsland.tsx][ImpersonateIsland] ', error);
                setStatus('error');
                showToast('Er is een onverwachte fout opgetreden.', 'error');
            }
        });
    };

    const handleClear = () => {
        startTransition(async () => {
            try {
                await clearImpersonateToken();
                showToast('Test modus gedeactiveerd', 'info');
                setStatus('idle');
                setTimeout(() => window.location.reload(), 600);
            } catch (error) {
                safeConsoleError('[ImpersonateIsland.tsx][ImpersonateIsland] ', error);
                showToast('Er is een onverwachte fout opgetreden.', 'error');
            }
        });
    };

    return (
        <Container size="sm">
            <Stack gap="lg">
                <Group justify="space-between" align="center" wrap="wrap" gap="md">
                    <Group gap="sm" align="center">
                        <ActionIcon
                            component={Link}
                            href="/beheer"
                            variant="default"
                            size="lg"
                            aria-label="Terug"
                        >
                            <ChevronLeft size={18} />
                        </ActionIcon>
                        <Title order={1} size="h2" c="brand">
                            Test Modus
                        </Title>
                    </Group>

                    {activeToken && (
                        <Button
                            type="button"
                            color="error"
                            variant="light"
                            onClick={handleClear}
                            loading={isPending}
                            leftSection={<Trash size={16} />}
                        >
                            Stop Testen
                        </Button>
                    )}
                </Group>

                {activeToken && (
                    <Alert color="accent" variant="light" title="Actieve Sessie" icon={<Shield size={18} />}>
                        <Stack gap="sm">
                            <Text size="sm" fw={600}>
                                Je navigeert nu over de website met de rechten van{' '}
                                <Text span fw={700} c="accent">{impersonatedName}</Text>.
                            </Text>

                            {impersonatedCommittees.length > 0 && (
                                <Group gap="xs" wrap="wrap">
                                    {impersonatedCommittees.map((c) => (
                                        <Badge key={c} color="accent" variant="light" size="md">
                                            {c}
                                        </Badge>
                                    ))}
                                </Group>
                            )}

                            <Group gap="xs">
                                <Key size={14} />
                                <Code>
                                    {activeToken.substring(0, 12)}...{activeToken.substring(activeToken.length - 12)}
                                </Code>
                            </Group>
                        </Stack>
                    </Alert>
                )}

                {!activeToken && (
                    <Stack gap="lg">
                        <Card>
                            <Stack gap="md">
                                <PasswordInput
                                    label="Directus Statische Token"
                                    value={token}
                                    onChange={(e) => setToken(e.currentTarget.value)}
                                    placeholder="Plak hier de token..."
                                    disabled={isPending}
                                    error={status === 'error'}
                                    autoComplete="off"
                                    suppressHydrationWarning
                                />

                                <Button
                                    type="button"
                                    size="md"
                                    fullWidth
                                    onClick={handleSave}
                                    disabled={!token || isPending}
                                    loading={isPending}
                                    leftSection={status === 'success' ? <Check size={18} /> : <Save size={18} />}
                                >
                                    {isPending ? 'Controleren...' : status === 'success' ? 'Token Actief!' : 'Start Testen'}
                                </Button>
                            </Stack>
                        </Card>

                        <Card>
                            <Stack gap="sm">
                                <Title order={3} size="h5" c="brand">Hoe werkt het?</Title>
                                <List size="sm" spacing="xs" c="dimmed">
                                    <List.Item>Ga naar Directus &gt; User Settings &gt; Token.</List.Item>
                                    <List.Item>Kopieer de statische token van de user die je wilt testen.</List.Item>
                                    <List.Item>Plak deze hierboven en klik op Start Testen.</List.Item>
                                    <List.Item>
                                        <Text span c="error" fw={600}>
                                            Dit overschrijft tijdelijk je eigen rechten in de datalaag.
                                        </Text>
                                    </List.Item>
                                </List>
                            </Stack>
                        </Card>
                    </Stack>
                )}
            </Stack>
        </Container>
    );
}
