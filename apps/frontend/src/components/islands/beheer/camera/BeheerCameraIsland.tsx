'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Camera, CalendarDays, Check, CalendarClock, ClipboardList, HandHelping, Pencil, Plus, Trash2, UserCheck, X } from 'lucide-react';
import {
    ActionIcon,
    Alert,
    Badge,
    Button,
    Card,
    Checkbox,
    Group,
    NativeSelect,
    Paper,
    SimpleGrid,
    Stack,
    Tabs,
    Text,
    TextInput,
    Title,
    Tooltip,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import {
    CAMERA_CHECKLIST_ITEMS,
    CAMERA_PHOTO_STATUSES,
    CAMERA_PHOTO_STATUS_LABEL,
    type CameraPhotoStatus,
    type CameraAdminLoan,
    type CameraAdminPhotographer,
    type CameraAdminRequest,
    type CameraChecklist,
    type CameraMemberOption,
    type CameraRequestStatus,
} from '@salvemundi/validations';
import CameraCalendar from './CameraCalendar';
import CameraLoansPanel from './CameraLoansPanel';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import { formatDate } from '@/shared/lib/utils/date';
import {
    addCameraPhotographerAction,
    removeCameraPhotographerAction,
    handoutCameraAction,
    saveCameraRequestAction,
    searchCameraMembersAction,
    updateCameraPhotographerAction,
    updateCameraRequesterAction,
} from '@/server/actions/beheer/camera/beheer-camera.actions';
import { STATUS_LABEL } from '@/components/islands/camera/camera-utils';

interface Props {
    requests: CameraAdminRequest[];
    photographers: CameraAdminPhotographer[];
    loans: CameraAdminLoan[];
}

type Tab = 'pending' | 'upcoming' | 'calendar' | 'loans' | 'archive' | 'photographers';
type Toast = ReturnType<typeof useAdminToast>['showToast'];

function formatPeriod(r: CameraAdminRequest) {
    const from = `${formatDate(r.start_date, 'd MMM yyyy')}${r.start_time ? ` ${r.start_time}` : ''}`;
    const to = `${formatDate(r.end_date, 'd MMM yyyy')}${r.end_time ? ` ${r.end_time}` : ''}`;
    return r.start_date === r.end_date && !r.start_time && !r.end_time ? from : `${from} – ${to}`;
}

function getStatusBadgeProps(status: CameraRequestStatus): { color?: string; variant: 'light' | 'default' } {
    switch (status) {
        case 'requested':
            return { color: 'accent', variant: 'light' };
        case 'approved':
            return { color: 'success', variant: 'light' };
        case 'rejected':
            return { color: 'error', variant: 'light' };
        case 'cancelled':
            return { variant: 'default' };
    }
}

const PHOTO_STATUS_LABEL_MAP = new Map<string, string>(Object.entries(CAMERA_PHOTO_STATUS_LABEL));
const EMPTY_CHECKLIST: CameraChecklist = { camera: false, lens: false, flash: false, battery: false, card: false };

function HandoutForm({ request, showToast }: { request: CameraAdminRequest; showToast: Toast }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);
    const [checklist, setChecklist] = useState<CameraChecklist>(EMPTY_CHECKLIST);
    const [note, setNote] = useState('');

    const submit = () => {
        startTransition(async () => {
            const result = await handoutCameraAction({ request_id: request.id, checklist, note });
            if (result.success) {
                showToast('Camera meegegeven', 'success');
                setOpen(false);
                router.refresh();
            } else {
                showToast(result.error, 'error');
            }
        });
    };

    if (!open) {
        return (
            <Button
                type="button"
                variant="light"
                color="brand"
                size="xs"
                onClick={() => setOpen(true)}
                leftSection={<HandHelping size={14} />}
            >
                Meegeven
            </Button>
        );
    }

    return (
        <Paper withBorder p="md" radius="md" w="100%">
            <Stack gap="sm">
                <Text size="xs" fw={700}>Controleer samen met de lener of alles compleet is:</Text>
                <Group gap="md" wrap="wrap">
                    {CAMERA_CHECKLIST_ITEMS.map((item) => (
                        <Checkbox
                            key={item.key}
                            size="xs"
                            label={item.label}
                            checked={checklist[item.key]}
                            onChange={(e) => {
                                const checked = e.currentTarget.checked;
                                setChecklist((c) => ({ ...c, [item.key]: checked }));
                            }}
                        />
                    ))}
                </Group>
                <TextInput
                    size="xs"
                    value={note}
                    maxLength={500}
                    placeholder="Opmerking bij meegeven (optioneel)"
                    onChange={(e) => setNote(e.currentTarget.value)}
                />
                <Group gap="xs">
                    <Button
                        type="button"
                        size="xs"
                        onClick={submit}
                        loading={isPending}
                        leftSection={<HandHelping size={14} />}
                    >
                        Bevestig meegeven
                    </Button>
                    <Button
                        type="button"
                        size="xs"
                        variant="default"
                        onClick={() => setOpen(false)}
                    >
                        Annuleren
                    </Button>
                </Group>
            </Stack>
        </Paper>
    );
}

