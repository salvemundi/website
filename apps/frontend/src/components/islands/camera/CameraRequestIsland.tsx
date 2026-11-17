'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Camera, CalendarClock, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import {
    createCameraRequestSchema,
    type CameraEventOption,
    type CameraPhotographerOption,
    type CameraRequestSummary,
    type CreateCameraRequestInput,
} from '@salvemundi/validations';
import { Tile } from '@/components/islands/account/profile/ProfielUI';
import { FormField } from '@/shared/ui/FormField';
import { Input } from '@/shared/ui/Input';
import BeheerToast from '@/components/ui/beheer/BeheerToast';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import { formatDate } from '@/shared/lib/utils/date';
import {
    cancelCameraRequest,
    createCameraRequest,
    getCameraAvailability,
    type CameraAvailability,
} from '@/server/actions/public/camera.actions';
import { badgeBase, STATUS_CLASS, STATUS_LABEL } from './camera-utils';

interface Props {
    events: CameraEventOption[];
    photographers: CameraPhotographerOption[];
    mine: CameraRequestSummary[];
}

type FormInput = z.input<typeof createCameraRequestSchema>;

const OTHER = 'other';

function formatPeriod(r: { start_date: string; start_time: string | null; end_date: string; end_time: string | null }) {
    const from = `${formatDate(r.start_date, 'd MMM yyyy')}${r.start_time ? ` ${r.start_time}` : ''}`;
    const to = `${formatDate(r.end_date, 'd MMM yyyy')}${r.end_time ? ` ${r.end_time}` : ''}`;
    return r.start_date === r.end_date && !r.start_time && !r.end_time ? from : `${from} – ${to}`;
}

export function CameraRequestIsland({ events, photographers, mine }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const { toast, showToast, hideToast } = useAdminToast();
    const [selected, setSelected] = useState<string>(events.length > 0 ? '' : OTHER);
    const [availability, setAvailability] = useState<CameraAvailability | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
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

    return (
        <div className="space-y-8">
            <Tile title="Camera aanvragen" icon={<Camera className="size-6" />}>
                <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="grid grid-cols-1 gap-4 md:grid-cols-2" noValidate>
                    <FormField label="Activiteit" className="md:col-span-2">
                        <select
                            className="form-input"
                            value={selected}
                            onChange={(e) => onSelectEvent(e.target.value)}
                            suppressHydrationWarning
                        >
                            {events.length > 0 && <option value="">Kies een activiteit van de website…</option>}
                            {events.map((ev) => (
                                <option key={ev.id} value={ev.id}>
                                    {ev.name} ({formatDate(ev.start_date, 'd MMM yyyy')})
                                </option>
                            ))}
                            <option value={OTHER}>Anders / activiteit staat nog niet op de website</option>
                        </select>
                    </FormField>

                    <FormField label="Naam activiteit" required error={errors.event_name?.message} className="md:col-span-2">
                        <Input {...register('event_name')} maxLength={255} placeholder="Bijv. Kamp, Kroegentocht, Sintercantus" />
                    </FormField>

                    <FormField label="Startdatum" required error={errors.start_date?.message}>
                        <Input type="date" {...register('start_date')} />
                    </FormField>
                    <FormField label="Starttijd (optioneel)" error={errors.start_time?.message}>
                        <Input type="time" {...register('start_time')} />
                    </FormField>
                    <FormField label="Einddatum" required error={errors.end_date?.message}>
                        <Input type="date" {...register('end_date')} />
                    </FormField>
                    <FormField label="Eindtijd (optioneel)" error={errors.end_time?.message}>
                        <Input type="time" {...register('end_time')} />
                    </FormField>

                    {availability && (
                        <div className="md:col-span-2" role="status">
                            {blocked ? (
                                <p className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700 dark:bg-red-500/10 dark:text-red-300">
                                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                                    De camera is in deze periode al gereserveerd
                                    {availability.approved.length > 0 &&
                                        ` (${availability.approved.map((a) => a.event_name).join(', ')})`}
                                    . Kies een andere periode.
                                </p>
                            ) : availability.requested > 0 ? (
                                <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                                    Voor deze periode is al een andere aanvraag ingediend die nog niet is beoordeeld. Je kunt wel aanvragen.
                                </p>
                            ) : (
                                <p className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-xs font-bold text-green-700 dark:bg-green-500/10 dark:text-green-300">
                                    <CheckCircle2 className="size-4 shrink-0" />
                                    De camera is in deze periode beschikbaar.
                                </p>
                            )}
                        </div>
                    )}

                    {photographers.length > 0 && (
                        <FormField label="Gewenste fotograaf (optioneel)" error={errors.proposed_photographer_id?.message} className="md:col-span-2">
                            <select {...register('proposed_photographer_id')} className="form-input" suppressHydrationWarning>
                                <option value="">Geen voorkeur</option>
                                {photographers.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </FormField>
                    )}

                    <FormField label="Opmerking (optioneel)" error={errors.note?.message} className="md:col-span-2">
                        <textarea {...register('note')} rows={3} maxLength={500} className="form-input" />
                    </FormField>

                    <div className="md:col-span-2">
                        <button type="submit" disabled={isPending || blocked} className="form-button w-full sm:w-auto">
                            <Camera className="size-4" />
                            {isPending ? 'Versturen...' : 'Aanvraag versturen'}
                        </button>
                    </div>
                </form>
            </Tile>

            <Tile title="Mijn aanvragen" icon={<CalendarClock className="size-6" />}>
                {mine.length === 0 ? (
                    <div className="squircle-lg border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center shadow-inner dark:border-white/10 dark:bg-black/10">
                        <p className="text-sm font-bold text-(--text-muted)">Je hebt nog geen aanvragen gedaan.</p>
                    </div>
                ) : (
                    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {mine.map((r) => (
                            <li
                                key={r.id}
                                className="squircle space-y-2 border border-licht-paars/20 bg-licht-paars/10 p-5 shadow-sm dark:border-white/10 dark:bg-white/5"
                            >
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="truncate text-sm font-black text-purple-700 dark:text-white">{r.event_name}</span>
                                    <span className={`${badgeBase} ${STATUS_CLASS[r.status]}`}>{STATUS_LABEL[r.status]}</span>
                                </div>
                                <p className="text-xs font-bold text-(--text-main)">{formatPeriod(r)}</p>
                                {(r.assigned_photographer_name ?? r.proposed_photographer_name) && (
                                    <p className="text-xs text-(--text-muted)">
                                        Fotograaf: {r.assigned_photographer_name ?? `${r.proposed_photographer_name} (voorstel)`}
                                    </p>
                                )}
                                {r.note_admin && <p className="text-xs text-(--text-muted)">Beheer: {r.note_admin}</p>}
                                {(r.status === 'requested' || r.status === 'approved') && (
                                    <button
                                        type="button"
                                        onClick={() => onCancel(r.id)}
                                        disabled={isPending}
                                        className="btn-cancel-camera inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:underline disabled:opacity-50 dark:text-red-300"
                                    >
                                        <X className="size-3.5" />
                                        Annuleren
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </Tile>
            <BeheerToast toast={toast} onClose={hideToast} />
        </div>
    );
}
