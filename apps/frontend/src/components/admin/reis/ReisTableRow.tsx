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
                relative bg-(--beheer-card-bg) border border-(--beheer-border)/60 rounded-4xl squircle-lg transition-all duration-300 cursor-pointer group flex flex-col
                ${isSelected ? 'shadow-2xl border-(--beheer-accent) ring-2 ring-(--beheer-accent)/20' : 'hover:shadow-lg hover:border-(--beheer-accent)/20 shadow-sm'}
            `}
        >
            <div className="p-4 flex flex-col h-full">
                <div className="flex justify-between items-start mb-3">
                    <div className="min-w-0 pr-2">
                        <div className="text-xs font-semibold text-(--beheer-accent) mb-0.5 opacity-70">
                            {signup.role === 'crew' ? 'Crew' : 'Deelnemer'}
                        </div>
                        <div className="text-lg font-semibold text-(--beheer-text) leading-tight group-hover:text-(--beheer-accent) transition-colors line-clamp-2 min-h-[2.8rem] flex items-center">
                            {signup.first_name} {signup.last_name}
                        </div>
                    </div>

                    <div className="flex items-center bg-(--bg-main)/50 p-1 rounded-xl border border-(--beheer-border)/20 shadow-inner shrink-0">
                        <button
                            onClick={(e) => { e.stopPropagation(); onSelect(signup, true); }}
                            className="icon-button p-2 text-(--beheer-text-muted) hover:text-(--beheer-accent) hover:bg-white/5 rounded-lg transition-all"
                            title="Bewerken"
                        >
                            <Edit className="h-4 w-4" />
                        </button>
                        <div className="w-px h-4 bg-(--beheer-border)/20 mx-0.5" />
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(signup.id); }}
                            disabled={isDeleteLoading}
                            className="icon-button p-2 text-(--beheer-text-muted) hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-all disabled:opacity-50"
                            title="Verwijderen"
                        >
                            {isDeleteLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Trash className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                </div>

                <div className="space-y-1.5 mb-4 px-1">
                    <div className="text-[11px] font-medium text-(--beheer-text-muted) truncate opacity-80">
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
                                <div className="flex items-center gap-1 text-[9px] font-semibold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20" title="Chauffeur">
                                    <Bus className="h-2.5 w-2.5" />
                                    <span>Chauffeur</span>
                                </div>
                            )}
                            {!isBusTrip && signup.extra_luggage && (
                                <div className="flex items-center gap-1 text-[9px] font-semibold text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded-md border border-blue-500/20" title="Extra Koffer">
                                    <Briefcase className="h-2.5 w-2.5" />
                                    <span>+1 Koffer</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-auto pt-3 border-t border-(--beheer-border)/10 flex flex-wrap items-center justify-between gap-y-2 gap-x-3">
                    <div className="shrink-0">
                        {isStatusLoading ? (
                            <div className="flex items-center justify-center py-1 px-3">
                                <Loader2 className="h-4 w-4 animate-spin text-(--beheer-accent)" />
                            </div>
                        ) : (
                            <StatusDropdown
                                currentStatus={signup.status || 'registered'}
                                onChange={(val) => onStatusChange(signup.id, val)}
                            />
                        )}
                    </div>

                    <div className="shrink-0 flex items-center justify-end ml-auto">
                        <span className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg border shadow-xs whitespace-nowrap ${paymentStatus.color}`}>
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
                    inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all duration-200 cursor-pointer shadow-2xs
                    ${current.pillColor}
                    ${isOpen ? 'ring-2 ring-(--beheer-accent)/40 scale-[1.02]' : ''}
                `}
            >
                <current.icon className={`h-3 w-3 shrink-0 ${current.iconColor}`} />
                <span>{current.label}</span>
                <ChevronDown className={`h-3 w-3 shrink-0 opacity-70 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div
                    className="absolute bottom-full left-0 mb-1.5 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-150"
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
                                    w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer text-left
                                    ${isSelected
                                        ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white font-bold ring-1 ring-slate-300 dark:ring-slate-700'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'}
                                `}
                            >
                                <div className="flex items-center gap-2">
                                    <s.icon className={`h-3.5 w-3.5 ${s.iconColor}`} />
                                    <span>{s.label}</span>
                                </div>
                                {isSelected && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-(--beheer-accent)" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
