'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import type { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Camera, CalendarClock, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import {
    Alert,
    Badge,
    Box,
    Button,
    Group,
    Paper,
    Select,
    SimpleGrid,
    Stack,
    Text,
    Textarea,
    TextInput,
} from '@mantine/core';
import { DateInput, TimeInput } from '@mantine/dates';
import {
    CAMERA_PHOTO_STATUS_LABEL,
    createCameraRequestSchema,
    type CameraCommitteeOption,
    type CameraEventOption,
    type CameraPhotographerOption,
    type CameraRequestStatus,
    type CameraRequestSummary,
    type CreateCameraRequestInput,
} from '@salvemundi/validations';
import { Tile } from '@/components/islands/account/profile/ProfielUI';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import { formatDate } from '@/shared/lib/utils/date';
import {
    cancelCameraRequest,
    createCameraRequest,
    getCameraAvailability,
    type CameraAvailability,
} from '@/server/actions/public/camera.actions';
import { STATUS_LABEL } from './camera-utils';

interface Props {
    events: CameraEventOption[];
    committees: CameraCommitteeOption[];
    myCommitteeIds: number[];
    photographers: CameraPhotographerOption[];
    mine: CameraRequestSummary[];
}

type FormInput = z.input<typeof createCameraRequestSchema>;

const OTHER = 'other';

const parseNlDate = (input: string): string | null => {
    const trimmed = input.trim();
    const nlMatch = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(trimmed);
    if (nlMatch) {
        return `${nlMatch[3]}-${nlMatch[2].padStart(2, '0')}-${nlMatch[1].padStart(2, '0')}`;
    }
    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    return isoMatch ? trimmed : null;
};

function getStatusBadgeProps(status: CameraRequestStatus) {
    switch (status) {
        case 'requested':
            return { color: 'accent', variant: 'light' as const };
        case 'approved':
            return { color: 'success', variant: 'light' as const };
        case 'rejected':
            return { color: 'error', variant: 'light' as const };
        case 'cancelled':
            return { color: undefined, variant: 'default' as const };
    }
}

function formatPeriod(r: { start_date: string; start_time: string | null; end_date: string; end_time: string | null }) {
    const from = `${formatDate(r.start_date, 'd MMM yyyy')}${r.start_time ? ` ${r.start_time}` : ''}`;
    const to = `${formatDate(r.end_date, 'd MMM yyyy')}${r.end_time ? ` ${r.end_time}` : ''}`;
    return r.start_date === r.end_date && !r.start_time && !r.end_time ? from : `${from} – ${to}`;
}

