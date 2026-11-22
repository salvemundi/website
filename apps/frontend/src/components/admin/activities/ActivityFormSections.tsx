'use client';

import React from 'react';
import MediaAsset from '@/components/ui/media/MediaAsset';
import { Info, Calendar as CalendarIcon, MapPin, Euro, Link as LinkIcon, Upload, X, Eye } from 'lucide-react';
import {
    ActionIcon,
    Box,
    Button,
    Card,
    Checkbox,
    Divider,
    Group,
    NumberInput,
    Paper,
    Radio,
    Select,
    SimpleGrid,
    Stack,
    Text,
    Textarea,
    TextInput,
    ThemeIcon,
    Title,
} from '@mantine/core';
import { DateInput, DateTimePicker, TimeInput } from '@mantine/dates';
import { toLocalISOString } from '@/lib/utils/date-utils';
import { ActivityAdmin } from '@salvemundi/validations';

function cleanCommitteeName(name: string): string {
    return name.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim();
}

interface InitialDataMap {
    [key: string]: unknown;
}

interface FormErrorsMap {
    [key: string]: string[] | undefined;
}

const formatDate = (dateStr?: unknown) =>
    typeof dateStr === 'string' ? toLocalISOString(dateStr) || '' : '';

const formatDateTime = (dateStr?: unknown) =>
    typeof dateStr === 'string' ? toLocalISOString(dateStr, true)?.slice(0, 16) || '' : '';

const formatTime = (timeStr?: unknown) =>
    (typeof timeStr === 'string' && timeStr) ? timeStr.slice(0, 5) : '';

const toInputSafe = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    return String(value);
};

const toNumberOrUndefined = (value: unknown): number | undefined => {
    if (value === null || value === undefined || value === '') return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
};

const parseNlDate = (input: string): string | null => {
    const trimmed = input.trim();
    const nlMatch = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(trimmed);
    if (nlMatch) {
        return `${nlMatch[3]}-${nlMatch[2].padStart(2, '0')}-${nlMatch[1].padStart(2, '0')}`;
    }
    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    return isoMatch ? trimmed : null;
};

const toAmsterdamLocalString = (val: string | null): string => {
    if (!val) return '';
    return val.replace(' ', 'T').slice(0, 16);
};

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
    return (
        <Group gap="sm" mb="md">
            <ThemeIcon size="md" color="accent">
                {icon}
            </ThemeIcon>
            <Title order={2} size="h5">{title}</Title>
        </Group>
    );
}

export function GeneralInfoSection({
    initialData,
    formErrors
}: {
    initialData?: Partial<ActivityAdmin>,
    formErrors?: FormErrorsMap
}) {
    return (
        <Card withBorder padding="lg">
            <SectionTitle icon={<Info size={16} />} title="Beschrijving" />
            <Divider mb="lg" />
            <Stack gap="lg">
                <TextInput
                    id="name"
                    name="name"
                    label="Naam van de activiteit"
                    required
                    defaultValue={toInputSafe(initialData?.name)}
                    autoComplete="off"
                    placeholder="Bijv. Borrel: Back to School"
                    error={formErrors?.name?.[0]}
                />

                <Textarea
                    id="description"
                    name="description"
                    label="Publieke beschrijving"
                    required
                    rows={8}
                    defaultValue={toInputSafe(initialData?.description)}
                    placeholder="Plak hier je WhatsApp bericht. Gebruik **tekst** voor dikgedrukt."
                    error={formErrors?.description?.[0]}
                    styles={{ input: { fontFamily: 'monospace' } }}
                />

                <Textarea
                    id="short_description"
                    name="short_description"
                    label="Korte beschrijving / TL;DR"
                    description="Optioneel (voor preview kaarten)"
                    rows={4}
                    defaultValue={toInputSafe(initialData?.short_description)}
                    placeholder="Bijv. een korte samenvatting of TL;DR voor op de overzichtskaart."
                    error={formErrors?.short_description?.[0]}
                    styles={{ input: { fontFamily: 'monospace' } }}
                />

                <Textarea
                    id="description_logged_in"
                    name="description_logged_in"
                    label="Extra informatie (alleen ingelogd)"
                    description="Optioneel"
                    rows={3}
                    defaultValue={toInputSafe(initialData?.description_logged_in)}
                    placeholder="Bijv. verzamelplek, wat mee te nemen..."
                    error={formErrors?.description_logged_in?.[0]}
                    styles={{ input: { fontFamily: 'monospace' } }}
                />
            </Stack>
        </Card>
    );
}

