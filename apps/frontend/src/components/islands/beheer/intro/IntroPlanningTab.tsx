'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Plus,
    X,
    Save,
    Edit,
    Trash,
    List,
    LayoutGrid,
    Calendar,
    Image as ImageIcon,
    Camera,
    Trash2,
    FileText,
    Upload
} from 'lucide-react';
import {
    ActionIcon,
    Anchor,
    Badge,
    Box,
    Button,
    Card,
    Divider,
    FileButton,
    Group,
    Loader,
    Paper,
    SegmentedControl,
    SimpleGrid,
    Stack,
    Text,
    Textarea,
    TextInput,
    Title,
} from '@mantine/core';
import { DateInput, TimeInput } from '@mantine/dates';
import { formatDate } from '@/shared/lib/utils/date';
import type { IntroPlanningItem } from '@salvemundi/validations/schema/intro.zod';
import { ActionButton, EmptyState } from './IntroTabComponents';
import { getImageUrl } from '@/lib/utils/image-utils';
import {
    uploadIntroPlanningImage,
    removeIntroPlanningImage,
    uploadIntroInfoBooklet,
    removeIntroInfoBooklet
} from '@/server/actions/beheer/intro/beheer-intro-core.actions';

interface Props {
    planning: IntroPlanningItem[];
    onSave: (item: Partial<IntroPlanningItem>) => Promise<number | null>;
    onDelete: (id: number) => Promise<void>;
    saving: boolean;
    deletingId: number | null;
    initialPlanningImage: string | null;
    initialInfoBooklet: string | null;
}

const DAY_ORDER = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'];

