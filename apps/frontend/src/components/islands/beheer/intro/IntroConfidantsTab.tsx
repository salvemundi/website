'use client';

import Image from 'next/image';
import { useState } from 'react';
import {
    Plus,
    X,
    Save,
    Edit,
    Trash,
    ShieldCheck,
    Image as ImageIcon,
    Camera,
    Trash2,
} from 'lucide-react';
import {
    ActionIcon,
    Badge,
    Box,
    Button,
    Card,
    Divider,
    FileButton,
    Group,
    Loader,
    NumberInput,
    Paper,
    SimpleGrid,
    Stack,
    Text,
    Textarea,
    TextInput,
    Title,
} from '@mantine/core';
import type { IntroConfidant } from '@salvemundi/validations/schema/intro.zod';
import { getImageUrl } from '@/lib/utils/image-utils';
import { uploadIntroConfidantImage } from '@/server/actions/beheer/intro/beheer-intro-core.actions';
import { ActionButton, EmptyState } from './IntroTabComponents';

interface Props {
    confidants: IntroConfidant[];
    onSave: (item: Partial<IntroConfidant>) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
    saving: boolean;
    deletingId: number | null;
}

const emptyConfidant = (sortOrder: number): Partial<IntroConfidant> => ({
    name: '', email: '', phone_number: '', image: '', bio: '', sort_order: sortOrder, is_active: true
});