export function PlanningLocationSection({ initialData, formErrors }: { initialData?: InitialDataMap, formErrors?: FormErrorsMap }) {
    const initialStartDateStr = formatDate(initialData?.event_date) || toLocalISOString(new Date()) || null;
    const initialEndDateStr = formatDate(initialData?.event_date_end) || null;
    const initialStartTimeStr = formatTime(initialData?.event_time) || '00:00';
    const initialEndTimeStr = formatTime(initialData?.event_time_end);

    const initialDeadlineISO = formatDateTime(initialData?.registration_deadline);
    const initialDeadlineDateStr = initialDeadlineISO ? initialDeadlineISO.slice(0, 10) : null;
    const initialDeadlineTimeStr = initialDeadlineISO ? initialDeadlineISO.slice(11, 16) : '';

    const [startDate, setStartDate] = React.useState<string | null>(initialStartDateStr);
    const [endDate, setEndDate] = React.useState<string | null>(initialEndDateStr);
    const [startTime, setStartTime] = React.useState<string>(initialStartTimeStr);
    const [endTime, setEndTime] = React.useState<string>(initialEndTimeStr);
    const [deadlineDate, setDeadlineDate] = React.useState<string | null>(initialDeadlineDateStr);
    const [deadlineTime, setDeadlineTime] = React.useState<string>(initialDeadlineTimeStr);

    const isSameDay = React.useMemo(() => {
        return Boolean(startDate && endDate && startDate === endDate);
    }, [startDate, endDate]);

    const minEndTime = React.useMemo(() => {
        return isSameDay ? startTime || undefined : undefined;
    }, [isSameDay, startTime]);

    const deadlineValue = React.useMemo(() => {
        if (!deadlineDate) return '';
        const timeStr = deadlineTime ? deadlineTime.slice(0, 5) : '23:59';
        return `${deadlineDate}T${timeStr}`;
    }, [deadlineDate, deadlineTime]);

    const handleStartDateChange = (dateStr: string | null) => {
        setStartDate(dateStr);
        if (dateStr && (!endDate || endDate < dateStr)) {
            setEndDate(dateStr);
        }
    };

    const handleEndDateChange = (dateStr: string | null) => {
        setEndDate(dateStr);
        if (dateStr && startDate && dateStr === startDate) {
            if (endTime && startTime && endTime < startTime) {
                setEndTime('');
            }
        }
    };

    const handleDeadlineDateChange = (dateStr: string | null) => {
        setDeadlineDate(dateStr);
        if (dateStr && !deadlineTime) {
            setDeadlineTime('23:59');
        }
        if (!dateStr) {
            setDeadlineTime('');
        }
    };

    const handleClearDeadline = () => {
        setDeadlineDate(null);
        setDeadlineTime('');
    };

    return (
        <Card withBorder padding="lg" h="100%">
            <SectionTitle icon={<CalendarIcon size={16} />} title="Planning & locatie" />
            <Divider mb="lg" />
            <Stack gap="lg" style={{ flex: 1 }}>
                <Group align="flex-start" gap="md" wrap="wrap">
                    <Box style={{ flex: 1, minWidth: 180 }}>
                        <input type="hidden" name="event_date" value={startDate ?? ''} />
                        <DateInput
                            id="event_date"
                            label="Startdatum"
                            required
                            value={startDate}
                            onChange={handleStartDateChange}
                            valueFormat="DD-MM-YYYY"
                            dateParser={parseNlDate}
                            placeholder="dd-mm-jjjj"
                            error={formErrors?.event_date?.[0]}
                        />
                    </Box>
                    <Box w={{ base: '100%', sm: 144 }}>
                        <TimeInput
                            id="event_time"
                            name="event_time"
                            label="Starttijd"
                            value={startTime}
                            onChange={(e) => {
                                const val = e.currentTarget.value;
                                setStartTime(val);
                                if (isSameDay && endTime && endTime < val) {
                                    setEndTime('');
                                }
                            }}
                        />
                    </Box>
                </Group>

                <Group align="flex-start" gap="md" wrap="wrap">
                    <Box style={{ flex: 1, minWidth: 180 }}>
                        <input type="hidden" name="event_date_end" value={endDate ?? ''} />
                        <DateInput
                            id="event_date_end"
                            label="Einddatum"
                            value={endDate}
                            onChange={handleEndDateChange}
                            minDate={startDate ?? undefined}
                            valueFormat="DD-MM-YYYY"
                            dateParser={parseNlDate}
                            placeholder="dd-mm-jjjj"
                            clearable
                            error={formErrors?.event_date_end?.[0]}
                        />
                    </Box>
                    <Box w={{ base: '100%', sm: 144 }}>
                        <TimeInput
                            id="event_time_end"
                            name="event_time_end"
                            label="Eindtijd"
                            value={endTime}
                            minTime={minEndTime}
                            onChange={(e) => setEndTime(e.currentTarget.value)}
                        />
                    </Box>
                </Group>

                <Group align="flex-start" gap="md" wrap="wrap">
                    <Box style={{ flex: 1, minWidth: 180 }}>
                        <input type="hidden" name="registration_deadline" value={deadlineValue} />
                        <Group justify="space-between" mb={4}>
                            <Text component="label" htmlFor="registration_deadline_date" size="sm" fw={500}>
                                Inschrijfdeadline
                            </Text>
                            {(deadlineDate || deadlineTime) && (
                                <Button
                                    type="button"
                                    color="error"
                                    size="compact-xs"
                                    onClick={handleClearDeadline}
                                    leftSection={<X size={12} />}
                                >
                                    Wissen
                                </Button>
                            )}
                        </Group>
                        <DateInput
                            id="registration_deadline_date"
                            value={deadlineDate}
                            onChange={handleDeadlineDateChange}
                            maxDate={startDate ?? undefined}
                            valueFormat="DD-MM-YYYY"
                            dateParser={parseNlDate}
                            placeholder="dd-mm-jjjj"
                            clearable
                            error={formErrors?.registration_deadline?.[0]}
                        />
                    </Box>
                    <Box w={{ base: '100%', sm: 144 }}>
                        <TimeInput
                            id="registration_deadline_time"
                            label="Deadlinetijd"
                            value={deadlineTime}
                            onChange={(e) => setDeadlineTime(e.currentTarget.value)}
                            disabled={!deadlineDate}
                        />
                    </Box>
                </Group>

                <Divider mt="auto" />

                <TextInput
                    id="location"
                    name="location"
                    label="Locatie"
                    leftSection={<MapPin size={14} />}
                    defaultValue={toInputSafe(initialData?.location)}
                    placeholder="Bijv. Fontys R10"
                />

                <TextInput
                    id="custom_url"
                    name="custom_url"
                    label="Custom redirect URL"
                    leftSection={<LinkIcon size={14} />}
                    defaultValue={toInputSafe(initialData?.custom_url)}
                    placeholder="bijv. https://forms.gle/..."
                />
            </Stack>
        </Card>
    );
}

