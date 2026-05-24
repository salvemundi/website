'use client';

import { Mail, Phone, Calendar, Edit2, Save, Loader2, LogOut } from 'lucide-react';
import { Tile, formatForBreak } from './ProfielUI';
import { formatDate } from '@/shared/lib/utils/date';
import { formatPhoneNumber } from '@/lib/utils/phone-utils';
import { authClient } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { UseFormRegister, UseFormHandleSubmit, FieldErrors } from 'react-hook-form';
import { safeConsoleError } from '@/server/utils/logger';

interface ProfielDetailsProps {
    user?: {
        email?: string | null;
        fontys_email?: string | null;
        phone_number?: string | null;
        date_of_birth?: string | null;
    };
    isEditingPhoneNumber?: boolean;
    setIsEditingPhoneNumber?: (val: boolean) => void;
    registerPhone?: UseFormRegister<{ phone_number?: string | null }>;
    handleSubmitPhone?: UseFormHandleSubmit<{ phone_number?: string | null }>;
    onSavePhone?: (data: { phone_number?: string | null }) => void;
    resetPhone?: (data: { phone_number?: string | null }) => void;
    phoneErrors?: FieldErrors<{ phone_number?: string | null }>;
    isPending?: boolean;
}

export default function ProfielDetails({
    user = {},
    isEditingPhoneNumber = false,
    setIsEditingPhoneNumber = () => { },
    registerPhone = (() => ({ name: 'phone_number', onBlur: async () => { }, onChange: async () => { }, ref: () => { } })) as unknown as UseFormRegister<{ phone_number?: string | null }>,
    handleSubmitPhone = (() => () => { }) as unknown as UseFormHandleSubmit<{ phone_number?: string | null }>,
    onSavePhone = () => { },
    resetPhone: _resetPhone = () => { },
    phoneErrors = {},
    isPending = false
}: ProfielDetailsProps) {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await authClient.signOut();
            if (typeof window !== 'undefined') {
                window.location.href = '/?noAuto=true';
            } else {
                router.push('/');
            }
        } catch (error) {
            safeConsoleError('[ProfielDetails][handleLogout]', error);
        }
    };

    const logoutButton = (
        <button
            onClick={() => {
                void handleLogout();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-red-500 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 transition-all active:scale-95 group"
        >
            <LogOut className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Uitloggen</span>
        </button>
    );

    return (
        <Tile
            title="Mijn gegevens"
            icon={<Mail className="h-5 w-5" />}
            className="h-fit"
            actions={logoutButton}
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-4 rounded-2xl bg-slate-50 dark:bg-black/20 p-5 border border-slate-200 dark:border-white/10 shadow-sm">
                    <div className="shrink-0 rounded-xl bg-purple-100 p-3 text-purple-600 shadow-sm">
                        <Mail className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                        <p className="text-[11px] text-purple-400 font-bold uppercase tracking-wide mb-1">
                            E-mailadres
                        </p>
                        <p className="font-bold text-purple-700 dark:text-white break-words text-xs sm:text-sm leading-tight">
                            {formatForBreak(user.email) || 'Geen email'}
                        </p>
                    </div>
                </div>

                {user.fontys_email && (
                    <div className="flex items-center gap-4 rounded-2xl bg-slate-50 dark:bg-black/20 p-5 border border-slate-200 dark:border-white/10 shadow-sm">
                        <div className="shrink-0 rounded-xl bg-purple-100 p-3 text-purple-600 shadow-sm">
                            <Mail className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1 overflow-hidden">
                            <p className="text-[11px] text-purple-400 font-bold uppercase tracking-wide mb-1">
                                Fontys e-mail
                            </p>
                            <p className="font-bold text-purple-700 dark:text-white break-words text-xs sm:text-sm leading-tight">
                                {formatForBreak(user.fontys_email)}
                            </p>
                        </div>
                    </div>
                )}

                <div className="rounded-2xl bg-slate-50 dark:bg-black/20 p-5 border border-slate-200 dark:border-white/10 shadow-sm relative group">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <p className="text-[11px] font-bold uppercase text-purple-400 tracking-wide text-left">
                            Telefoonnummer
                        </p>
                        {!isEditingPhoneNumber && (
                            <button onClick={() => setIsEditingPhoneNumber(true)} className="text-text-muted hover:text-purple-500 p-1 rounded-md transition-colors">
                                <Edit2 className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="shrink-0 rounded-xl bg-purple-100 p-3 text-purple-600 shadow-sm">
                            <Phone className="h-5 w-5" />
                        </div>
                        {isEditingPhoneNumber ? (
                            <form
                                onSubmit={(e) => {
                                    void handleSubmitPhone(onSavePhone)(e);
                                }}
                                className="flex flex-col w-full gap-2"
                                autoComplete="off"
                            >
                                <div className="flex w-full items-center gap-2">
                                    <input
                                        {...registerPhone("phone_number")}
                                        type="tel"
                                        className={`flex-1 min-w-0 bg-white dark:bg-black/40 border ${phoneErrors.phone_number ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300 dark:border-white/20'} rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none`}
                                        placeholder="0612345678"
                                    />
                                    <button type="submit" disabled={isPending} className="shrink-0 p-1.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
                                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <p className="font-bold text-purple-700 dark:text-white text-sm">
                                {formatPhoneNumber(user.phone_number) || "Niet ingesteld"}
                            </p>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl bg-slate-50 dark:bg-black/20 p-5 border border-slate-200 dark:border-white/10 shadow-sm">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <p className="text-[11px] font-bold uppercase text-purple-400 tracking-wide text-left">
                            Geboortedatum
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="shrink-0 rounded-xl bg-purple-100 p-3 text-purple-600 shadow-sm">
                            <Calendar className="h-5 w-5" />
                        </div>
                        <p className="font-bold text-purple-700 dark:text-white text-sm">
                            {formatDate(user.date_of_birth, "d MMMM yyyy")}
                        </p>
                    </div>
                </div>
            </div>
        </Tile>
    );
}