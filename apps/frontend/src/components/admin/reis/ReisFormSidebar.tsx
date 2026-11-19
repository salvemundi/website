'use client';

import { Upload, X, Save, Eye, AlertTriangle } from 'lucide-react';
import { useRef } from 'react';
import {
    ActionIcon,
    Alert,
    Badge,
    Box,
    Button,
    Card,
    Checkbox,
    Divider,
    Group,
    Paper,
    Stack,
    Text,
    ThemeIcon,
    Title,
} from '@mantine/core';
import MediaAsset from '@/components/ui/media/MediaAsset';

interface ReisFormSidebarProps {
    isAdding: boolean;
    pending: boolean;
    imagePreview: string | { id: string; type?: string | null } | null;
    onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveImage: () => void;
    onCancel: () => void;
    registrationOpen: boolean;
    setRegistrationOpen: (open: boolean) => void;
    allowFinalPayments: boolean;
    setAllowFinalPayments: (allow: boolean) => void;
    allowDepositPayments: boolean;
    setAllowDepositPayments: (allow: boolean) => void;
    isBusTrip: boolean;
    setIsBusTrip: (isBus: boolean) => void;
    registrationStartDate?: string | null;
}

export default function ReisFormSidebar({
    isAdding,
    pending,
    imagePreview,
    onImageChange,
    onRemoveImage,
    onCancel,
    registrationOpen,
    setRegistrationOpen,
    allowFinalPayments,
    setAllowFinalPayments,
    allowDepositPayments,
    setAllowDepositPayments,
    isBusTrip,
    setIsBusTrip,
    registrationStartDate
}: ReisFormSidebarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isAutoOpen = !registrationOpen && registrationStartDate && new Date(registrationStartDate) <= new Date();

    return (
        <Stack gap="lg" pos={{ lg: 'sticky' }} top={{ lg: 32 }}>
            <Card withBorder radius="lg" padding="lg">
                <Group gap="sm" mb="md">
                    <ThemeIcon size="md" radius="md" variant="light" color="accent">
                        <Upload size={16} />
                    </ThemeIcon>
                    <Title order={2} size="h5">Banner</Title>
                </Group>
                <Divider mb="md" />
                {!imagePreview ? (
                    <Paper
                        withBorder
                        radius="md"
                        p="xl"
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            borderStyle: 'dashed',
                            cursor: 'pointer',
                            minHeight: 160,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Upload size={24} />
                        <Text size="xs" fw={600} c="dimmed" mt="xs" ta="center">
                            Upload banner (afbeelding of video)
                        </Text>
                        <input
                            ref={fileInputRef}
                            type="file"
                            name="image_file"
                            accept="image/*,video/*"
                            onChange={onImageChange}
                            style={{ display: 'none' }}
                        />
                    </Paper>
                ) : (
                    <Box
                        pos="relative"
                        h={160}
                        style={{
                            borderRadius: 'var(--mantine-radius-md)',
                            overflow: 'hidden',
                            border: '1px solid var(--mantine-color-default-border)',
                        }}
                    >
                        <MediaAsset
                            asset={imagePreview}
                            alt="Preview"
                            fill
                            objectFit="contain"
                            unoptimized
                        />
                        <Group gap="xs" pos="absolute" top={8} right={8}>
                            <ActionIcon
                                type="button"
                                variant="default"
                                size="md"
                                onClick={() => fileInputRef.current?.click()}
                                aria-label="Banner wijzigen"
                            >
                                <Upload size={14} />
                            </ActionIcon>
                            <ActionIcon
                                type="button"
                                color="error"
                                variant="filled"
                                size="md"
                                onClick={onRemoveImage}
                                aria-label="Banner verwijderen"
                            >
                                <X size={14} />
                            </ActionIcon>
                        </Group>
                        <input
                            ref={fileInputRef}
                            type="file"
                            name="image_file"
                            accept="image/*,video/*"
                            onChange={onImageChange}
                            style={{ display: 'none' }}
                        />
                    </Box>
                )}
            </Card>

            <Card withBorder radius="lg" padding="lg">
                <Group gap="sm" mb="md">
                    <ThemeIcon size="md" radius="md" variant="light" color="accent">
                        <Eye size={16} />
                    </ThemeIcon>
                    <Title order={2} size="h5">Instellingen</Title>
                </Group>
                <Divider mb="md" />
                <Stack gap="sm">
                    <Paper withBorder radius="md" p="sm">
                        <Group justify="space-between" wrap="wrap" gap="xs">
                            <Checkbox
                                checked={registrationOpen}
                                onChange={(e) => setRegistrationOpen(e.currentTarget.checked)}
                                label="Inschrijving Open"
                                color="accent"
                            />
                            {isAutoOpen && (
                                <Badge color="success" variant="light" size="xs">
                                    Auto-Open Actief
                                </Badge>
                            )}
                        </Group>
                    </Paper>

                    <Paper withBorder radius="md" p="sm">
                        <Checkbox
                            checked={allowDepositPayments}
                            onChange={(e) => setAllowDepositPayments(e.currentTarget.checked)}
                            label="Aanbetalingen Open"
                            color="accent"
                        />
                    </Paper>

                    <Paper withBorder radius="md" p="sm">
                        <Checkbox
                            checked={allowFinalPayments}
                            onChange={(e) => setAllowFinalPayments(e.currentTarget.checked)}
                            label="Restbetalingen Aan"
                            color="accent"
                        />
                    </Paper>

                    {allowFinalPayments && (
                        <Alert color="accent" variant="light" icon={<AlertTriangle size={16} />}>
                            <Text size="xs" fw={600}>
                                Let op: Het inschakelen van restbetalingen sluit automatisch nieuwe inschrijvingen voor deze reis.
                            </Text>
                        </Alert>
                    )}

                    <Paper withBorder radius="md" p="sm">
                        <Checkbox
                            checked={isBusTrip}
                            onChange={(e) => setIsBusTrip(e.currentTarget.checked)}
                            label="Busreis (Rijbewijs)"
                            color="accent"
                        />
                    </Paper>
                </Stack>
            </Card>

            <Stack gap="sm">
                <Button
                    type="submit"
                    color="accent"
                    loading={pending}
                    fullWidth
                    size="md"
                    leftSection={<Save size={16} />}
                >
                    {pending ? 'Bezig...' : isAdding ? 'Reis Aanmaken' : 'Wijzigingen Opslaan'}
                </Button>

                <Button
                    type="button"
                    variant="default"
                    onClick={onCancel}
                    fullWidth
                    size="md"
                >
                    Annuleren
                </Button>
            </Stack>
        </Stack>
    );
}
