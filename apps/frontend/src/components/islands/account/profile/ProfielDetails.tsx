'use client';

import { Mail, Phone, Calendar, Pen, Save, Loader2, LogOut } from 'lucide-react';
import { Tile, formatForBreak } from './ProfielUI';
import { formatDate } from '@/shared/lib/utils/date';
import { formatPhoneNumber } from '@/lib/utils/phone-utils';
import { authClient } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { UseFormRegister, UseFormHandleSubmit, FieldErrors } from 'react-hook-form';
import { safeConsoleError } from '@/server/utils/logger';
import { PhoneInput } from '@/shared/ui/PhoneInput';

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
    phoneErrors: _phoneErrors = {},
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
            safeConsoleError('[ProfielDetails.tsx][ProfielDetails] ', error);
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
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center h-6 pl-1">
                        <p className="text-[11px] text-licht-paars dark:text-geel font-black uppercase tracking-wider text-left">
                            E-mailadres
                        </p>
                    </div>
                    <div className="flex items-center gap-4 squircle bg-licht-paars/10 dark:bg-white/5 p-5 border border-licht-paars/20 dark:border-white/10 shadow-sm min-h-[68px]">
                        <div className="shrink-0 flex items-center justify-center text-purple-600 dark:text-purple-300">
                            <Mail className="h-5 w-5" />
                        </div>
                        <p className="font-bold text-purple-700 dark:text-white wrap-break-word text-xs sm:text-sm leading-tight min-w-0 flex-1">
                            {formatForBreak(user.email) || 'Geen email'}
                        </p>
                    </div>
                </div>

                {user.fontys_email && (
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center h-6 pl-1">
                            <p className="text-[11px] text-licht-paars dark:text-geel font-black uppercase tracking-wider text-left">
                                Fontys e-mail
                            </p>
                        </div>
                        <div className="flex items-center gap-4 squircle bg-licht-paars/10 dark:bg-white/5 p-5 border border-licht-paars/20 dark:border-white/10 shadow-sm min-h-[68px]">
                            <div className="shrink-0 flex items-center justify-center text-purple-600 dark:text-purple-300">
                                <Mail className="h-5 w-5" />
                            </div>
                            <p className="font-bold text-purple-700 dark:text-white wrap-break-word text-xs sm:text-sm leading-tight min-w-0 flex-1">
                                {formatForBreak(user.fontys_email)}
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-1.5 relative group">
                    <div className="flex items-center justify-between gap-2 h-6 pl-1">
                        <p className="text-[11px] font-black uppercase text-licht-paars dark:text-geel tracking-wider text-left">
                            Telefoonnummer
                        </p>
                        {!isEditingPhoneNumber && (
                            <button onClick={() => setIsEditingPhoneNumber(true)} className="text-text-muted hover:text-purple-500 p-1 rounded-md transition-colors">
                                <Pen className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-4 squircle bg-licht-paars/10 dark:bg-white/5 p-5 border border-licht-paars/20 dark:border-white/10 shadow-sm min-h-[68px]">
                        <div className="shrink-0 flex items-center justify-center text-purple-600 dark:text-purple-300">
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
                                    <PhoneInput
                                        {...registerPhone("phone_number")}
                                        className="flex-1 min-w-0 bg-white dark:bg-black/40 border border-slate-300 dark:border-white/20 rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
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

                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center h-6 pl-1">
                        <p className="text-[11px] font-black uppercase text-licht-paars dark:text-geel tracking-wider text-left">
                            Geboortedatum
                        </p>
                    </div>
                    <div className="flex items-center gap-4 squircle bg-licht-paars/10 dark:bg-white/5 p-5 border border-licht-paars/20 dark:border-white/10 shadow-sm min-h-[68px]">
                        <div className="shrink-0 flex items-center justify-center text-purple-600 dark:text-purple-300">
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