function RequesterEditor({ request, showToast }: { request: CameraAdminRequest; showToast: Toast }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [editing, setEditing] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<CameraMemberOption[]>([]);

    const search = (value: string) => {
        setQuery(value);
        if (value.trim().length < 2) {
            setResults([]);
            return;
        }
        void searchCameraMembersAction(value).then(setResults);
    };

    const choose = (member: CameraMemberOption) => {
        startTransition(async () => {
            const result = await updateCameraRequesterAction(request.id, member.id);
            if (result.success) {
                showToast(`Aanvrager gewijzigd naar ${member.name}`, 'success');
                setEditing(false);
                setQuery('');
                setResults([]);
                router.refresh();
            } else {
                showToast(result.error, 'error');
            }
        });
    };

    if (!editing) {
        return (
            <Button
                type="button"
                variant="subtle"
                size="xs"
                px={4}
                onClick={() => setEditing(true)}
                leftSection={<Pencil size={12} />}
            >
                Aanvrager wijzigen
            </Button>
        );
    }

    return (
        <Paper withBorder p="sm" radius="md" w="100%">
            <Stack gap="xs">
                <TextInput
                    size="xs"
                    value={query}
                    onChange={(e) => search(e.currentTarget.value)}
                    placeholder="Zoek een actief lid op voor- of achternaam"
                    disabled={isPending}
                />
                {results.length > 0 && (
                    <Stack gap={4}>
                        {results.map((r) => (
                            <Button
                                key={r.id}
                                type="button"
                                variant="default"
                                size="xs"
                                justify="flex-start"
                                fullWidth
                                onClick={() => choose(r)}
                                disabled={isPending}
                            >
                                {r.name}
                            </Button>
                        ))}
                    </Stack>
                )}
                <Group>
                    <Button
                        type="button"
                        variant="subtle"
                        size="xs"
                        onClick={() => {
                            setEditing(false);
                            setQuery('');
                            setResults([]);
                        }}
                    >
                        Annuleren
                    </Button>
                </Group>
            </Stack>
        </Paper>
    );
}

