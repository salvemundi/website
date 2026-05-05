'use client';

import { Fragment } from 'react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Loader2, Edit, Trash2, Send, AlertCircle, ChevronDown, Bus, Briefcase, CheckCircle2, Clock, XCircle, List } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TripSignup, TripSignupActivity } from '@salvemundi/validations/schema/admin-reis.zod';
import { mapActivityOptionIdToName, parseActivityOptions, parseSelectedOptions } from '@/lib/reis';

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
    statusBadge,
    paymentStatus,
    isStatusLoading,
    isDeleteLoading,
    sendingEmailType,
    onStatusChange,
    onDelete,
    onResendEmail,
    activities,
    allowFinalPayments,
    isBusTrip = false
}: ReisTableRowProps) {
    const router = useRouter();

    return (
        <div 
            onClick={() => onSelect(signup)} 
            className={`
                relative bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)]/60 rounded-[2rem] squircle-lg transition-all duration-300 cursor-pointer group flex flex-col
                ${isSelected ? 'shadow-2xl border-[var(--beheer-accent)] ring-2 ring-[var(--beheer-accent)]/20' : 'hover:shadow-lg hover:border-[var(--beheer-accent)]/20 shadow-sm'}
            `}
        >
            {/* Card Content */}
            <div className="p-4 flex flex-col h-full">
                {/* Header: Name & Actions */}
                <div className="flex justify-between items-start mb-3">
                    <div className="min-w-0 pr-2">
                        <div className="text-xs font-semibold text-[var(--beheer-accent)] mb-0.5 opacity-70">
                            {signup.role === 'crew' ? 'Crew' : 'Deelnemer'}
                        </div>
                        <div className="text-lg font-bold text-[var(--beheer-text)] tracking-tight leading-tight group-hover:text-[var(--beheer-accent)] transition-colors line-clamp-2 min-h-[2.8rem] flex items-center">
                            {signup.first_name} {signup.last_name}
                        </div>
                    </div>

                    <div className="flex items-center bg-[var(--bg-main)]/50 p-1 rounded-xl border border-[var(--beheer-border)]/20 shadow-inner shrink-0">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onSelect(signup, true); }}
                            className="p-2 text-[var(--beheer-text-muted)] hover:text-[var(--beheer-accent)] hover:bg-white/5 rounded-lg transition-all" 
                            title="Bewerken"
                        >
                            <Edit className="h-4 w-4" />
                        </button>
                        <div className="w-[1px] h-4 bg-[var(--beheer-border)]/20 mx-0.5" />
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(signup.id); }}
                            disabled={isDeleteLoading}
                            className="p-2 text-[var(--beheer-text-muted)] hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-all disabled:opacity-50"
                            title="Verwijderen"
                        >
                            {isDeleteLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Info Stack */}
                <div className="space-y-1.5 mb-4 px-1">
                    <div className="text-[11px] font-medium text-[var(--beheer-text-muted)] truncate opacity-80">
                        {signup.email}
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="text-[10px] font-bold text-[var(--beheer-text-muted)] tabular-nums opacity-60">
                            {signup.date_of_birth ? format(new Date(signup.date_of_birth), 'd MMM yyyy', { locale: nl }) : '-'}
                        </div>
                        
                        {/* Special Indicators */}
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

                {/* Bottom Row: Status & Payment */}
                <div className="mt-auto pt-3 border-t border-[var(--beheer-border)]/10 flex flex-wrap items-center justify-between gap-y-2 gap-x-3">
                    <div className="flex-1 min-w-[120px]">
                        {isStatusLoading ? (
                            <div className="flex items-center justify-center py-2">
                                <Loader2 className="h-5 w-5 animate-spin text-[var(--beheer-accent)]" />
                            </div>
                        ) : (
                            <StatusDropdown 
                                currentStatus={signup.status || 'registered'} 
                                onChange={(val) => onStatusChange(signup.id, val)}
                            />
                        )}
                    </div>

                    <div className="shrink-0 flex items-center justify-end ml-auto">
                        <span className={`px-2 py-1 text-[10px] font-semibold rounded-lg border-2 shadow-sm whitespace-nowrap ${paymentStatus.color}`}>
                            {paymentStatus.label}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* --- Premium Status Dropdown Component --- */
function StatusDropdown({ currentStatus, onChange }: { currentStatus: string, onChange: (val: string) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const statuses = [
        { value: 'registered', label: 'Geregistreerd', icon: Clock, color: 'text-blue-400 bg-blue-400/10' },
        { value: 'confirmed', label: 'Bevestigd', icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-400/10' },
        { value: 'waitlist', label: 'Wachtlijst', icon: List, color: 'text-orange-400 bg-orange-400/10' },
        { value: 'cancelled', label: 'Geannuleerd', icon: XCircle, color: 'text-red-400 bg-red-400/10' }
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
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                className={`
                    w-full flex items-center justify-between px-3 py-2 rounded-xl border-2 transition-all duration-300
                    ${isOpen ? 'border-[var(--beheer-accent)] shadow-lg scale-[1.02] bg-[var(--beheer-card-bg)]' : 'border-[var(--beheer-border)]/40 hover:border-[var(--beheer-accent)]/30'}
                `}
            >
                <div className="flex items-center gap-2">
                    <current.icon className={`h-3 w-3 ${current.color.split(' ')[0]}`} />
                    <span className="text-[10px] font-semibold text-[var(--beheer-text)]">
                        {current.label}
                    </span>
                </div>
                <ChevronDown className={`h-3 w-3 text-[var(--beheer-text-muted)] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute bottom-full left-0 mb-2 w-full min-w-[160px] bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)]/60 rounded-2xl shadow-2xl z-[100] overflow-hidden backdrop-blur-md"
                    >
                        <div className="p-1.5 space-y-0.5">
                            {statuses.map((s) => (
                                <button
                                    key={s.value}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onChange(s.value);
                                        setIsOpen(false);
                                    }}
                                    className={`
                                        w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all text-left
                                        ${currentStatus === s.value 
                                            ? 'bg-[var(--beheer-accent)]/10 text-[var(--beheer-accent)]' 
                                            : 'hover:bg-white/5 text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)]'}
                                    `}
                                >
                                    <s.icon className={`h-3.5 w-3.5 ${currentStatus === s.value ? 'text-[var(--beheer-accent)]' : s.color.split(' ')[0]}`} />
                                    <span className="text-[11px] font-semibold">{s.label}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
