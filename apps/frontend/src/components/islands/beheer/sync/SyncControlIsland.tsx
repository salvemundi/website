'use client';

import React from 'react';
import { RefreshCw, X, Info } from 'lucide-react';
import {
    Button,
    Card,
    Divider,
    Group,
    Paper,
    Stack,
    Switch,
    Text,
    TextInput,
    ThemeIcon,
    Title,
} from '@mantine/core';
import { useSync } from './SyncContext';

export default function SyncControlIsland() {
    const {
        isStartingSync, isStopping, isResetting, isUserSyncLoading,
        selectedSyncFields, toggleField, forceLink, setForceLink,
        activeOnly, setActiveOnly, sendExpiryEmails, setSendExpiryEmails,
        convertUpn, setConvertUpn, ignoreGracePeriod, setIgnoreGracePeriod,
        handleFullSync, handleStopSync, handleResetSync,
        userId, setUserId, handleUserSync, syncFieldOptions, status,
    } = useSync();

    const isBusy = isStartingSync || isStopping || isResetting || isUserSyncLoading;

    const toggles = [
        { label: 'Forceer Entra Link', value: forceLink, setValue: setForceLink },
        { label: 'Alleen Actieve Leden', value: activeOnly, setValue: setActiveOnly },
        { label: 'Verstuur Expiratie E-mails', value: sendExpiryEmails, setValue: setSendExpiryEmails },
        { label: 'Automatische UPN Conversie', value: convertUpn, setValue: setConvertUpn },
        { label: 'Negeer 14-Dagen Gratieperiode (Direct Verwijderen)', value: ignoreGracePeriod, setValue: setIgnoreGracePeriod },
    ];

    return (
        <Stack gap="lg" mb="xl" style={isBusy ? { opacity: 0.7, pointerEvents: 'none' } : undefined}>
            <Card p="lg" shadow="sm">
                <Stack gap="lg">
                    <Group gap="md">
                        <ThemeIcon size="lg" variant="light" color="brand" radius="md">
                            <RefreshCw size={20} />
                        </ThemeIcon>
                        <Title order={3} size="h4">
                            Volledige Sync
                        </Title>
                    </Group>

                    <Stack gap="xs">
                        <Text size="xs" fw={600} c="dimmed">
                            Velden om te synchroniseren
                        </Text>
                        <Group gap="xs" wrap="wrap">
                            {syncFieldOptions.map((field: { id: string; label: string }) => {
                                const isSelected = selectedSyncFields.includes(field.id);
                                return (
                                    <Button
                                        key={field.id}
                                        type="button"
                                        size="xs"
                                        variant={isSelected ? 'filled' : 'default'}
                                        color={isSelected ? 'brand' : undefined}
                                        onClick={() => toggleField(field.id)}
                                        disabled={isBusy}
                                    >
                                        {field.label}
                                    </Button>
                                );
                            })}
                        </Group>
                    </Stack>

                    <Divider />

                    <Stack gap="xs">
                        {toggles.map((item) => (
                            <Paper key={item.label} p="sm" withBorder radius="md">
                                <Switch
                                    checked={item.value}
                                    onChange={(e) => item.setValue(e.currentTarget.checked)}
                                    disabled={isBusy}
                                    label={item.label}
                                    labelPosition="left"
                                    styles={{
                                        root: { width: '100%' },
                                        body: { width: '100%', justifyContent: 'space-between' },
                                        label: { fontSize: 'var(--mantine-font-size-xs)', fontWeight: 600 },
                                    }}
                                />
                            </Paper>
                        ))}
                    </Stack>

                    <Stack gap="xs" pt="xs">
                        {status?.active ? (
                            <>
                                <Button
                                    type="button"
                                    fullWidth
                                    color="error"
                                    onClick={() => { void handleStopSync(); }}
                                    disabled={isStopping || status.abortRequested}
                                    loading={isStopping}
                                    leftSection={<X size={16} />}
                                >
                                    {status.abortRequested ? 'Afbreken aangevraagd...' : 'Synchronisatie Stoppen'}
                                </Button>
                                {status.abortRequested && (
                                    <Button
                                        type="button"
                                        fullWidth
                                        variant="subtle"
                                        color="error"
                                        size="xs"
                                        onClick={() => { void handleResetSync(); }}
                                        disabled={isResetting}
                                        loading={isResetting}
                                        leftSection={<RefreshCw size={14} />}
                                    >
                                        Forceer Reset (Emergency)
                                    </Button>
                                )}
                            </>
                        ) : (
                            <Button
                                type="button"
                                fullWidth
                                color="brand"
                                onClick={() => { void handleFullSync(); }}
                                disabled={isStartingSync || !!status?.error}
                                loading={isStartingSync}
                                leftSection={<RefreshCw size={16} />}
                            >
                                Start Volledige Synchronisatie
                            </Button>
                        )}
                    </Stack>
                </Stack>
            </Card>

            <Card p="lg" shadow="sm">
                <Stack gap="md">
                    <Group gap="md">
                        <ThemeIcon size="lg" variant="light" color="brand" radius="md">
                            <Info size={20} />
                        </ThemeIcon>
                        <Title order={3} size="h4">
                            Specifieke Gebruiker
                        </Title>
                    </Group>

                    <Text size="xs" c="dimmed">
                        Synchroniseer een specifieke gebruiker op basis van their Entra ID (UUID).
                    </Text>

                    <form onSubmit={(e) => { void handleUserSync(e); }}>
                        <Stack gap="sm">
                            <TextInput
                                value={userId}
                                autoComplete="off"
                                disabled={isBusy}
                                onChange={(e) => setUserId(e.target.value)}
                                placeholder="Entra ID (UUID)..."
                            />
                            <Button
                                type="submit"
                                fullWidth
                                variant="default"
                                disabled={isUserSyncLoading || !userId.trim() || !!status?.error}
                                loading={isUserSyncLoading}
                                leftSection={<RefreshCw size={16} />}
                            >
                                Sync Gebruiker
                            </Button>
                        </Stack>
                    </form>
                </Stack>
            </Card>
        </Stack>
    );
}