export default function IntroPlanningTab({ planning, onSave, onDelete, saving, deletingId, initialPlanningImage, initialInfoBooklet }: Props) {
    const [editingPlanning, setEditingPlanning] = useState<Partial<IntroPlanningItem> | null>(null);
    const [view, setView] = useState<'calendar' | 'list'>('list');

    const [planningImage, setPlanningImage] = useState<string | null>(initialPlanningImage);
    const [imagePreview, setImagePreview] = useState<string | null>(
        initialPlanningImage ? getImageUrl(initialPlanningImage, { width: 1200, fit: 'inside' }) : null
    );
    const [uploadingImage, setUploadingImage] = useState(false);
    const [imageUploadError, setImageUploadError] = useState<string | null>(null);

    const handlePlanningImageChange = async (file: File | null) => {
        if (!file) return;

        setImagePreview(URL.createObjectURL(file));
        setUploadingImage(true);
        setImageUploadError(null);

        const formData = new FormData();
        formData.append('image', file);
        const result = await uploadIntroPlanningImage(formData);
        setUploadingImage(false);

        if (!result.success) {
            setImageUploadError(result.error);
            setImagePreview(planningImage ? getImageUrl(planningImage, { width: 1200, fit: 'inside' }) : null);
            return;
        }
        setPlanningImage(result.data);
        setImagePreview(getImageUrl(result.data, { width: 1200, fit: 'inside' }));
    };

    const handleRemovePlanningImage = async () => {
        setUploadingImage(true);
        setImageUploadError(null);
        const result = await removeIntroPlanningImage();
        setUploadingImage(false);
        if (!result.success) {
            setImageUploadError(result.error || 'Verwijderen mislukt');
            return;
        }
        setPlanningImage(null);
        setImagePreview(null);
    };

    const [infoBooklet, setInfoBooklet] = useState<string | null>(initialInfoBooklet);
    const [bookletFileName, setBookletFileName] = useState<string | null>(null);
    const [uploadingBooklet, setUploadingBooklet] = useState(false);
    const [bookletUploadError, setBookletUploadError] = useState<string | null>(null);

    const handleInfoBookletChange = async (file: File | null) => {
        if (!file) return;

        setBookletFileName(file.name);
        setUploadingBooklet(true);
        setBookletUploadError(null);

        const formData = new FormData();
        formData.append('document', file);
        const result = await uploadIntroInfoBooklet(formData);
        setUploadingBooklet(false);

        if (!result.success) {
            setBookletUploadError(result.error);
            setBookletFileName(null);
            return;
        }
        setInfoBooklet(result.data);
    };

    const handleRemoveInfoBooklet = async () => {
        setUploadingBooklet(true);
        setBookletUploadError(null);
        const result = await removeIntroInfoBooklet();
        setUploadingBooklet(false);
        if (!result.success) {
            setBookletUploadError(result.error || 'Verwijderen mislukt');
            return;
        }
        setInfoBooklet(null);
        setBookletFileName(null);
    };

    const [scrollToId, setScrollToId] = useState<number | null>(null);

    const handleSave = async () => {
        if (!editingPlanning) return;
        const savedId = await onSave(editingPlanning);
        setEditingPlanning(null);
        setScrollToId(savedId);
    };

    const editFormRef = useRef<HTMLDivElement>(null);
    const editingKeyRef = useRef<number | 'new' | null>(null);
    useEffect(() => {
        const key = editingPlanning ? (editingPlanning.id ?? 'new') : null;
        if (key !== null && key !== editingKeyRef.current) {
            editFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        editingKeyRef.current = key;
    }, [editingPlanning]);

    const itemRefs = useRef(new Map<number, HTMLDivElement>());
    const setItemRef = (id: number | undefined) => (el: HTMLDivElement | null) => {
        if (id === undefined) return;
        if (el) itemRefs.current.set(id, el);
        else itemRefs.current.delete(id);
    };
    useEffect(() => {
        if (scrollToId === null) return;
        const el = itemRefs.current.get(scrollToId);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        setScrollToId(null);
    }, [scrollToId, planning]);

    const [dayFilter, setDayFilter] = useState<string | null>(null);
    const availableDays = useMemo(() => {
        const days = new Set<string>();
        planning.forEach(item => {
            if (item.day) days.add(item.day.toLowerCase());
        });
        return Array.from(days).sort((a, b) => {
            const ai = DAY_ORDER.indexOf(a);
            const bi = DAY_ORDER.indexOf(b);
            if (ai === -1 && bi === -1) return a.localeCompare(b);
            if (ai === -1) return 1;
            if (bi === -1) return -1;
            return ai - bi;
        });
    }, [planning]);
    const filteredPlanningList = useMemo(() => {
        if (!dayFilter) return planning;
        return planning.filter(item => (item.day || '').toLowerCase() === dayFilter);
    }, [planning, dayFilter]);

    return (
        <Stack gap="lg">
            <Card withBorder padding="lg" radius="lg">
                <Stack gap="md">
                    <Title order={3} size="xs" c="dimmed" fw={700} tt="uppercase">
                        Planning-afbeelding (bovenaan de publieke QR-code pagina)
                    </Title>
                    <Group align="flex-start" gap="lg" wrap="wrap">
                        <Paper
                            withBorder
                            radius="md"
                            style={{
                                width: 256,
                                aspectRatio: '16 / 9',
                                position: 'relative',
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            {imagePreview ? (
                                <Image unoptimized src={imagePreview} alt="Voorbeeld" width={500} height={300} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <ImageIcon size={24} opacity={0.4} />
                            )}
                            {uploadingImage && (
                                <Box
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                    }}
                                >
                                    <Loader size="sm" color="white" />
                                </Box>
                            )}
                        </Paper>
                        <Stack gap="xs" maw={380}>
                            <Group gap="xs">
                                <FileButton onChange={(file) => { void handlePlanningImageChange(file); }} accept="image/*">
                                    {(props) => (
                                        <Button
                                            {...props}
                                            type="button"
                                            variant="light"
                                            color="accent"
                                            size="xs"
                                            leftSection={<Camera size={14} />}
                                        >
                                            {imagePreview ? 'Andere afbeelding kiezen' : 'Afbeelding uploaden'}
                                        </Button>
                                    )}
                                </FileButton>
                                {imagePreview && (
                                    <Button
                                        type="button"
                                        variant="subtle"
                                        color="error"
                                        size="xs"
                                        onClick={() => { void handleRemovePlanningImage(); }}
                                        leftSection={<Trash2 size={14} />}
                                    >
                                        Verwijderen
                                    </Button>
                                )}
                            </Group>
                            {imageUploadError && (
                                <Text size="xs" fw={600} c="error">{imageUploadError}</Text>
                            )}
                            {!imagePreview && !imageUploadError && (
                                <Text size="xs" c="dimmed">
                                    Optioneel. Bijv. een ontworpen posterafbeelding van de planning. Als je niets uploadt, toont de pagina alleen de live planning hieronder.
                                </Text>
                            )}
                        </Stack>
                    </Group>
                </Stack>
            </Card>

            <Card withBorder padding="lg" radius="lg">
                <Stack gap="md">
                    <Title order={3} size="xs" c="dimmed" fw={700} tt="uppercase">
                        Infoboekje (PDF, downloadbaar op de publieke QR-code pagina)
                    </Title>
                    <Group align="flex-start" gap="lg" wrap="wrap">
                        <Paper
                            withBorder
                            radius="md"
                            style={{
                                width: 64,
                                height: 64,
                                position: 'relative',
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            <Text span c={infoBooklet ? 'accent' : 'dimmed'} lh={1}>
                                <FileText size={24} />
                            </Text>
                            {uploadingBooklet && (
                                <Box
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                    }}
                                >
                                    <Loader size="sm" color="white" />
                                </Box>
                            )}
                        </Paper>
                        <Stack gap="xs" maw={420}>
                            <Group gap="xs">
                                <FileButton onChange={(file) => { void handleInfoBookletChange(file); }} accept="application/pdf,.pdf">
                                    {(props) => (
                                        <Button
                                            {...props}
                                            type="button"
                                            variant="light"
                                            color="accent"
                                            size="xs"
                                            leftSection={<Upload size={14} />}
                                        >
                                            {infoBooklet ? 'Ander bestand kiezen' : 'PDF uploaden'}
                                        </Button>
                                    )}
                                </FileButton>
                            </Group>
                            {infoBooklet && (
                                <Group gap="sm">
                                    <Anchor
                                        href={`/api/assets/${infoBooklet}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        size="xs"
                                        fw={600}
                                        c="accent"
                                    >
                                        {bookletFileName || 'Huidig bestand bekijken'}
                                    </Anchor>
                                    <Button
                                        type="button"
                                        variant="subtle"
                                        color="error"
                                        size="xs"
                                        onClick={() => { void handleRemoveInfoBooklet(); }}
                                        leftSection={<Trash2 size={14} />}
                                    >
                                        Verwijderen
                                    </Button>
                                </Group>
                            )}
                            {bookletUploadError && (
                                <Text size="xs" fw={600} c="error">{bookletUploadError}</Text>
                            )}
                            {!infoBooklet && !bookletUploadError && (
                                <Text size="xs" c="dimmed">
                                    Optioneel. Bijv. een programmaboekje met praktische info. Nieuwkomers kunnen dit downloaden op de QR-code pagina.
                                </Text>
                            )}
                        </Stack>
                    </Group>
                </Stack>
            </Card>

            <Group justify="space-between" align="center" wrap="wrap" gap="sm">
                {editingPlanning === null ? (
                    <Button
                        type="button"
                        color="accent"
                        onClick={() => setEditingPlanning({ date: '', time_start: '', title: '', description: '' })}
                        leftSection={<Plus size={16} />}
                    >
                        Nieuw Item
                    </Button>
                ) : (
                    <Box />
                )}

                <SegmentedControl
                    value={view}
                    onChange={(val) => setView(val as 'calendar' | 'list')}
                    color="accent"
                    data={[
                        {
                            value: 'list',
                            label: (
                                <Group gap={6} wrap="nowrap">
                                    <List size={14} />
                                    <Text span inherit>Lijst</Text>
                                </Group>
                            ),
                        },
                        {
                            value: 'calendar',
                            label: (
                                <Group gap={6} wrap="nowrap">
                                    <LayoutGrid size={14} />
                                    <Text span inherit>Kalender</Text>
                                </Group>
                            ),
                        },
                    ]}
                />
            </Group>

            {availableDays.length > 0 && (
                <Group gap="xs" wrap="wrap">
                    <Button
                        type="button"
                        size="xs"
                        variant={dayFilter === null ? 'filled' : 'default'}
                        color={dayFilter === null ? 'accent' : undefined}
                        onClick={() => setDayFilter(null)}
                    >
                        Alle dagen
                    </Button>
                    {availableDays.map(day => (
                        <Button
                            key={day}
                            type="button"
                            size="xs"
                            variant={dayFilter === day ? 'filled' : 'default'}
                            color={dayFilter === day ? 'accent' : undefined}
                            tt="capitalize"
                            onClick={() => setDayFilter(day)}
                        >
                            {day}
                        </Button>
                    ))}
                </Group>
            )}

            {editingPlanning !== null && (
                <Card ref={editFormRef} withBorder padding="xl" radius="lg" style={{ scrollMarginTop: 96 }}>
                    <Stack gap="lg">
                        <Group justify="space-between" align="center">
                            <Title order={3} size="xs" c="dimmed" fw={700} tt="uppercase">
                                {editingPlanning.id ? 'Planning Bewerken' : 'Nieuw Planning Item'}
                            </Title>
                            <ActionIcon type="button" variant="subtle" onClick={() => setEditingPlanning(null)} aria-label="Sluiten">
                                <X size={18} />
                            </ActionIcon>
                        </Group>

                        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
                            <DateInput
                                label="Datum"
                                required
                                value={editingPlanning.date || null}
                                onChange={(val) => setEditingPlanning({ ...editingPlanning, date: val ?? '' })}
                                valueFormat="DD-MM-YYYY"
                                clearable
                            />
                            <TimeInput
                                label="Starttijd"
                                required
                                value={editingPlanning.time_start || ''}
                                onChange={(e) => setEditingPlanning({ ...editingPlanning, time_start: e.currentTarget.value })}
                            />
                            <TimeInput
                                label="Eindtijd"
                                value={editingPlanning.time_end || ''}
                                onChange={(e) => setEditingPlanning({ ...editingPlanning, time_end: e.currentTarget.value })}
                            />
                            <TextInput
                                label="Titel"
                                required
                                value={editingPlanning.title || ''}
                                onChange={(e) => setEditingPlanning({ ...editingPlanning, title: e.currentTarget.value })}
                                placeholder="Activiteit titel..."
                                style={{ gridColumn: 'span 2' }}
                            />
                            <TextInput
                                label="Locatie"
                                value={editingPlanning.location || ''}
                                onChange={(e) => setEditingPlanning({ ...editingPlanning, location: e.currentTarget.value })}
                                placeholder="Bv. TU/e Gemini"
                            />
                            <Textarea
                                label="Beschrijving"
                                description="Opmaak: **vet**, *cursief*, __onderstreept__. Enters blijven behouden."
                                value={editingPlanning.description || ''}
                                onChange={(e) => setEditingPlanning({ ...editingPlanning, description: e.currentTarget.value })}
                                rows={4}
                                placeholder="Wat gaan we doen?"
                                style={{ gridColumn: '1 / -1' }}
                            />
                        </SimpleGrid>

                        <Divider />

                        <Group gap="sm">
                            <Button
                                type="button"
                                color="accent"
                                onClick={() => { void handleSave(); }}
                                loading={saving}
                                disabled={!editingPlanning.date || !editingPlanning.time_start || !editingPlanning.title}
                                leftSection={<Save size={16} />}
                            >
                                Opslaan
                            </Button>
                            <Button
                                type="button"
                                variant="subtle"
                                onClick={() => setEditingPlanning(null)}
                                leftSection={<X size={16} />}
                            >
                                Annuleren
                            </Button>
                        </Group>
                    </Stack>
                </Card>
            )}

            {view === 'list' && (
                <Stack gap="md">
                    {filteredPlanningList.map(item => (
                        <Card
                            key={item.id}
                            ref={setItemRef(item.id)}
                            withBorder
                            padding="lg"
                            radius="lg"
                            style={{ scrollMarginTop: 96 }}
                        >
                            <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
                                <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                                    <Group gap="xs">
                                        {item.day && (
                                            <Badge color="accent" variant="light" size="sm">
                                                {item.day}
                                            </Badge>
                                        )}
                                        {item.date && (
                                            <Text size="xs" fw={600} c="dimmed">{formatDate(item.date)}</Text>
                                        )}
                                    </Group>
                                    <Title order={4} size="md">{item.title}</Title>
                                    <Text size="xs" c="dimmed">
                                        {item.time_start}{item.time_end ? ` - ${item.time_end}` : ''}{item.location ? ` · ${item.location}` : ''}
                                    </Text>
                                    {item.description && (
                                        <Text size="sm" c="dimmed" mt="xs">{item.description}</Text>
                                    )}
                                </Stack>
                                <Group gap="xs" wrap="nowrap">
                                    <ActionButton
                                        icon={Edit}
                                        onClick={() => setEditingPlanning(item)}
                                        title="Bewerken"
                                    />
                                    <ActionButton
                                        icon={Trash}
                                        onClick={() => {
                                            void onDelete(item.id);
                                        }}
                                        variant="danger"
                                        disabled={deletingId === item.id}
                                        title="Verwijderen"
                                    />
                                </Group>
                            </Group>
                        </Card>
                    ))}
                    {filteredPlanningList.length === 0 && planning.length > 0 && (
                        <EmptyState icon={Calendar} text="Geen activiteiten op deze dag" />
                    )}
                    {planning.length === 0 && (
                        <EmptyState icon={Calendar} text="Nog geen planning items aangemaakt" />
                    )}
                </Stack>
            )}

            {view === 'calendar' && planning.length > 0 && (() => {
                const byDay = planning.reduce((acc, item) => {
                    const key = (item.day || 'overig').toLowerCase();
                    const group = acc.get(key) || [];
                    group.push(item);
                    acc.set(key, group);
                    return acc;
                }, new Map<string, IntroPlanningItem[]>());

                const sorted = Array.from(byDay.keys())
                    .filter(day => !dayFilter || day === dayFilter)
                    .sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));
                return (
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                        {sorted.map(day => (
                            <Card key={day} withBorder padding="lg" radius="lg">
                                <Stack gap="md">
                                    <Title order={3} size="xs" c="accent" fw={700} tt="capitalize">
                                        {day}
                                    </Title>
                                    <Divider />
                                    <Stack gap="xs">
                                        {(byDay.get(day) || []).sort((a, b) => (String(a.time_start || '')).localeCompare(String(b.time_start || ''))).map(item => (
                                            <Paper
                                                key={item.id}
                                                ref={setItemRef(item.id)}
                                                withBorder
                                                p="md"
                                                radius="md"
                                                style={{ scrollMarginTop: 96 }}
                                            >
                                                <Group justify="space-between" align="flex-start" wrap="nowrap" gap="xs">
                                                    <Stack gap={2} style={{ minWidth: 0 }}>
                                                        <Text size="sm" fw={600}>{item.title}</Text>
                                                        <Text size="xs" c="dimmed">
                                                            {item.time_start ? String(item.time_start) : ''}{item.time_end ? ` - ${String(item.time_end)}` : ''}
                                                        </Text>
                                                    </Stack>
                                                    <Group gap={4} wrap="nowrap">
                                                        <ActionButton
                                                            icon={Edit}
                                                            onClick={() => setEditingPlanning(item)}
                                                            title="Bewerken"
                                                        />
                                                        <ActionButton
                                                            icon={Trash}
                                                            onClick={() => {
                                                                void onDelete(item.id);
                                                            }}
                                                            variant="danger"
                                                            disabled={deletingId === item.id}
                                                            title="Verwijderen"
                                                        />
                                                    </Group>
                                                </Group>
                                            </Paper>
                                        ))}
                                    </Stack>
                                </Stack>
                            </Card>
                        ))}
                    </SimpleGrid>
                );
            })()}
            {view === 'calendar' && planning.length === 0 && (
                <EmptyState icon={Calendar} text="Nog geen planning items aangemaakt" />
            )}
        </Stack>
    );
}
