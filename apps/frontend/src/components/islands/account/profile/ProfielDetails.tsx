'use client';

import React from 'react';
import { Mail, Phone, Calendar, Edit2, Save, Loader2, X } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Tile, formatForBreak } from './ProfielUI';
import { formatPhoneNumber } from '@/lib/utils/phone-utils';

interface ProfielDetailsProps {
    user?: any;
    isEditingPhoneNumber?: boolean;
    setIsEditingPhoneNumber?: (val: boolean) => void;
    registerPhone?: any;
    handleSubmitPhone?: any;
    onSavePhone?: (data: any) => void;
    resetPhone?: (data: any) => void;
    phoneErrors?: any;
    isPending?: boolean;
}

export default function ProfielDetails({
    user = {},
    isEditingPhoneNumber = false,
    setIsEditingPhoneNumber = () => {},
    registerPhone,
    handleSubmitPhone,
    onSavePhone = () => {},
    resetPhone = () => {},
    phoneErrors = {},
    isPending = false
}: ProfielDetailsProps) {
    return (
        <Tile title="Mijn gegevens" icon={<Mail className="h-5 w-5" />} className="h-fit">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email Box */}
                <div className="flex items-center gap-4 rounded-2xl bg-slate-50 dark:bg-black/20 p-5 border border-slate-200 dark:border-white/10 shadow-sm">
                    <div className="shrink-0 rounded-xl bg-[var(--color-purple-100)] p-3 text-[var(--color-purple-600)] shadow-sm">
                        <Mail className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                        <p className="text-[11px] text-[var(--color-purple-400)] font-bold uppercase tracking-wide mb-1">
                            E-mailadres
                        </p>
                        <p className="font-bold text-[var(--color-purple-700)] dark:text-white break-words text-xs sm:text-sm leading-tight">
                            {formatForBreak(user.email) || 'Geen email'}
                        </p>
                    </div>
                </div>

                {/* Fontys Email Box */}
                {user.fontys_email && (
                    <div className="flex items-center gap-4 rounded-2xl bg-slate-50 dark:bg-black/20 p-5 border border-slate-200 dark:border-white/10 shadow-sm">
                        <div className="shrink-0 rounded-xl bg-[var(--color-purple-100)] p-3 text-[var(--color-purple-600)] shadow-sm">
                            <Mail className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1 overflow-hidden">
                            <p className="text-[11px] text-[var(--color-purple-400)] font-bold uppercase tracking-wide mb-1">
                                Fontys e-mail
                            </p>
                            <p className="font-bold text-[var(--color-purple-700)] dark:text-white break-words text-xs sm:text-sm leading-tight">
                                {formatForBreak(user.fontys_email)}
                            </p>
                        </div>
                    </div>
                )}

                {/* Phone Box */}
                <div className="rounded-2xl bg-slate-50 dark:bg-black/20 p-5 border border-slate-200 dark:border-white/10 shadow-sm relative group">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <p className="text-[11px] font-bold uppercase text-[var(--color-purple-400)] tracking-wide text-left">
                            Telefoonnummer
                        </p>
                        {!isEditingPhoneNumber && (
                            <button onClick={() => setIsEditingPhoneNumber(true)} className="text-[var(--text-muted)] hover:text-[var(--color-purple-500)] p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                <Edit2 className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="shrink-0 rounded-xl bg-[var(--color-purple-100)] p-3 text-[var(--color-purple-600)] shadow-sm">
                            <Phone className="h-5 w-5" />
                        </div>
                        {isEditingPhoneNumber ? (
                            <form onSubmit={handleSubmitPhone(onSavePhone)} className="flex flex-col w-full gap-2" autoComplete="off">
                                <div className="flex w-full items-center gap-2">
                                    <input 
                                        {...registerPhone("phone_number")}
                                        type="tel" 
                                        className={`flex-1 min-w-0 bg-white dark:bg-black/40 border ${phoneErrors.phone_number ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300 dark:border-white/20'} rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-[var(--color-purple-500)] focus:border-transparent outline-none`}
                                        placeholder="0612345678"
                                    />
                                    <button type="submit" disabled={isPending} className="shrink-0 p-1.5 bg-[var(--color-purple-500)] text-white rounded-lg hover:bg-[var(--color-purple-600)] transition-colors">
                                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <p className="font-bold text-[var(--color-purple-700)] dark:text-white text-sm">
                                {formatPhoneNumber(user.phone_number) || "Niet ingesteld"}
                            </p>
                        )}
                    </div>
                </div>

                {/* Birthdate Box */}
                <div className="rounded-2xl bg-slate-50 dark:bg-black/20 p-5 border border-slate-200 dark:border-white/10 shadow-sm">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <p className="text-[11px] font-bold uppercase text-[var(--color-purple-400)] tracking-wide text-left">
                            Geboortedatum
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="shrink-0 rounded-xl bg-[var(--color-purple-100)] p-3 text-[var(--color-purple-600)] shadow-sm">
                            <Calendar className="h-5 w-5" />
                        </div>
                        <p className="font-bold text-[var(--color-purple-700)] dark:text-white text-sm">
                            {user.date_of_birth ? format(new Date(user.date_of_birth), "d MMMM yyyy", { locale: nl }) : "Niet ingesteld"}
                        </p>
                    </div>
                </div>
            </div>
        </Tile>
    );
}

