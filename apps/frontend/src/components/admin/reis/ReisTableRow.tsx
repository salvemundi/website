'use client';

import { Loader2, Edit, Trash, ChevronDown, Bus, Briefcase, CheckCircle2, Clock, XCircle, List } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { TripSignup, TripSignupActivity } from '@salvemundi/validations/schema/admin-trip.zod';

interface ReisTableRowProps {
    signup: TripSignup;
    isSelected: boolean;
    onSelect: (signup: TripSignup, edit?: boolean) => void;
    statusBadge: { label: string; color: string };
    paymentStatus: { label: string; color: string };
    isStatusLoading: boolean;
    isDeleteLoading: boolean;
    sendingEmailType: string | null;
    onStatusChange: (id: number, status: string) => void;
    onDelete: (id: number) => void;
    onResendEmail: (id: number, type: 'deposit' | 'final') => void;
    activities: TripSignupActivity[];
    allowFinalPayments: boolean;
    isBusTrip?: boolean;
}

export default function ReisTableRow({
    signup,
    isSelected,
    onSelect,
    paymentStatus,
    isStatusLoading,
    isDeleteLoading,
    onStatusChange,
    onDelete,
    isBusTrip = false
}: ReisTableRowProps) {

    return (
        <div
            onClick={() => onSelect(signup)}
            className={`
                squircle-lg group relative flex cursor-pointer flex-col rounded-4xl border border-(--beheer-border)/60 bg-(--beheer-card-bg) transition-all duration-300
                ${isSelected ? 'border-(--beheer-accent) shadow-2xl ring-2 ring-(--beheer-accent)/20' : 'shadow-sm hover:border-(--beheer-accent)/20 hover:shadow-lg'}
            `}
        >
            <div className="flex h-full flex-col p-4">
                <div className="mb-3 flex items-start justify-between">
                    <div className="min-w-0 pr-2">
                        <div className="mb-0.5 text-xs font-semibold text-(--beheer-accent) opacity-70">
                            {signup.role === 'crew' ? 'Crew' : 'Deelnemer'}
                        </div>
                        <div className="line-clamp-2 flex min-h-[2.8rem] items-center text-lg leading-tight font-semibold text-(--beheer-text) transition-colors group-hover:text-(--beheer-accent)">
                            {signup.first_name} {signup.last_name}
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center rounded-xl border border-(--beheer-border)/20 bg-(--bg-main)/50 p-1 shadow-inner">
                        <button
                            onClick={(e) => { e.stopPropagation(); onSelect(signup, true); }}
                            className="icon-button rounded-lg p-2 text-(--beheer-text-muted) transition-all hover:bg-white/5 hover:text-(--beheer-accent)"
                            title="Bewerken"
                        >
                            <Edit className="size-4" />
                        </button>
                        <div className="mx-0.5 h-4 w-px bg-(--beheer-border)/20" />
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(signup.id); }}
                            disabled={isDeleteLoading}
                            className="icon-button rounded-lg p-2 text-(--beheer-text-muted) transition-all hover:bg-red-400/5 hover:text-red-400 disabled:opacity-50"
                            title="Verwijderen"
                        >
                            {isDeleteLoading ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Trash className="size-4" />
                            )}
                        </button>
                    </div>
                </div>

                <div className="mb-4 space-y-1.5 px-1">
                    <div className="truncate text-[11px] font-medium text-(--beheer-text-muted) opacity-80">
                        {signup.email}
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="text-[10px] font-semibold text-(--beheer-text-muted) tabular-nums opacity-60">
                            {signup.date_of_birth
                                ? new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(signup.date_of_birth))
                                : '-'}
                        </div>

                        <div className="flex items-center gap-2">
                            {isBusTrip && signup.willing_to_drive && (
                                <div className="flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-500" title="Chauffeur">
                                    <Bus className="size-2.5" />
                                    <span>Chauffeur</span>
                                </div>
                            )}
                            {!isBusTrip && signup.extra_luggage && (
                                <div className="flex items-center gap-1 rounded-md border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-blue-500" title="Extra Koffer">
                                    <Briefcase className="size-2.5" />
                                    <span>+1 Koffer</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-(--beheer-border)/10 pt-3">
                    <div className="shrink-0">
                        {isStatusLoading ? (
                            <div className="flex items-center justify-center px-3 py-1">
                                <Loader2 className="size-4 animate-spin text-(--beheer-accent)" />
                            </div>
                        ) : (
                            <StatusDropdown
                                currentStatus={signup.status || 'registered'}
                                onChange={(val) => onStatusChange(signup.id, val)}
                            />
                        )}
                    </div>

                    <div className="ml-auto flex shrink-0 items-center justify-end">
                        <span className={`rounded-lg border px-2.5 py-1 text-[10px] font-semibold whitespace-nowrap shadow-xs ${paymentStatus.color}`}>
                            {paymentStatus.label}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatusDropdown({ currentStatus, onChange }: { currentStatus: string, onChange: (val: string) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const statuses = [
        {
            value: 'registered',
            label: 'Geregistreerd',
            icon: Clock,
            pillColor: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 hover:bg-blue-500/20',
            iconColor: 'text-blue-500'
        },
        {
            value: 'confirmed',
            label: 'Bevestigd',
            icon: CheckCircle2,
            pillColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20',
            iconColor: 'text-emerald-500'
        },
        {
            value: 'waitlist',
            label: 'Wachtlijst',
            icon: List,
            pillColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 hover:bg-amber-500/20',
            iconColor: 'text-amber-500'
        },
        {
            value: 'cancelled',
            label: 'Geannuleerd',
            icon: XCircle,
            pillColor: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20 hover:bg-rose-500/20',
            iconColor: 'text-rose-500'
        }
    ];

    const current = statuses.find(s => s.value === currentStatus) || statuses[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="relative inline-block" ref={dropdownRef}>
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                className={`beheer-button 
                    inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold shadow-2xs transition-all duration-200
                    ${current.pillColor}
                    ${isOpen ? 'scale-1.02 ring-2 ring-(--beheer-accent)/40' : ''}
                `}
            >
                <current.icon className={`size-3 shrink-0 ${current.iconColor}`} />
                <span>{current.label}</span>
                <ChevronDown className={`size-3 shrink-0 opacity-70 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div
                    className="animate-in fade-in zoom-in-95 absolute bottom-full left-0 z-50 mb-1.5 w-44 space-y-0.5 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl duration-150 dark:border-slate-800 dark:bg-slate-900"
                >
                    {statuses.map((s) => {
                        const isSelected = currentStatus === s.value;
                        return (
                            <button
                                key={s.value}
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onChange(s.value);
                                    setIsOpen(false);
                                }}
                                className={`beheer-button 
                                    flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[11px] font-semibold transition-all
                                    ${isSelected
                                        ? 'bg-slate-100 font-bold text-slate-900 ring-1 ring-slate-300 dark:bg-slate-800 dark:text-white dark:ring-slate-700'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white'}
                                `}
                            >
                                <div className="flex items-center gap-2">
                                    <s.icon className={`size-3.5 ${s.iconColor}`} />
                                    <span>{s.label}</span>
                                </div>
                                {isSelected && (
                                    <span className="size-1.5 rounded-full bg-(--beheer-accent)" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
