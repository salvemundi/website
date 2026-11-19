'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Camera, CalendarDays, Check, CalendarClock, ClipboardList, HandHelping, Pencil, Plus, Trash2, UserCheck, X } from 'lucide-react';
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
import BeheerToast from '@/components/ui/beheer/BeheerToast';
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
import { badgeBase, STATUS_CLASS, STATUS_LABEL } from '@/components/islands/camera/camera-utils';

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

const tabClass = (active: boolean) =>
    `flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors md:flex-none ${
        active
            ? 'border border-border-color bg-bg-card text-purple-700 shadow-xs dark:text-purple-300'
            : 'text-text-muted hover:text-text-main'
    }`;

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
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="beheer-button bg-transparent inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-purple-300 px-4 py-2 text-xs font-bold text-purple-700 transition-all hover:bg-purple-50 dark:text-purple-300 dark:hover:bg-purple-500/10"
            >
                <HandHelping className="size-3.5" /> Meegeven
            </button>
        );
    }

    return (
        <div className="w-full space-y-3 rounded-xl border border-border-color bg-bg-soft p-4">
            <p className="text-xs font-bold text-text-main">Controleer samen met de lener of alles compleet is:</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
                {CAMERA_CHECKLIST_ITEMS.map((item) => (
                    <label key={item.key} className="flex items-center gap-2 text-xs font-semibold text-text-main">
                        <input
                            type="checkbox"
                            checked={checklist[item.key]}
                            onChange={(e) => setChecklist((c) => ({ ...c, [item.key]: e.target.checked }))}
                        />
                        {item.label}
                    </label>
                ))}
            </div>
            <input
                className="form-input"
                value={note}
                maxLength={500}
                placeholder="Opmerking bij meegeven (optioneel)"
                onChange={(e) => setNote(e.target.value)}
            />
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={submit}
                    disabled={isPending}
                    className="beheer-button inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-purple-700 disabled:opacity-50"
                >
                    <HandHelping className="size-3.5" /> Bevestig meegeven
                </button>
                <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="beheer-button bg-transparent cursor-pointer rounded-xl border border-border-color px-4 py-2 text-xs font-bold text-text-muted hover:bg-bg-card"
                >
                    Annuleren
                </button>
            </div>
        </div>
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
            <button
                type="button"
                onClick={() => setEditing(true)}
                className="beheer-button bg-transparent shadow-none inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-purple-700 hover:underline dark:text-purple-300"
            >
                <Pencil className="size-3" /> Aanvrager wijzigen
            </button>
        );
    }

    return (
        <div className="w-full space-y-2 rounded-xl border border-border-color bg-bg-soft p-3">
            <input
                className="form-input"
                value={query}
                onChange={(e) => search(e.target.value)}
                placeholder="Zoek een actief lid op voor- of achternaam"
                disabled={isPending}
            />
            {results.length > 0 && (
                <ul className="space-y-1">
                    {results.map((r) => (
                        <li key={r.id}>
                            <button
                                type="button"
                                onClick={() => choose(r)}
                                disabled={isPending}
                                className="beheer-button w-full cursor-pointer rounded-lg border border-border-color bg-bg-card px-3 py-2 text-left text-xs font-semibold text-text-main hover:bg-bg-soft disabled:opacity-50"
                            >
                                {r.name}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            <button
                type="button"
                onClick={() => {
                    setEditing(false);
                    setQuery('');
                    setResults([]);
                }}
                className="beheer-button bg-transparent shadow-none cursor-pointer text-xs font-bold text-text-muted hover:underline"
            >
                Annuleren
            </button>
        </div>
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

    return (
        <li className="space-y-3 rounded-2xl border border-border-color bg-bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-text-main">{request.event_name}</span>
                <span className={`${badgeBase} ${STATUS_CLASS[request.status]}`}>{STATUS_LABEL[request.status]}</span>
                {request.overlap && (
                    <span
                        title={`Overlapt met:\n${request.overlaps_with.join('\n')}`}
                        className="inline-flex cursor-help items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-[9px] font-black tracking-widest text-red-700 uppercase dark:bg-red-500/10 dark:text-red-300">
                        <AlertTriangle className="size-3" /> Overlap
                    </span>
                )}
            </div>

            <div className="grid gap-1 text-xs text-text-muted sm:grid-cols-2">
                <p className="font-bold text-text-main">{formatPeriod(request)}</p>
                <p>
                    Aanvrager: {request.requester_name}
                    {request.requester_email && ` (${request.requester_email})`}
                </p>
                <div className="sm:col-span-2">
                    <RequesterEditor request={request} showToast={showToast} />
                </div>
                {request.proposed_photographer_name && <p>Gewenste fotograaf: {request.proposed_photographer_name}</p>}
                {request.note && <p className="sm:col-span-2">Opmerking aanvrager: {request.note}</p>}
            </div>

            {needsPhotographer && (
                <p className="flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-300">
                    <AlertTriangle className="size-3.5" /> Fotograaf nog regelen
                </p>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs font-semibold text-text-muted">
                    Toegewezen fotograaf
                    <select
                        className="beheer-select"
                        value={photographerId}
                        onChange={(e) => setPhotographerId(e.target.value)}
                        disabled={isPending}
                        suppressHydrationWarning
                    >
                        <option value="">Nog niemand</option>
                        {photographers.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="flex flex-col gap-1 text-xs font-semibold text-text-muted">
                    Opmerking beheer
                    <input
                        className="form-input"
                        value={noteAdmin}
                        maxLength={500}
                        onChange={(e) => setNoteAdmin(e.target.value)}
                        disabled={isPending}
                    />
                </label>
            </div>

            {request.status === 'approved' && (
                <label className="flex flex-col gap-1 text-xs font-semibold text-text-muted sm:max-w-xs">
                    Foto&apos;s verwerken
                    <select
                        className="beheer-select"
                        value={photoStatus}
                        onChange={(e) => setPhotoStatus(e.target.value as CameraPhotoStatus)}
                        disabled={isPending}
                        suppressHydrationWarning
                    >
                        {CAMERA_PHOTO_STATUSES.map((st) => (
                            <option key={st} value={st}>
                                {CAMERA_PHOTO_STATUS_LABEL[st]}
                            </option>
                        ))}
                    </select>
                </label>
            )}

            <div className="flex flex-wrap gap-2">
                {request.status !== 'approved' && (
                    <button
                        type="button"
                        disabled={isPending}
                        onClick={() => save('approved', 'Aanvraag goedgekeurd')}
                        className="beheer-button inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-green-700 disabled:opacity-50"
                    >
                        <Check className="size-3.5" /> Goedkeuren
                    </button>
                )}
                {request.status === 'approved' && (
                    <button
                        type="button"
                        disabled={isPending}
                        onClick={() => save('approved', 'Opgeslagen')}
                        className="beheer-button inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-purple-700 disabled:opacity-50"
                    >
                        <UserCheck className="size-3.5" /> Opslaan
                    </button>
                )}
                {request.status !== 'rejected' && (
                    <button
                        type="button"
                        disabled={isPending}
                        onClick={() => save('rejected', 'Aanvraag afgewezen')}
                        className="beheer-button bg-transparent inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-red-300 px-4 py-2 text-xs font-bold text-red-600 transition-all hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-500/10"
                    >
                        <X className="size-3.5" /> Afwijzen
                    </button>
                )}
                {request.status === 'approved' && (
                    <button
                        type="button"
                        disabled={isPending}
                        onClick={() => save('cancelled', 'Aanvraag geannuleerd')}
                        className="beheer-button bg-transparent inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-border-color px-4 py-2 text-xs font-bold text-text-muted transition-all hover:bg-bg-soft disabled:opacity-50"
                    >
                        Annuleren
                    </button>
                )}
                {request.status === 'approved' && !loan && <HandoutForm request={request} showToast={showToast} />}
                {loan && (
                    <span className={`${badgeBase} ${loan.returned_on ? STATUS_CLASS.approved : STATUS_CLASS.requested}`}>
                        {loan.returned_on ? 'Teruggebracht' : 'Meegegeven'}
                    </span>
                )}
                {(request.status === 'rejected' || request.status === 'cancelled') && (
                    <button
                        type="button"
                        disabled={isPending}
                        onClick={() => save('requested', 'Teruggezet naar aangevraagd')}
                        className="beheer-button bg-transparent inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-border-color px-4 py-2 text-xs font-bold text-text-muted transition-all hover:bg-bg-soft disabled:opacity-50"
                    >
                        Terugzetten
                    </button>
                )}
            </div>
        </li>
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
            <li className="space-y-3 rounded-2xl border border-purple-300 bg-bg-card p-4 shadow-sm md:col-span-2">
                <p className="text-sm font-bold text-text-main">{p.name}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1 text-xs font-semibold text-text-muted">
                        Toegelaten op
                        <input type="date" className="form-input" value={admittedOn} onChange={(e) => setAdmittedOn(e.target.value)} />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-semibold text-text-muted">
                        Route
                        <input className="form-input" value={route} maxLength={100} onChange={(e) => setRoute(e.target.value)} />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-semibold text-text-muted sm:col-span-2">
                        Opmerking
                        <input className="form-input" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} />
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-text-main">
                        <input type="checkbox" checked={experienced} onChange={(e) => setExperienced(e.target.checked)} />
                        Ervaren fotograaf
                    </label>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={save}
                        disabled={isPending || !admittedOn}
                        className="beheer-button inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-purple-700 disabled:opacity-50"
                    >
                        <Check className="size-3.5" /> Opslaan
                    </button>
                    <button
                        type="button"
                        onClick={cancel}
                        className="beheer-button bg-transparent cursor-pointer rounded-xl border border-border-color px-4 py-2 text-xs font-bold text-text-muted hover:bg-bg-soft"
                    >
                        Annuleren
                    </button>
                </div>
            </li>
        );
    }

    return (
        <li className="flex items-center justify-between gap-3 rounded-2xl border border-border-color bg-bg-card p-4 shadow-sm">
            <div className="min-w-0">
                <p className="truncate text-sm font-bold text-text-main">
                    {p.name}
                    {p.experienced && (
                        <span className="ml-2 rounded-full bg-purple-100 px-2 py-0.5 text-[9px] font-black tracking-widest text-purple-700 uppercase dark:bg-purple-500/10 dark:text-purple-300">
                            Ervaren
                        </span>
                    )}
                </p>
                <p className="text-xs text-text-muted">
                    Toegelaten op {formatDate(p.admitted_on, 'd MMM yyyy')}
                    {p.route && ` · ${p.route}`}
                </p>
                {p.note && <p className="text-xs text-text-muted">{p.note}</p>}
            </div>
            <div className="flex shrink-0 items-center gap-1">
                <button
                    type="button"
                    onClick={() => setEditing(true)}
                    aria-label={`${p.name} bewerken`}
                    className="icon-button cursor-pointer rounded-lg p-2 text-text-muted hover:bg-bg-soft"
                >
                    <Pencil className="size-4" />
                </button>
                <button
                    type="button"
                    onClick={() => onRemove(p)}
                    disabled={disabled}
                    aria-label={`${p.name} verwijderen`}
                    className="icon-button cursor-pointer rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-500/10"
                >
                    <Trash2 className="size-4" />
                </button>
            </div>
        </li>
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
        <div className="space-y-6">
            <div className="space-y-3 rounded-2xl border border-border-color bg-bg-card p-5 shadow-sm">
                <h3 className="text-sm font-bold text-text-main">Fotograaf toelaten</h3>
                <div className="grid gap-3 sm:grid-cols-3">
                    <label className="flex flex-col gap-1 text-xs font-semibold text-text-muted sm:col-span-3">
                        Zoek een actief lid
                        <input
                            className="form-input"
                            value={member ? member.name : query}
                            onChange={(e) => search(e.target.value)}
                            placeholder="Voor- of achternaam"
                        />
                    </label>
                    {!member && results.length > 0 && (
                        <ul className="space-y-1 sm:col-span-3">
                            {results.map((r) => (
                                <li key={r.id}>
                                    <button
                                        type="button"
                                        onClick={() => setMember(r)}
                                        className="beheer-button bg-transparent w-full cursor-pointer rounded-lg border border-border-color px-3 py-2 text-left text-xs font-semibold text-text-main hover:bg-bg-soft"
                                    >
                                        {r.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                    <label className="flex flex-col gap-1 text-xs font-semibold text-text-muted sm:col-span-2">
                        Route (optioneel)
                        <input className="form-input" value={route} maxLength={100} onChange={(e) => setRoute(e.target.value)} />
                    </label>
                    <label className="flex items-center gap-2 self-end pb-2 text-xs font-semibold text-text-main">
                        <input type="checkbox" checked={experienced} onChange={(e) => setExperienced(e.target.checked)} />
                        Ervaren fotograaf
                    </label>
                </div>
                <button
                    type="button"
                    onClick={add}
                    disabled={!member || isPending}
                    className="beheer-button inline-flex cursor-pointer items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-purple-700 disabled:opacity-50"
                >
                    <Plus className="size-3.5" /> Toelaten
                </button>
            </div>

            {photographers.length === 0 ? (
                <p className="py-8 text-center text-sm font-bold text-text-muted">Er zijn nog geen fotografen toegelaten.</p>
            ) : (
                <ul className="grid gap-3 md:grid-cols-2">
                    {photographers.map((p) => (
                        <PhotographerRow key={p.id} photographer={p} showToast={showToast} onRemove={remove} disabled={isPending} />
                    ))}
                </ul>
            )}
        </div>
    );
}

export default function BeheerCameraIsland({ requests, photographers, loans }: Props) {
    const { toast, showToast, hideToast } = useAdminToast();
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
        <div className="space-y-6">
            <div
                className={`flex flex-wrap items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold ${
                    openLoan
                        ? openLoan.days_late > 0
                            ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300'
                            : 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300'
                        : 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300'
                }`}
            >
                <Camera className="size-4" />
                {openLoan
                    ? `Camera nu uitgeleend aan ${openLoan.borrower_name} (${openLoan.event_name}), afgesproken tot ${formatDate(openLoan.agreed_end_date, 'd MMM yyyy')}${openLoan.days_late > 0 ? ` – ${openLoan.days_late} ${openLoan.days_late === 1 ? 'dag' : 'dagen'} te laat` : ''}`
                    : 'Camera is nu beschikbaar'}
            </div>

            <div className="flex w-full flex-wrap items-center gap-1.5 rounded-xl border border-border-color/60 bg-bg-soft p-1 md:w-fit">
                <button type="button" onClick={() => setTab('pending')} className={`tab-button ${tabClass(tab === 'pending')}`}>
                    <CalendarClock className="size-3.5" />
                    Te beoordelen ({groups.pending.length})
                </button>
                <button type="button" onClick={() => setTab('upcoming')} className={`tab-button ${tabClass(tab === 'upcoming')}`}>
                    <Camera className="size-3.5" />
                    Goedgekeurd ({groups.upcoming.length})
                </button>
                <button type="button" onClick={() => setTab('calendar')} className={`tab-button ${tabClass(tab === 'calendar')}`}>
                    <CalendarDays className="size-3.5" />
                    Kalender
                </button>
                <button type="button" onClick={() => setTab('loans')} className={`tab-button ${tabClass(tab === 'loans')}`}>
                    <ClipboardList className="size-3.5" />
                    Uitleenlog
                </button>
                <button type="button" onClick={() => setTab('archive')} className={`tab-button ${tabClass(tab === 'archive')}`}>
                    Archief
                </button>
                <button type="button" onClick={() => setTab('photographers')} className={`tab-button ${tabClass(tab === 'photographers')}`}>
                    <UserCheck className="size-3.5" />
                    Fotografen ({photographers.length})
                </button>
            </div>

            {tab === 'photographers' ? (
                <PhotographersPanel photographers={photographers} showToast={showToast} />
            ) : tab === 'calendar' ? (
                <CameraCalendar requests={requests} loans={loans} today={today} />
            ) : tab === 'loans' ? (
                <CameraLoansPanel loans={loans} today={today} showToast={showToast} />
            ) : list.length === 0 ? (
                <p className="py-12 text-center text-sm font-bold text-text-muted">{empty}</p>
            ) : (
                <ul className="grid gap-4 lg:grid-cols-2">
                    {list.map((r) => (
                        <RequestCard
                            key={`${r.id}-${r.status}-${r.assigned_photographer_id ?? ''}`}
                            request={r}
                            photographers={photographers}
                            loan={loanByRequest.get(r.id)}
                            showToast={showToast}
                        />
                    ))}
                </ul>
            )}
            <BeheerToast toast={toast} onClose={hideToast} />
        </div>
    );
}
