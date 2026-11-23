'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Plus,
    Save,
    X,
    Euro,
    List,
    Trash,
    Upload,
    Info,
} from 'lucide-react';
import {
    ActionIcon,
    Alert,
    Box,
    Button,
    Card,
    Divider,
    FileButton,
    Grid,
    Group,
    Input,
    NumberInput,
    Paper,
    Radio,
    Stack,
    Switch,
    Text,
    Textarea,
    TextInput,
    ThemeIcon,
    Title,
} from '@mantine/core';
import { type ActivityOption, parseActivityOptions } from '@/lib/reis';
import MediaAsset from '@/components/ui/media/MediaAsset';
import { type TripActivity } from '@salvemundi/validations/schema/beheer-trip.zod';

interface Props {
    activity: Partial<TripActivity> | null;
    onSave: (formData: FormData, options: ActivityOption[]) => Promise<void>;
    onCancel: () => void;
    pending: boolean;
}

export default function ReisActivityForm({ activity, onSave, onCancel, pending }: Props) {
    const initialOptions = parseActivityOptions(activity?.options);
    const [options, setOptions] = useState<ActivityOption[]>(initialOptions);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imagePreview, setImagePreview] = useState<
        string | { id: string; type?: string | null } | null
    >(null);
    const [existingImageId, setExistingImageId] = useState<string | null>(null);
    const [imageError, setImageError] = useState<string | null>(null);

    useEffect(() => {
        if (activity) {
            if (activity.options) {
                setOptions(
                    (activity.options as ActivityOption[]).map((opt) => ({
                        id: opt.id || '',
                        name: opt.name || '',
                        price: opt.price || 0,
                    }))
                );
            }
            if (activity.image) {
                const rawImage = activity.image as unknown as
                    | string
                    | { id: string; type?: string | null }
                    | null;
                const imageId =
                    rawImage && typeof rawImage === 'object'
                        ? rawImage.id
                        : (rawImage as string | null);
                setImagePreview(rawImage);
                setExistingImageId(imageId);
            } else {
                setImagePreview(null);
                setExistingImageId(null);
            }
        }
    }, [activity]);

    const addOption = () =>
        setOptions([...options, { id: `opt-${options.length}`, name: '', price: 0 }]);
    const removeOption = (idx: number) => setOptions(options.filter((_, i) => i !== idx));
    const updateOption = (idx: number, field: keyof ActivityOption, value: string) => {
        setOptions(
            options.map((opt, i) =>
                i === idx
                    ? { ...opt, [field]: field === 'price' ? parseFloat(value) || 0 : value }
                    : opt
            )
        );
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setImageError(null);

        if (file) {
            const maxSizeBytes = 10 * 1024 * 1024;
            if (file.size > maxSizeBytes) {
                setImageError('Het geselecteerde bestand is te groot (maximaal 10MB).');
                e.target.value = '';
                return;
            }

            setExistingImageId(null);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setImagePreview(null);
        setImageError(null);
        setExistingImageId(null);
    };

    const handleSubmit = (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (imageError) return;
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        void onSave(formData, options);
    };

    return (
        <Card p="xl" shadow="md" mb="xl">
            <Stack gap="xl">
                <Group justify="space-between">
                    <Group gap="sm">
                        <ThemeIcon size="lg">
                            {activity?.id ? <Save size={20} /> : <Plus size={20} />}
                        </ThemeIcon>
                        <Title order={2} size="h3">
                            {activity?.id ? 'Bewerken' : 'Nieuwe Activiteit'}
                        </Title>
                    </Group>
                    <ActionIcon
                        type="button"
                        size="lg"
                        onClick={onCancel}
                        aria-label="Sluiten"
                    >
                        <X size={18} />
                    </ActionIcon>
                </Group>

                <Box component="form" onSubmit={handleSubmit}>
                    {activity?.id && <TextInput display="none" name="id" value={String(activity.id)} readOnly />}
                    <TextInput display="none" name="existing_image_id" value={existingImageId || ''} readOnly />

                    <Stack gap="xl">
                        {imageError && (
                            <Alert color="error" icon={<Info size={16} />}>
                                {imageError}
                            </Alert>
                        )}

                        <Grid gap="xl">
                            <Grid.Col span={{ base: 12, lg: 7 }}>
                                <Stack gap="md">
                                    <TextInput
                                        name="name"
                                        label="Naam"
                                        required
                                        defaultValue={activity?.name || ''}
                                        placeholder="Bijv. Skiën"
                                    />
                                    <Textarea
                                        name="description"
                                        label="Beschrijving"
                                        rows={5}
                                        autosize
                                        minRows={4}
                                        defaultValue={activity?.description || ''}
                                        placeholder="Wat houdt deze activiteit precies in?"
                                    />
                                </Stack>
                            </Grid.Col>

                            <Grid.Col span={{ base: 12, lg: 5 }}>
                                <Grid gap="md">
                                    <Grid.Col span={12}>
                                        <Input.Wrapper label="Afbeelding">
                                            <Box mt={4}>
                                                {!imagePreview ? (
                                                    <Button
                                                        type="button"
                                                        fullWidth
                                                        h={128}
                                                        style={{ borderStyle: 'dashed' }}
                                                        onClick={() => fileInputRef.current?.click()}
                                                    >
                                                        <Stack align="center" gap="xs">
                                                            <Upload size={20} />
                                                            <Text size="xs" fw={600}>
                                                                Upload afbeelding
                                                            </Text>
                                                        </Stack>
                                                    </Button>
                                                ) : (
                                                    <Paper
                                                        withBorder
                                                        pos="relative"
                                                        h={128}
                                                        style={{ overflow: 'hidden' }}
                                                    >
                                                        <MediaAsset
                                                            asset={imagePreview}
                                                            alt="Preview"
                                                            fill
                                                            objectFit="contain"
                                                            unoptimized
                                                        />
                                                        <Group
                                                            gap="xs"
                                                            pos="absolute"
                                                            top={8}
                                                            right={8}
                                                        >
                                                            <ActionIcon
                                                                type="button"
                                                                onClick={() =>
                                                                    fileInputRef.current?.click()
                                                                }
                                                                aria-label="Andere afbeelding kiezen"
                                                            >
                                                                <Upload size={14} />
                                                            </ActionIcon>
                                                            <ActionIcon
                                                                type="button"
                                                                color="error"
                                                                onClick={handleRemoveImage}
                                                                aria-label="Afbeelding verwijderen"
                                                            >
                                                                <X size={14} />
                                                            </ActionIcon>
                                                        </Group>
                                                    </Paper>
                                                )}
                                                <FileButton
                                                    ref={fileInputRef}
                                                    name="image_file"
                                                    accept="image/*"
                                                    onChange={() => {}}
                                                    inputProps={{ onChange: handleImageChange }}
                                                >
                                                    {() => null}
                                                </FileButton>
                                            </Box>
                                        </Input.Wrapper>
                                    </Grid.Col>

                                    <Grid.Col span={12}>
                                        <NumberInput
                                            name="price"
                                            label="Basisprijs (€)"
                                            required
                                            step={0.01}
                                            decimalScale={2}
                                            leftSection={<Euro size={14} />}
                                            defaultValue={
                                                activity?.price ? Number(activity.price) : 0
                                            }
                                        />
                                    </Grid.Col>

                                    <Grid.Col span={6}>
                                        <NumberInput
                                            name="max_participants"
                                            label="Max Reizigers"
                                            allowDecimal={false}
                                            placeholder="Onbeperkt"
                                            defaultValue={activity?.max_participants ?? undefined}
                                        />
                                    </Grid.Col>

                                    <Grid.Col span={6}>
                                        <NumberInput
                                            name="display_order"
                                            label="Sorteer Volgorde"
                                            allowDecimal={false}
                                            defaultValue={activity?.display_order ?? 0}
                                        />
                                    </Grid.Col>

                                    <Grid.Col span={12}>
                                        <Paper withBorder p="md">
                                            <Switch
                                                name="is_active"
                                                label="Activiteit is zichtbaar"
                                                defaultChecked={activity?.is_active ?? true}
                                            />
                                        </Paper>
                                    </Grid.Col>
                                </Grid>
                            </Grid.Col>
                        </Grid>

                        <Paper withBorder p="lg">
                            <Stack gap="lg">
                                <Group justify="space-between" wrap="wrap" gap="md">
                                    <Box>
                                        <Group gap="xs">
                                            <Text span c="brand" lh={1}>
                                                <List size={16} />
                                            </Text>
                                            <Title order={3} size="h5">
                                                Sub-opties
                                            </Title>
                                        </Group>
                                        <Text size="xs" c="dimmed">
                                            Optionele keuzes voor deze activiteit
                                        </Text>
                                    </Box>
                                    <Button
                                        type="button"
                                        size="xs"
                                        onClick={addOption}
                                        leftSection={<Plus size={14} />}
                                    >
                                        Optie toevoegen
                                    </Button>
                                </Group>

                                <Paper withBorder p="md">
                                    <Group gap="xl">
                                        <Radio
                                            name="max_selections"
                                            value=""
                                            defaultChecked={
                                                activity?.max_selections === null || !activity?.id
                                            }
                                            label="Checkbox (Meerdere)"
                                        />
                                        <Radio
                                            name="max_selections"
                                            value="1"
                                            defaultChecked={activity?.max_selections === 1}
                                            label="Radio (Eén keuze)"
                                        />
                                    </Group>
                                </Paper>

                                <Stack gap="sm">
                                    {options.map((opt, idx) => (
                                        <Group key={idx} gap="sm" wrap="nowrap">
                                            <TextInput
                                                flex={1}
                                                value={opt.name || ''}
                                                onChange={(e) =>
                                                    updateOption(idx, 'name', e.target.value)
                                                }
                                                placeholder="Bijv. Inclusief lunch..."
                                            />
                                            <NumberInput
                                                w={140}
                                                step={0.01}
                                                decimalScale={2}
                                                leftSection={<Euro size={14} />}
                                                value={opt.price || 0}
                                                onChange={(val) =>
                                                    updateOption(idx, 'price', String(val))
                                                }
                                                placeholder="Meerprijs"
                                            />
                                            <ActionIcon
                                                type="button"
                                                color="error"
                                                size="lg"
                                                onClick={() => removeOption(idx)}
                                                aria-label="Optie verwijderen"
                                            >
                                                <Trash size={16} />
                                            </ActionIcon>
                                        </Group>
                                    ))}
                                    {options.length === 0 && (
                                        <Paper
                                            withBorder
                                            py="xl"
                                            style={{ borderStyle: 'dashed' }}
                                            ta="center"
                                        >
                                            <Text size="xs" c="dimmed">
                                                Geen sub-opties geconfigureerd voor deze activiteit
                                            </Text>
                                        </Paper>
                                    )}
                                </Stack>
                            </Stack>
                        </Paper>

                        <Divider />

                        <Group justify="flex-end" gap="sm">
                            <Button type="button" onClick={onCancel}>
                                Annuleren
                            </Button>
                            <Button
                                type="submit"
                                loading={pending}
                                leftSection={<Save size={16} />}
                            >
                                Opslaan
                            </Button>
                        </Group>
                    </Stack>
                </Box>
            </Stack>
        </Card>
    );
}