export function CapacityCostsSection({
    initialData,
    committees,
    contactEmail,
    onContactEmailChange,
    onCommitteeChange,
    onlyMembers,
    onOnlyMembersChange,
    formErrors
}: {
    initialData?: InitialDataMap,
    committees: { id: string | number, name: string }[],
    contactEmail: string,
    onContactEmailChange: (val: string) => void,
    onCommitteeChange: (id: string) => void,
    onlyMembers: boolean,
    onOnlyMembersChange: (val: boolean) => void,
    formErrors?: FormErrorsMap
}) {
    const [committeeId, setCommitteeId] = React.useState<string>(toInputSafe(initialData?.committee_id));

    return (
        <Card withBorder padding="lg" h="100%">
            <SectionTitle icon={<Euro size={16} />} title="Kosten & capaciteit" />
            <Divider mb="lg" />
            <Stack gap="lg" style={{ flex: 1 }}>
                <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
                    <NumberInput
                        id="max_sign_ups"
                        name="max_sign_ups"
                        label="Max. deelnemers"
                        min={0}
                        allowDecimal={false}
                        defaultValue={toNumberOrUndefined(initialData?.max_sign_ups)}
                        placeholder="Onbeperkt"
                        error={formErrors?.max_sign_ups?.[0]}
                    />
                    <NumberInput
                        id="price_members"
                        name="price_members"
                        label="Leden (€)"
                        min={0}
                        step={0.01}
                        decimalScale={2}
                        defaultValue={toNumberOrUndefined(initialData?.price_members)}
                        placeholder="0.00"
                    />
                    <NumberInput
                        id="price_non_members"
                        name="price_non_members"
                        label="Niet-leden (€)"
                        min={0}
                        step={0.01}
                        decimalScale={2}
                        defaultValue={toNumberOrUndefined(initialData?.price_non_members)}
                        placeholder="0.00"
                    />
                </SimpleGrid>

                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                    <Box>
                        <input type="hidden" name="committee_id" value={committeeId} />
                        <Select
                            id="committee_id"
                            label="Organiserende commissie"
                            value={committeeId}
                            onChange={(val) => {
                                const nextVal = val ?? '';
                                setCommitteeId(nextVal);
                                onCommitteeChange(nextVal);
                            }}
                            data={[
                                { value: '', label: 'Geen (Algemeen)' },
                                ...committees.map(c => ({ value: String(c.id), label: cleanCommitteeName(c.name) }))
                            ]}
                            allowDeselect={false}
                        />
                    </Box>

                    <TextInput
                        id="contact"
                        name="contact"
                        type="email"
                        label="Contactpersoon (e-mail)"
                        value={contactEmail}
                        onChange={(e) => onContactEmailChange(e.currentTarget.value)}
                        autoComplete="off"
                        placeholder="naam@salvemundi.nl"
                    />
                </SimpleGrid>

                <Paper withBorder p="md" mt="auto">
                    <Checkbox
                        id="only_members"
                        checked={onlyMembers}
                        onChange={(e) => onOnlyMembersChange(e.currentTarget.checked)}
                        label="Alleen toegankelijk voor leden"
                    />
                </Paper>
            </Stack>
        </Card>
    );
}

