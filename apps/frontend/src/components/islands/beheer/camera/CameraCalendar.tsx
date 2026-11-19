'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CameraAdminLoan, CameraAdminRequest } from '@salvemundi/validations';
import { formatDate } from '@/shared/lib/utils/date';

type EntryKind = 'out' | 'reserved' | 'requested';

interface Entry {
    key: string;
    kind: EntryKind;
    label: string;
    who: string;
    start: string;
    end: string;
    times: string | null;
}

const KIND_LABEL: Record<EntryKind, string> = {
    out: 'Uitgeleend',
    reserved: 'Gereserveerd',
    requested: 'Aangevraagd',
};

const KIND_CLASS: Record<EntryKind, string> = {
    out: 'bg-purple-600 text-white',
    reserved: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200',
    requested: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200',
};

const LEGEND = (['out', 'reserved', 'requested'] as const).map((kind) => ({
    kind,
    label: KIND_LABEL[kind],
    className: KIND_CLASS[kind],
}));

const WEEKDAYS = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];
const pad = (n: number) => String(n).padStart(2, '0');
const toKey = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

export default function CameraCalendar({
    requests,
    loans,
    today,
}: {
    requests: CameraAdminRequest[];
    loans: CameraAdminLoan[];
    today: string;
}) {
    const [year, setYear] = useState(Number(today.slice(0, 4)));
    const [month, setMonth] = useState(Number(today.slice(5, 7)) - 1);
    const [selected, setSelected] = useState<string>(today);

    const entries = useMemo<Entry[]>(() => {
        const loanned = new Set(loans.map((l) => l.request_id));
        const fromLoans: Entry[] = loans.map((l) => ({
            key: `loan-${l.id}`,
            kind: 'out',
            label: l.event_name,
            who: l.borrower_name,
            start: l.start_date,
            // Een open uitleen loopt door tot de afgesproken einddatum, of tot vandaag als het te laat is.
            end: l.returned_on ?? (today > l.agreed_end_date ? today : l.agreed_end_date),
            times: null,
        }));
        const fromRequests: Entry[] = requests
            .filter((r) => (r.status === 'approved' || r.status === 'requested') && !loanned.has(r.id))
            .map((r) => ({
                key: `req-${r.id}`,
                kind: r.status === 'approved' ? 'reserved' : 'requested',
                label: r.event_name,
                who: r.requester_name,
                start: r.start_date,
                end: r.end_date,
                times: r.start_time || r.end_time ? `${r.start_time ?? ''}–${r.end_time ?? ''}` : null,
            }));
        return [...fromLoans, ...fromRequests];
    }, [requests, loans, today]);

    const cells = useMemo(() => {
        const first = new Date(Date.UTC(year, month, 1));
        const offset = (first.getUTCDay() + 6) % 7; // maandag eerst
        const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
        const out: (string | null)[] = Array.from({ length: offset }, () => null);
        for (let d = 1; d <= daysInMonth; d++) out.push(toKey(year, month, d));
        while (out.length % 7 !== 0) out.push(null);
        return out;
    }, [year, month]);

    const forDay = (day: string) => entries.filter((e) => e.start <= day && day <= e.end);

    const shift = (delta: number) => {
        const d = new Date(Date.UTC(year, month + delta, 1));
        setYear(d.getUTCFullYear());
        setMonth(d.getUTCMonth());
    };

    const monthLabel = new Date(Date.UTC(year, month, 1)).toLocaleDateString('nl-NL', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    });
    const selectedEntries = forDay(selected);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <button
                    type="button"
                    onClick={() => shift(-1)}
                    aria-label="Vorige maand"
                    className="icon-button cursor-pointer rounded-lg p-2 hover:bg-bg-soft"
                >
                    <ChevronLeft className="size-4" />
                </button>
                <h3 className="text-sm font-bold text-text-main capitalize">{monthLabel}</h3>
                <button
                    type="button"
                    onClick={() => shift(1)}
                    aria-label="Volgende maand"
                    className="icon-button cursor-pointer rounded-lg p-2 hover:bg-bg-soft"
                >
                    <ChevronRight className="size-4" />
                </button>
            </div>

            <div className="flex flex-wrap gap-3 text-[11px] font-semibold text-text-muted">
                {LEGEND.map(({ kind, label, className }) => (
                    <span key={kind} className="inline-flex items-center gap-1.5">
                        <span className={`inline-block size-3 rounded ${className}`} />
                        {label}
                    </span>
                ))}
                <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block size-3 rounded border border-border-color bg-bg-card" />
                    Beschikbaar
                </span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black tracking-widest text-text-muted uppercase">
                {WEEKDAYS.map((w) => (
                    <span key={w}>{w}</span>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {cells.map((day, i) => {
                    if (!day) return <div key={`empty-${i}`} />;
                    const dayEntries = forDay(day);
                    const isSelected = day === selected;
                    return (
                        <button
                            key={day}
                            type="button"
                            onClick={() => setSelected(day)}
                            className={`beheer-button flex min-h-16 cursor-pointer flex-col items-stretch gap-0.5 rounded-lg border p-1 text-left transition-colors sm:min-h-20 ${
                                isSelected ? 'border-purple-500 ring-1 ring-purple-500' : 'border-border-color'
                            } ${day === today ? 'bg-purple-50 dark:bg-purple-500/10' : 'bg-bg-card'}`}
                        >
                            <span className="text-[11px] font-bold text-text-main">{Number(day.slice(8))}</span>
                            {dayEntries.slice(0, 2).map((e) => (
                                <span
                                    key={e.key}
                                    className={`truncate rounded px-1 text-[9px] leading-4 font-semibold ${KIND_CLASS[e.kind]}`}
                                >
                                    {e.label}
                                </span>
                            ))}
                            {dayEntries.length > 2 && (
                                <span className="text-[9px] font-bold text-text-muted">+{dayEntries.length - 2}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="space-y-2 rounded-2xl border border-border-color bg-bg-card p-4">
                <h4 className="text-xs font-bold text-text-main">{formatDate(selected, 'EEEE d MMMM yyyy')}</h4>
                {selectedEntries.length === 0 ? (
                    <p className="text-xs font-semibold text-green-700 dark:text-green-300">De camera is deze dag beschikbaar.</p>
                ) : (
                    <ul className="space-y-1.5">
                        {selectedEntries.map((e) => (
                            <li key={e.key} className="flex flex-wrap items-center gap-2 text-xs">
                                <span className={`rounded-full px-2 py-0.5 text-[9px] font-black tracking-widest uppercase ${KIND_CLASS[e.kind]}`}>
                                    {KIND_LABEL[e.kind]}
                                </span>
                                <span className="font-bold text-text-main">{e.label}</span>
                                <span className="text-text-muted">
                                    {e.who} · {formatDate(e.start, 'd MMM')} – {formatDate(e.end, 'd MMM')}
                                    {e.times && ` · ${e.times}`}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