function RequestCard({
    request,
    photographers,
    loan,
    showToast,
}: {
    request: CameraAdminRequest;
    photographers: CameraAdminPhotographer[];
    loan: CameraAdminLoan | undefined;
    showToast: Toast;
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [photographerId, setPhotographerId] = useState(
        request.assigned_photographer_id ?? request.proposed_photographer_id ?? '',
    );
    const [noteAdmin, setNoteAdmin] = useState(request.note_admin ?? '');
    const [photoStatus, setPhotoStatus] = useState<CameraPhotoStatus>(request.photo_status);

    const save = (status: CameraRequestStatus, message: string) => {
        startTransition(async () => {
            const result = await saveCameraRequestAction({
                id: request.id,
                status,
                photo_status: photoStatus,
                assigned_photographer_id: photographerId || null,
                note_admin: noteAdmin,
            });
            if (result.success) {
                showToast(message, 'success');
                router.refresh();
            } else {
                showToast(result.error, 'error');
            }
        });
    };

    const active = request.status === 'requested' || request.status === 'approved';
    const needsPhotographer = active && !request.assigned_photographer_id;
    const statusBadge = getStatusBadgeProps(request.status);

    return (
        <Card withBorder padding="lg" radius="lg">
            <Stack gap="sm">
                <Group gap="xs" wrap="wrap">
                    <Text size="sm" fw={700}>{request.event_name}</Text>
                    <Badge color={statusBadge.color} variant={statusBadge.variant}>
                        {STATUS_LABEL[request.status]}
                    </Badge>
                    {request.overlap && (
                        <Tooltip label={`Overlapt met:\n${request.overlaps_with.join('\n')}`} multiline>
                            <Badge color="error" variant="light" leftSection={<AlertTriangle size={12} />}>
                                Overlap
                            </Badge>
                        </Tooltip>
                    )}
                </Group>

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={4}>
                    <Text size="xs" fw={700}>{formatPeriod(request)}</Text>
                    <Text size="xs" c="dimmed">
                        Aanvrager: {request.requester_name}
                        {request.requester_email && ` (${request.requester_email})`}
                    </Text>
                </SimpleGrid>

                <RequesterEditor request={request} showToast={showToast} />

                {request.proposed_photographer_name && (
                    <Text size="xs" c="dimmed">Gewenste fotograaf: {request.proposed_photographer_name}</Text>
                )}
                {request.note && (
                    <Text size="xs" c="dimmed">Opmerking aanvrager: {request.note}</Text>
                )}

                {needsPhotographer && (
                    <Group gap={6}>
                        <Text span c="error" lh={1}><AlertTriangle size={14} /></Text>
                        <Text size="xs" fw={700} c="error">Fotograaf nog regelen</Text>
                    </Group>
                )}

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                    <NativeSelect
                        label="Toegewezen fotograaf"
                        value={photographerId}
                        onChange={(e) => setPhotographerId(e.currentTarget.value)}
                        disabled={isPending}
                        data={[
                            { value: '', label: 'Nog niemand' },
                            ...photographers.map((p) => ({ value: p.id, label: p.name })),
                        ]}
                    />
                    <TextInput
                        label="Opmerking beheer"
                        value={noteAdmin}
                        maxLength={500}
                        onChange={(e) => setNoteAdmin(e.currentTarget.value)}
                        disabled={isPending}
                    />
                </SimpleGrid>

                {request.status === 'approved' && (
                    <NativeSelect
                        label="Foto's verwerken"
                        value={photoStatus}
                        onChange={(e) => setPhotoStatus(e.currentTarget.value as CameraPhotoStatus)}
                        disabled={isPending}
                        maw={{ sm: 320 }}
                        data={CAMERA_PHOTO_STATUSES.map((st) => ({
                            value: st,
                            label: PHOTO_STATUS_LABEL_MAP.get(st) ?? st,
                        }))}
                    />
                )}

                <Group gap="xs" wrap="wrap" pt={4}>
                    {request.status !== 'approved' && (
                        <Button
                            type="button"
                            color="success"
                            size="xs"
                            loading={isPending}
                            onClick={() => save('approved', 'Aanvraag goedgekeurd')}
                            leftSection={<Check size={14} />}
                        >
                            Goedkeuren
                        </Button>
                    )}
                    {request.status === 'approved' && (
                        <Button
                            type="button"
                            color="brand"
                            size="xs"
                            loading={isPending}
                            onClick={() => save('approved', 'Opgeslagen')}
                            leftSection={<UserCheck size={14} />}
                        >
                            Opslaan
                        </Button>
                    )}
                    {request.status !== 'rejected' && (
                        <Button
                            type="button"
                            color="error"
                            variant="outline"
                            size="xs"
                            loading={isPending}
                            onClick={() => save('rejected', 'Aanvraag afgewezen')}
                            leftSection={<X size={14} />}
                        >
                            Afwijzen
                        </Button>
                    )}
                    {request.status === 'approved' && (
                        <Button
                            type="button"
                            variant="default"
                            size="xs"
                            loading={isPending}
                            onClick={() => save('cancelled', 'Aanvraag geannuleerd')}
                        >
                            Annuleren
                        </Button>
                    )}
                    {request.status === 'approved' && !loan && <HandoutForm request={request} showToast={showToast} />}
                    {loan && (
                        <Badge color={loan.returned_on ? 'success' : 'accent'} variant="light">
                            {loan.returned_on ? 'Teruggebracht' : 'Meegegeven'}
                        </Badge>
                    )}
                    {(request.status === 'rejected' || request.status === 'cancelled') && (
                        <Button
                            type="button"
                            variant="default"
                            size="xs"
                            loading={isPending}
                            onClick={() => save('requested', 'Teruggezet naar aangevraagd')}
                        >
                            Terugzetten
                        </Button>
                    )}
                </Group>
            </Stack>
        </Card>
    );
}

function PhotographerRow({
    photographer: p,
    showToast,
    onRemove,
    disabled,
}: {
    photographer: CameraAdminPhotographer;
    showToast: Toast;
    onRemove: (p: CameraAdminPhotographer) => void;
    disabled: boolean;
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [editing, setEditing] = useState(false);
    const [admittedOn, setAdmittedOn] = useState(p.admitted_on);
    const [route, setRoute] = useState(p.route ?? '');
    const [experienced, setExperienced] = useState(p.experienced);
    const [note, setNote] = useState(p.note ?? '');

    const save = () => {
        startTransition(async () => {
            const result = await updateCameraPhotographerAction({
                id: p.id,
                admitted_on: admittedOn,
                route,
                experienced,
                note,
            });
            if (result.success) {
                showToast(`${p.name} bijgewerkt`, 'success');
                setEditing(false);
                router.refresh();
            } else {
                showToast(result.error, 'error');
            }
        });
    };

    const cancel = () => {
        setAdmittedOn(p.admitted_on);
        setRoute(p.route ?? '');
        setExperienced(p.experienced);
        setNote(p.note ?? '');
        setEditing(false);
    };

    if (editing) {
        return (
            <Card
                withBorder
                padding="md"
                radius="lg"
                style={{ gridColumn: '1 / -1', borderColor: 'var(--mantine-color-brand-filled)' }}
            >
                <Stack gap="sm">
                    <Text size="sm" fw={700}>{p.name}</Text>
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                        <DateInput
                            label="Toegelaten op"
                            value={admittedOn || null}
                            onChange={(val) => setAdmittedOn(val ?? '')}
                            valueFormat="DD-MM-YYYY"
                        />
                        <TextInput
                            label="Route"
                            value={route}
                            maxLength={100}
                            onChange={(e) => setRoute(e.currentTarget.value)}
                        />
                        <TextInput
                            label="Opmerking"
                            value={note}
                            maxLength={300}
                            onChange={(e) => setNote(e.currentTarget.value)}
                            style={{ gridColumn: '1 / -1' }}
                        />
                    </SimpleGrid>
                    <Checkbox
                        label="Ervaren fotograaf"
                        checked={experienced}
                        onChange={(e) => setExperienced(e.currentTarget.checked)}
                    />
                    <Group gap="xs">
                        <Button
                            type="button"
                            size="xs"
                            onClick={save}
                            loading={isPending}
                            disabled={!admittedOn}
                            leftSection={<Check size={14} />}
                        >
                            Opslaan
                        </Button>
                        <Button
                            type="button"
                            size="xs"
                            variant="default"
                            onClick={cancel}
                        >
                            Annuleren
                        </Button>
                    </Group>
                </Stack>
            </Card>
        );
    }

    return (
        <Card withBorder padding="md" radius="lg">
            <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
                <Stack gap={2} style={{ minWidth: 0 }}>
                    <Group gap="xs" wrap="wrap">
                        <Text size="sm" fw={700} truncate>{p.name}</Text>
                        {p.experienced && (
                            <Badge color="brand" variant="light" size="xs">
                                Ervaren
                            </Badge>
                        )}
                    </Group>
                    <Text size="xs" c="dimmed">
                        Toegelaten op {formatDate(p.admitted_on, 'd MMM yyyy')}
                        {p.route && ` · ${p.route}`}
                    </Text>
                    {p.note && <Text size="xs" c="dimmed">{p.note}</Text>}
                </Stack>
                <Group gap={4} wrap="nowrap">
                    <ActionIcon
                        type="button"
                        variant="subtle"
                        onClick={() => setEditing(true)}
                        aria-label={`${p.name} bewerken`}
                    >
                        <Pencil size={16} />
                    </ActionIcon>
                    <ActionIcon
                        type="button"
                        variant="subtle"
                        color="error"
                        onClick={() => onRemove(p)}
                        disabled={disabled}
                        aria-label={`${p.name} verwijderen`}
                    >
                        <Trash2 size={16} />
                    </ActionIcon>
                </Group>
            </Group>
        </Card>
    );
}

function PhotographersPanel({
    photographers,
    showToast,
}: {
    photographers: CameraAdminPhotographer[];
    showToast: Toast;
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<CameraMemberOption[]>([]);
    const [member, setMember] = useState<CameraMemberOption | null>(null);
    const [route, setRoute] = useState('');
    const [experienced, setExperienced] = useState(false);

    const search = (value: string) => {
        setQuery(value);
        setMember(null);
        if (value.trim().length < 2) {
            setResults([]);
            return;
        }
        void searchCameraMembersAction(value).then(setResults);
    };

    const add = () => {
        if (!member) return;
        startTransition(async () => {
            const result = await addCameraPhotographerAction({
                user_id: member.id,
                route,
                experienced,
                note: '',
            });
            if (result.success) {
                showToast(`${member.name} is toegelaten als fotograaf`, 'success');
                setQuery('');
                setResults([]);
                setMember(null);
                setRoute('');
                setExperienced(false);
                router.refresh();
            } else {
                showToast(result.error, 'error');
            }
        });
    };

    const remove = (p: CameraAdminPhotographer) => {
        startTransition(async () => {
            const result = await removeCameraPhotographerAction(p.id);
            if (result.success) {
                showToast(`${p.name} is verwijderd`, 'success');
                router.refresh();
            } else {
                showToast(result.error, 'error');
            }
        });
    };

    return (
        <Stack gap="lg">
            <Card withBorder padding="lg" radius="lg">
                <Stack gap="md">
                    <Title order={3} size="h5">Fotograaf toelaten</Title>
                    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
                        <TextInput
                            label="Zoek een actief lid"
                            value={member ? member.name : query}
                            onChange={(e) => search(e.currentTarget.value)}
                            placeholder="Voor- of achternaam"
                            style={{ gridColumn: '1 / -1' }}
                        />
                        {!member && results.length > 0 && (
                            <Stack gap={4} style={{ gridColumn: '1 / -1' }}>
                                {results.map((r) => (
                                    <Button
                                        key={r.id}
                                        type="button"
                                        variant="default"
                                        size="xs"
                                        justify="flex-start"
                                        fullWidth
                                        onClick={() => setMember(r)}
                                    >
                                        {r.name}
                                    </Button>
                                ))}
                            </Stack>
                        )}
                        <TextInput
                            label="Route (optioneel)"
                            value={route}
                            maxLength={100}
                            onChange={(e) => setRoute(e.currentTarget.value)}
                            style={{ gridColumn: 'span 2' }}
                        />
                        <Checkbox
                            label="Ervaren fotograaf"
                            checked={experienced}
                            onChange={(e) => setExperienced(e.currentTarget.checked)}
                            style={{ alignSelf: 'end', paddingBottom: 8 }}
                        />
                    </SimpleGrid>
                    <Group>
                        <Button
                            type="button"
                            size="xs"
                            onClick={add}
                            disabled={!member || isPending}
                            loading={isPending}
                            leftSection={<Plus size={14} />}
                        >
                            Toelaten
                        </Button>
                    </Group>
                </Stack>
            </Card>

            {photographers.length === 0 ? (
                <Text py="xl" ta="center" size="sm" fw={700} c="dimmed">
                    Er zijn nog geen fotografen toegelaten.
                </Text>
            ) : (
                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                    {photographers.map((p) => (
                        <PhotographerRow key={p.id} photographer={p} showToast={showToast} onRemove={remove} disabled={isPending} />
                    ))}
                </SimpleGrid>
            )}
        </Stack>
    );
}

export default function BeheerCameraIsland({ requests, photographers, loans }: Props) {
    const { showToast } = useAdminToast();
    const [tab, setTab] = useState<Tab>('pending');

    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Amsterdam' });

    const loanByRequest = useMemo(() => new Map(loans.map((l) => [l.request_id, l])), [loans]);
    const openLoan = loans.find((l) => l.returned_on === null);

    const groups = useMemo(() => {
        const pending = requests.filter((r) => r.status === 'requested').sort((a, b) => a.start_date.localeCompare(b.start_date));
        const upcoming = requests
            .filter((r) => r.status === 'approved' && r.end_date >= today)
            .sort((a, b) => a.start_date.localeCompare(b.start_date));
        const archive = requests.filter(
            (r) => r.status === 'rejected' || r.status === 'cancelled' || (r.status === 'approved' && r.end_date < today),
        );
        return { pending, upcoming, archive };
    }, [requests, today]);

    const list = tab === 'pending' ? groups.pending : tab === 'upcoming' ? groups.upcoming : groups.archive;
    const empty =
        tab === 'pending'
            ? 'Geen aanvragen die op beoordeling wachten.'
            : tab === 'upcoming'
              ? 'Geen aankomende goedgekeurde aanvragen.'
              : 'Het archief is leeg.';

    return (
        <Stack gap="lg">
            <Alert
                color={openLoan ? (openLoan.days_late > 0 ? 'error' : 'brand') : 'success'}
                variant="light"
                icon={<Camera size={16} />}
            >
                <Text size="xs" fw={700}>
                    {openLoan
                        ? `Camera nu uitgeleend aan ${openLoan.borrower_name} (${openLoan.event_name}), afgesproken tot ${formatDate(openLoan.agreed_end_date, 'd MMM yyyy')}${openLoan.days_late > 0 ? ` – ${openLoan.days_late} ${openLoan.days_late === 1 ? 'dag' : 'dagen'} te laat` : ''}`
                        : 'Camera is nu beschikbaar'}
                </Text>
            </Alert>

            <Tabs
                value={tab}
                onChange={(val) => {
                    if (val) setTab(val as Tab);
                }}
                variant="pills"
            >
                <Tabs.List>
                    <Tabs.Tab value="pending" leftSection={<CalendarClock size={14} />}>
                        Te beoordelen ({groups.pending.length})
                    </Tabs.Tab>
                    <Tabs.Tab value="upcoming" leftSection={<Camera size={14} />}>
                        Goedgekeurd ({groups.upcoming.length})
                    </Tabs.Tab>
                    <Tabs.Tab value="calendar" leftSection={<CalendarDays size={14} />}>
                        Kalender
                    </Tabs.Tab>
                    <Tabs.Tab value="loans" leftSection={<ClipboardList size={14} />}>
                        Uitleenlog
                    </Tabs.Tab>
                    <Tabs.Tab value="archive">
                        Archief
                    </Tabs.Tab>
                    <Tabs.Tab value="photographers" leftSection={<UserCheck size={14} />}>
                        Fotografen ({photographers.length})
                    </Tabs.Tab>
                </Tabs.List>
            </Tabs>

            {tab === 'photographers' ? (
                <PhotographersPanel photographers={photographers} showToast={showToast} />
            ) : tab === 'calendar' ? (
                <CameraCalendar requests={requests} loans={loans} today={today} />
            ) : tab === 'loans' ? (
                <CameraLoansPanel loans={loans} today={today} showToast={showToast} />
            ) : list.length === 0 ? (
                <Text py="xl" ta="center" size="sm" fw={700} c="dimmed">{empty}</Text>
            ) : (
                <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
                    {list.map((r) => (
                        <RequestCard
                            key={`${r.id}-${r.status}-${r.assigned_photographer_id ?? ''}`}
                            request={r}
                            photographers={photographers}
                            loan={loanByRequest.get(r.id)}
                            showToast={showToast}
                        />
                    ))}
                </SimpleGrid>
            )}
        </Stack>
    );
}