export default function IntroConfidantsTab({ confidants, onSave, onDelete, saving, deletingId }: Props) {
    const [editing, setEditing] = useState<Partial<IntroConfidant> | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const startEditing = (item: Partial<IntroConfidant>) => {
        setEditing(item);
        setImageFile(null);
        setImagePreview(item.image ? getImageUrl(item.image, { width: 200, height: 200, fit: 'cover' }) : null);
        setUploadError(null);
    };

    const stopEditing = () => {
        setEditing(null);
        setImageFile(null);
        setImagePreview(null);
        setUploadError(null);
    };

    const handleImageFileSelect = (file: File | null) => {
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setUploadError(null);
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (editing) setEditing({ ...editing, image: null });
    };

    const handleSave = async () => {
        if (!editing) return;

        let imageId = editing.image ?? null;

        if (imageFile) {
            setUploading(true);
            setUploadError(null);
            const formData = new FormData();
            formData.append('image', imageFile);
            const result = await uploadIntroConfidantImage(formData);
            setUploading(false);
            if (!result.success) {
                setUploadError(result.error);
                return;
            }
            imageId = result.data;
        }

        await onSave({ ...editing, image: imageId });
        stopEditing();
    };

    return (
        <Stack gap="lg">
            {editing === null && (
                <Group>
                    <Button
                        type="button"
                        onClick={() => startEditing(emptyConfidant(confidants.length))}
                        leftSection={<Plus size={16} />}
                    >
                        Nieuwe Vertrouwenspersoon
                    </Button>
                </Group>
            )}

            {editing !== null && (
                <Card withBorder padding="xl">
                    <Stack gap="lg">
                        <Group justify="space-between" align="center">
                            <Title order={3} size="xs" c="dimmed" tt="uppercase">
                                {editing.id ? 'Vertrouwenspersoon Bewerken' : 'Nieuwe Vertrouwenspersoon'}
                            </Title>
                            <ActionIcon type="button" onClick={stopEditing} aria-label="Sluiten">
                                <X size={18} />
                            </ActionIcon>
                        </Group>

                        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                            <TextInput
                                label="Naam"
                                required
                                value={editing.name || ''}
                                onChange={(e) => setEditing({ ...editing, name: e.currentTarget.value })}
                                placeholder="Voor- en achternaam"
                            />
                            <TextInput
                                label="Telefoonnummer"
                                value={editing.phone_number || ''}
                                onChange={(e) => setEditing({ ...editing, phone_number: e.currentTarget.value })}
                                placeholder="06 12345678"
                            />
                            <TextInput
                                label="E-mailadres"
                                type="email"
                                value={editing.email || ''}
                                onChange={(e) => setEditing({ ...editing, email: e.currentTarget.value })}
                                placeholder="naam@salvemundi.nl"
                            />
                            <NumberInput
                                label="Volgorde"
                                value={editing.sort_order ?? 0}
                                onChange={(val) => setEditing({ ...editing, sort_order: typeof val === 'number' ? val : Number(val) || 0 })}
                            />

                            <Stack gap="xs" style={{ gridColumn: '1 / -1' }}>
                                <Text size="sm" fw={500}>Foto</Text>
                                <Group gap="lg" align="center">
                                    <Paper
                                        withBorder
                                        style={{
                                            borderRadius: '50%',
                                            width: 96,
                                            height: 96,
                                            position: 'relative',
                                            overflow: 'hidden',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}
                                    >
                                        {imagePreview ? (
                                            <Image unoptimized src={imagePreview} alt="Voorbeeld" width={100} height={100} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <ImageIcon size={24} opacity={0.4} />
                                        )}
                                        {uploading && (
                                            <Box
                                                style={{
                                                    position: 'absolute',
                                                    inset: 0,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    backgroundColor: 'var(--overlay-scrim-strong)',
                                                }}
                                            >
                                                <Loader size="sm" />
                                            </Box>
                                        )}
                                    </Paper>

                                    <Stack gap="xs">
                                        <FileButton onChange={handleImageFileSelect} accept="image/*">
                                            {(props) => (
                                                <Button
                                                    {...props}
                                                    type="button"
                                                    size="xs"
                                                    leftSection={<Camera size={14} />}
                                                >
                                                    {imagePreview ? 'Andere foto kiezen' : 'Foto uploaden'}
                                                </Button>
                                            )}
                                        </FileButton>
                                        {imagePreview && (
                                            <Button
                                                type="button"
                                                color="error"
                                                size="xs"
                                                onClick={handleRemoveImage}
                                                leftSection={<Trash2 size={14} />}
                                            >
                                                Verwijderen
                                            </Button>
                                        )}
                                        {uploadError && (
                                            <Text size="xs" fw={600} c="error">{uploadError}</Text>
                                        )}
                                    </Stack>
                                </Group>
                            </Stack>

                            <Textarea
                                label="Korte tekst"
                                value={editing.bio || ''}
                                onChange={(e) => setEditing({ ...editing, bio: e.currentTarget.value })}
                                rows={3}
                                placeholder="Korte omschrijving die op de publieke pagina komt te staan"
                                style={{ gridColumn: '1 / -1' }}
                            />

                            <Stack gap={4}>
                                <Text size="sm" fw={500}>Zichtbaar op publieke pagina</Text>
                                <Group>
                                    <Button
                                        type="button"
                                        variant={(editing.is_active ?? true) ? 'light' : 'default'}
                                        color={(editing.is_active ?? true) ? 'success' : undefined}
                                        onClick={() => setEditing({ ...editing, is_active: !(editing.is_active ?? true) })}
                                        leftSection={<ShieldCheck size={16} />}
                                    >
                                        {(editing.is_active ?? true) ? 'Actief' : 'Verborgen'}
                                    </Button>
                                </Group>
                            </Stack>
                        </SimpleGrid>

                        <Divider />

                        <Group gap="sm">
                            <Button
                                type="button"
                                onClick={() => { void handleSave(); }}
                                loading={saving || uploading}
                                disabled={!editing.name}
                                leftSection={<Save size={16} />}
                            >
                                Opslaan
                            </Button>
                            <Button
                                type="button"
                                onClick={stopEditing}
                                leftSection={<X size={16} />}
                            >
                                Annuleren
                            </Button>
                        </Group>
                    </Stack>
                </Card>
            )}

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                {confidants.map(item => {
                    const imageUrl = item.image ? getImageUrl(item.image, { width: 100, height: 100, fit: 'cover' }) : null;
                    return (
                        <Card key={item.id} withBorder padding="lg">
                            <Stack justify="space-between" h="100%" gap="md">
                                <Stack gap="sm">
                                    <Group gap="md" align="flex-start" wrap="nowrap">
                                        <Paper
                                            withBorder
                                            style={{
                                                borderRadius: '50%',
                                                width: 48,
                                                height: 48,
                                                overflow: 'hidden',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}
                                        >
                                            {imageUrl ? (
                                                <Image unoptimized src={imageUrl} alt={item.name} width={100} height={100} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <ImageIcon size={20} opacity={0.4} />
                                            )}
                                        </Paper>
                                        <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
                                            <Group gap="xs" wrap="nowrap">
                                                <Title order={4} size="md" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</Title>
                                                {!item.is_active && (
                                                    <Badge size="xs">Verborgen</Badge>
                                                )}
                                            </Group>
                                            {item.email && <Text size="xs" c="dimmed" truncate>{item.email}</Text>}
                                            {item.phone_number && <Text size="xs" c="dimmed">{item.phone_number}</Text>}
                                        </Stack>
                                    </Group>
                                    {item.bio && (
                                        <Text size="sm" c="dimmed" lineClamp={3}>{item.bio}</Text>
                                    )}
                                </Stack>

                                <Stack gap="sm">
                                    <Divider />
                                    <Group gap="xs">
                                        <ActionButton icon={Edit} onClick={() => startEditing(item)} title="Bewerken" />
                                        <ActionButton
                                            icon={Trash}
                                            onClick={() => { void onDelete(item.id); }}
                                            variant="danger"
                                            disabled={deletingId === item.id}
                                            title="Verwijderen"
                                        />
                                    </Group>
                                </Stack>
                            </Stack>
                        </Card>
                    );
                })}
                {confidants.length === 0 && (
                    <Box style={{ gridColumn: '1 / -1' }}>
                        <EmptyState icon={ShieldCheck} text="Nog geen vertrouwenspersonen toegevoegd" />
                    </Box>
                )}
            </SimpleGrid>
        </Stack>
    );
}
