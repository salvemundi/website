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
            router.push('/?noAuto=true');
            router.refresh();
        } catch (error) {
            safeConsoleError('[ProfielDetails.tsx][ProfielDetails] ', error);
        }
    };

    const logoutButton = (
        <button
            onClick={() => {
                void handleLogout();
            }}
            className="group form-button flex items-center gap-2 rounded-xl border border-red-500/10 bg-red-500/5 px-4 py-2 text-xs font-bold text-red-500 transition-all hover:bg-red-500/10 active:scale-95"
        >
            <LogOut className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Uitloggen</span>
        </button>
    );

    return (
        <Tile
            title="Mijn gegevens"
            icon={<Mail className="size-5" />}
            className="h-fit"
            actions={logoutButton}
        >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                    <div className="flex h-6 items-center pl-1">
                        <p className="text-left text-[11px] font-black tracking-wider text-licht-paars uppercase dark:text-geel">
                            E-mailadres
                        </p>
                    </div>
                    <div className="squircle flex min-h-17 items-center gap-4 border border-licht-paars/20 bg-licht-paars/10 p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
                        <div className="flex shrink-0 items-center justify-center text-purple-600 dark:text-purple-300">
                            <Mail className="size-5" />
                        </div>
                        <p className="min-w-0 flex-1 text-xs leading-tight font-bold wrap-break-word text-purple-700 sm:text-sm dark:text-white">
                            {formatForBreak(user.email) || 'Geen email'}
                        </p>
                    </div>
                </div>

                {user.fontys_email && (
                    <div className="flex flex-col gap-1.5">
                        <div className="flex h-6 items-center pl-1">
                            <p className="text-left text-[11px] font-black tracking-wider text-licht-paars uppercase dark:text-geel">
                                Fontys e-mail
                            </p>
                        </div>
                        <div className="squircle flex min-h-17 items-center gap-4 border border-licht-paars/20 bg-licht-paars/10 p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
                            <div className="flex shrink-0 items-center justify-center text-purple-600 dark:text-purple-300">
                                <Mail className="size-5" />
                            </div>
                            <p className="min-w-0 flex-1 text-xs leading-tight font-bold wrap-break-word text-purple-700 sm:text-sm dark:text-white">
                                {formatForBreak(user.fontys_email)}
                            </p>
                        </div>
                    </div>
                )}

                <div className="group relative flex flex-col gap-1.5">
                    <div className="flex h-6 items-center justify-between gap-2 pl-1">
                        <p className="text-left text-[11px] font-black tracking-wider text-licht-paars uppercase dark:text-geel">
                            Telefoonnummer
                        </p>
                        {!isEditingPhoneNumber && (
                            <button onClick={() => setIsEditingPhoneNumber(true)} className="icon-button rounded-md p-1 text-text-muted transition-colors hover:text-purple-500">
                                <Pen className="size-3.5" />
                            </button>
                        )}
                    </div>
                    <div className="squircle flex min-h-17 items-center gap-4 border border-licht-paars/20 bg-licht-paars/10 p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
                        <div className="flex shrink-0 items-center justify-center text-purple-600 dark:text-purple-300">
                            <Phone className="size-5" />
                        </div>
                        {isEditingPhoneNumber ? (
                            <form
                                onSubmit={(e) => {
                                    void handleSubmitPhone(onSavePhone)(e);
                                }}
                                className="relative flex min-w-0 flex-1 pr-12"
                                autoComplete="off"
                            >
                                <div className="flex w-full items-center">
                                    <PhoneInput
                                        {...registerPhone("phone_number")}
                                        className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white text-sm font-medium dark:border-white/20 dark:bg-black/40"
                                    />
                                    <button type="submit" disabled={isPending} className="absolute top-1/2 right-0 form-button flex size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg bg-purple-500 p-0 text-white transition-colors hover:bg-purple-600 disabled:opacity-50">
                                        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <p className="text-sm font-bold text-purple-700 dark:text-white">
                                {formatPhoneNumber(user.phone_number) || "Niet ingesteld"}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <div className="flex h-6 items-center pl-1">
                        <p className="text-left text-[11px] font-black tracking-wider text-licht-paars uppercase dark:text-geel">
                            Geboortedatum
                        </p>
                    </div>
                    <div className="squircle flex min-h-17 items-center gap-4 border border-licht-paars/20 bg-licht-paars/10 p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
                        <div className="flex shrink-0 items-center justify-center text-purple-600 dark:text-purple-300">
                            <Calendar className="size-5" />
                        </div>
                        <p className="text-sm font-bold text-purple-700 dark:text-white">
                            {formatDate(user.date_of_birth, "d MMMM yyyy")}
                        </p>
                    </div>
                </div>
            </div>
        </Tile>
    );
}