export function CameraRequestIsland({ events, committees, myCommitteeIds, photographers, mine }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const { showToast } = useAdminToast();
    const [selected, setSelected] = useState<string>(events.length > 0 ? '' : OTHER);
    // Standaard filteren op de commissies van het lid, tenzij daar geen activiteiten bij zijn.
    const hasMine = events.some((e) => e.committee_id !== null && myCommitteeIds.includes(e.committee_id));
    const [filter, setFilter] = useState<string>(hasMine ? 'mine' : 'all');

    const visibleEvents = useMemo(() => {
        if (filter === 'all') return events;
        if (filter === 'mine') return events.filter((e) => e.committee_id !== null && myCommitteeIds.includes(e.committee_id));
        return events.filter((e) => String(e.committee_id) === filter);
    }, [events, filter, myCommitteeIds]);
    const [availability, setAvailability] = useState<CameraAvailability | null>(null);

    const {
        register,
        control,
        handleSubmit,
        reset,
        setValue,
        trigger,
        watch,
        formState: { errors },
    } = useForm<FormInput, unknown, CreateCameraRequestInput>({
        resolver: zodResolver(createCameraRequestSchema),
        defaultValues: {
            event_id: null,
            event_name: '',
            start_date: '',
            start_time: '',
            end_date: '',
            end_time: '',
            proposed_photographer_id: '',
            note: '',
        },
    });

    const startDate = watch('start_date');
    const startTime = watch('start_time');
    const endDate = watch('end_date');
    const endTime = watch('end_time');

    // Valideer eind t.o.v. start direct, zodat een eindtijd voor de starttijd meteen wordt gemeld.
    useEffect(() => {
        if (endDate) void trigger('end_date');
        if (endTime) void trigger('end_time');
    }, [startDate, startTime, endDate, endTime, trigger]);

    const sameDay = !!startDate && startDate === endDate;

    // Live "periode vrij?"-check zodra er een geldige periode is ingevuld.
    useEffect(() => {
        if (!startDate || !endDate) {
            setAvailability(null);
            return;
        }
        let cancelled = false;
        const t = setTimeout(() => {
            void getCameraAvailability({
                start_date: startDate,
                start_time: startTime || null,
                end_date: endDate,
                end_time: endTime || null,
            }).then((a) => {
                if (!cancelled) setAvailability(a);
            });
        }, 300);
        return () => {
            cancelled = true;
            clearTimeout(t);
        };
    }, [startDate, startTime, endDate, endTime]);

    const onSelectEvent = (value: string) => {
        setSelected(value);
        if (value === '' || value === OTHER) {
            setValue('event_id', null);
            if (value === OTHER) setValue('event_name', '');
            return;
        }
        const ev = events.find((e) => String(e.id) === value);
        if (!ev) return;
        setValue('event_id', ev.id);
        setValue('event_name', ev.name, { shouldValidate: true });
        setValue('start_date', ev.start_date, { shouldValidate: true });
        setValue('start_time', ev.start_time ?? '');
        setValue('end_date', ev.end_date, { shouldValidate: true });
        setValue('end_time', ev.end_time ?? '');
    };

    const onSubmit = (data: CreateCameraRequestInput) => {
        startTransition(async () => {
            const result = await createCameraRequest(data);
            if (result.success) {
                reset();
                setSelected(events.length > 0 ? '' : OTHER);
                setAvailability(null);
                showToast('Aanvraag verstuurd. Het beheer beoordeelt hem zo snel mogelijk.', 'success');
                router.refresh();
            } else {
                showToast(result.error, 'error');
            }
        });
    };

    const onCancel = (id: string) => {
        startTransition(async () => {
            const result = await cancelCameraRequest(id);
            if (result.success) {
                showToast('Aanvraag geannuleerd', 'success');
                router.refresh();
            } else {
                showToast(result.error, 'error');
            }
        });
    };

    const blocked = (availability?.approved.length ?? 0) > 0;

    const filterOptions = useMemo(() => {
        const opts: { value: string; label: string }[] = [];
        if (myCommitteeIds.length > 0) opts.push({ value: 'mine', label: 'Mijn commissies' });
        opts.push({ value: 'all', label: 'Alle activiteiten' });
        for (const c of committees) {
            opts.push({ value: String(c.id), label: c.name });
        }
        return opts;
    }, [myCommitteeIds.length, committees]);

    const eventOptions = useMemo(() => {
        const opts: { value: string; label: string }[] = [];
        if (events.length > 0) opts.push({ value: '', label: 'Kies een activiteit van de website…' });
        for (const ev of visibleEvents) {
            const suffix = ev.status === 'draft' ? ' – concept' : ev.status === 'scheduled' ? ' – gepland' : '';
            opts.push({
                value: String(ev.id),
                label: `${ev.name} (${formatDate(ev.start_date, 'd MMM yyyy')})${suffix}`,
            });
        }
        opts.push({ value: OTHER, label: 'Anders / activiteit staat nog niet op de website' });
        return opts;
    }, [events.length, visibleEvents]);

    const photographerOptions = useMemo(
        () => [
            { value: '', label: 'Geen voorkeur' },
            ...photographers.map((p) => ({ value: String(p.id), label: p.name })),
        ],
        [photographers]
    );

    return (
        <Stack gap="xl">
            <Tile title="Camera aanvragen" icon={<Camera size={22} />}>
                <Box component="form" onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate>
                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                        {events.length > 0 && (
                            <Box style={{ gridColumn: '1 / -1' }}>
                                <Select
                                    label="Filter activiteiten"
                                    value={filter}
                                    onChange={(val) => {
                                        const nextVal = val ?? 'all';
                                        setFilter(nextVal);
                                        if (selected !== OTHER) onSelectEvent('');
                                    }}
                                    data={filterOptions}
                                    allowDeselect={false}
                                />
                            </Box>
                        )}

                        <Box style={{ gridColumn: '1 / -1' }}>
                            <Select
                                label="Activiteit"
                                value={selected}
                                onChange={(val) => onSelectEvent(val ?? '')}
                                data={eventOptions}
                                searchable
                                allowDeselect={false}
                            />
                        </Box>

                        <Box style={{ gridColumn: '1 / -1' }}>
                            <TextInput
                                label="Naam activiteit"
                                required
                                maxLength={255}
                                placeholder="Bijv. Kamp, Kroegentocht, Sintercantus"
                                error={errors.event_name?.message}
                                {...register('event_name')}
                            />
                        </Box>

                        <Controller
                            name="start_date"
                            control={control}
                            render={({ field }) => (
                                <DateInput
                                    label="Startdatum"
                                    required
                                    value={field.value || null}
                                    onChange={(val) => field.onChange(val ?? '')}
                                    valueFormat="DD-MM-YYYY"
                                    dateParser={parseNlDate}
                                    placeholder="dd-mm-jjjj"
                                    error={errors.start_date?.message}
                                />
                            )}
                        />

                        <TimeInput
                            label="Starttijd (optioneel)"
                            error={errors.start_time?.message}
                            {...register('start_time')}
                        />

                        <Controller
                            name="end_date"
                            control={control}
                            render={({ field }) => (
                                <DateInput
                                    label="Einddatum"
                                    required
                                    value={field.value || null}
                                    onChange={(val) => field.onChange(val ?? '')}
                                    minDate={startDate || undefined}
                                    valueFormat="DD-MM-YYYY"
                                    dateParser={parseNlDate}
                                    placeholder="dd-mm-jjjj"
                                    error={errors.end_date?.message}
                                />
                            )}
                        />

                        <TimeInput
                            label="Eindtijd (optioneel)"
                            minTime={sameDay && startTime ? startTime : undefined}
                            error={errors.end_time?.message}
                            {...register('end_time')}
                        />

                        {availability && (
                            <Box style={{ gridColumn: '1 / -1' }} role="status">
                                {blocked ? (
                                    <Alert color="error" icon={<AlertTriangle size={16} />}>
                                        De camera is in deze periode al gereserveerd
                                        {availability.approved.length > 0 &&
                                            ` (${availability.approved.map((a) => a.event_name).join(', ')})`}
                                        . Kies een andere periode.
                                    </Alert>
                                ) : availability.requested > 0 ? (
                                    <Alert color="accent" icon={<AlertTriangle size={16} />}>
                                        Voor deze periode is al een andere aanvraag ingediend die nog niet is beoordeeld. Je kunt wel aanvragen.
                                    </Alert>
                                ) : (
                                    <Alert color="success" icon={<CheckCircle2 size={16} />}>
                                        De camera is in deze periode beschikbaar.
                                    </Alert>
                                )}
                            </Box>
                        )}

                        {photographers.length > 0 && (
                            <Box style={{ gridColumn: '1 / -1' }}>
                                <Controller
                                    name="proposed_photographer_id"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            label="Gewenste fotograaf (optioneel)"
                                            data={photographerOptions}
                                            value={field.value ?? ''}
                                            onChange={(val) => field.onChange(val ?? '')}
                                            error={errors.proposed_photographer_id?.message}
                                            allowDeselect={false}
                                        />
                                    )}
                                />
                            </Box>
                        )}

                        <Box style={{ gridColumn: '1 / -1' }}>
                            <Textarea
                                label="Opmerking (optioneel)"
                                rows={3}
                                maxLength={500}
                                error={errors.note?.message}
                                {...register('note')}
                            />
                        </Box>

                        <Box style={{ gridColumn: '1 / -1' }}>
                            <Button
                                type="submit"
                                disabled={blocked}
                                loading={isPending}
                                leftSection={<Camera size={16} />}
                                w={{ base: '100%', sm: 'auto' }}
                            >
                                {isPending ? 'Versturen...' : 'Aanvraag versturen'}
                            </Button>
                        </Box>
                    </SimpleGrid>
                </Box>
            </Tile>

            <Tile title="Mijn aanvragen" icon={<CalendarClock size={22} />}>
                {mine.length === 0 ? (
                    <Paper p="xl" withBorder ta="center" style={{ borderStyle: 'dashed' }}>
                        <Text size="sm" fw={700} c="dimmed">
                            Je hebt nog geen aanvragen gedaan.
                        </Text>
                    </Paper>
                ) : (
                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
                        {mine.map((r) => {
                            const badgeProps = getStatusBadgeProps(r.status);
                            return (
                                <Paper key={r.id} p="md" withBorder>
                                    <Stack gap={6}>
                                        <Group gap="xs" wrap="wrap" justify="space-between">
                                            <Text size="sm" fw={900} truncate style={{ flex: 1 }}>
                                                {r.event_name}
                                            </Text>
                                            <Badge size="xs" color={badgeProps.color} variant={badgeProps.variant}>
                                                {STATUS_LABEL[r.status]}
                                            </Badge>
                                        </Group>
                                        <Text size="xs" fw={700}>
                                            {formatPeriod(r)}
                                        </Text>
                                        {(r.assigned_photographer_name ?? r.proposed_photographer_name) && (
                                            <Text size="xs" c="dimmed">
                                                Fotograaf: {r.assigned_photographer_name ?? `${r.proposed_photographer_name} (voorstel)`}
                                            </Text>
                                        )}
                                        {r.status === 'approved' && (
                                            <Text size="xs" c="dimmed">
                                                Foto&apos;s: {CAMERA_PHOTO_STATUS_LABEL[r.photo_status]}
                                            </Text>
                                        )}
                                        {r.note_admin && (
                                            <Text size="xs" c="dimmed">
                                                Beheer: {r.note_admin}
                                            </Text>
                                        )}
                                        {(r.status === 'requested' || r.status === 'approved') && (
                                            <Box pt={2}>
                                                <Button
                                                    type="button"
                                                    size="compact-xs"
                                                    color="error"
                                                    onClick={() => onCancel(r.id)}
                                                    disabled={isPending}
                                                    leftSection={<X size={14} />}
                                                >
                                                    Annuleren
                                                </Button>
                                            </Box>
                                        )}
                                    </Stack>
                                </Paper>
                            );
                        })}
                    </SimpleGrid>
                )}
            </Tile>
        </Stack>
    );
}