export function BannerSection({ imagePreview, onUploadClick, onRemoveClick, fileInputRef, onFileChange }: {
    imagePreview: { id: string; type?: string | null } | null,
    onUploadClick: () => void,
    onRemoveClick: () => void,
    fileInputRef: React.RefObject<HTMLInputElement | null>,
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
    return (
        <Card withBorder padding="lg">
            <SectionTitle icon={<Upload size={16} />} title="Banner" />
            <Divider mb="md" />
            {!imagePreview ? (
                <Paper
                    withBorder
                    p="xl"
                    onClick={onUploadClick}
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
                    <Text size="sm" fw={600} c="dimmed" mt="xs" ta="center">
                        Upload banner
                    </Text>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        onChange={onFileChange}
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
                        sizes="(max-width: 768px) 100vw, 800px"
                        objectFit="contain"
                    />
                    <Group
                        gap="xs"
                        pos="absolute"
                        top={8}
                        right={8}
                    >
                        <ActionIcon
                            type="button"
                            size="md"
                            onClick={onUploadClick}
                            aria-label="Banner wijzigen"
                        >
                            <Upload size={14} />
                        </ActionIcon>
                        <ActionIcon
                            type="button"
                            color="error"
                            size="md"
                            onClick={onRemoveClick}
                            aria-label="Banner verwijderen"
                        >
                            <X size={14} />
                        </ActionIcon>
                    </Group>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        onChange={onFileChange}
                        style={{ display: 'none' }}
                    />
                </Box>
            )}
        </Card>
    );
}

export function StatusSection({ status, onStatusChange, initialData }: { status: string, onStatusChange: (val: string) => void, initialData?: InitialDataMap }) {
    const initialPublishDate = formatDateTime(initialData?.publish_date);
    const [publishDate, setPublishDate] = React.useState<string | null>(initialPublishDate || null);

    return (
        <Card withBorder padding="lg">
            <SectionTitle icon={<Eye size={16} />} title="Status" />
            <Divider mb="md" />
            <Radio.Group value={status} onChange={onStatusChange}>
                <Stack gap="sm">
                    <Radio value="published" label="Gepubliceerd" />
                    <Radio value="draft" label="Concept" />
                    <Radio value="scheduled" label="Inplannen" />
                </Stack>
            </Radio.Group>

            {status === 'scheduled' && (
                <Box mt="md">
                    <input type="hidden" name="publish_date" value={toAmsterdamLocalString(publishDate)} />
                    <DateTimePicker
                        label="Publicatiedatum & -tijd"
                        placeholder="Kies datum en tijd"
                        value={publishDate}
                        onChange={setPublishDate}
                        valueFormat="DD-MM-YYYY HH:mm"
                        clearable
                    />
                </Box>
            )}
        </Card>
    );
}
