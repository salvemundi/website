'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { type CoboBoardPreference } from '@salvemundi/validations';
import { updateBoardPreferenceAction } from '@/server/actions/admin/cobo/admin-cobo-management.actions';
import { Shield, Wine, Ban, Utensils, FileText, Loader2, Save } from 'lucide-react';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils/image-utils';
import { FallbackLogo } from '@/components/ui/media/FallbackLogo';

interface Props {
    coboId: number;
    initialPreferences: CoboBoardPreference[];
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function CoboBoardPreferencesManager({
    coboId,
    initialPreferences,
    showToast
}: Props) {
    const router = useRouter();
    const [preferences, setPreferences] = useState<CoboBoardPreference[]>(initialPreferences);
    const [savingUserId, setSavingUserId] = useState<string | null>(null);
    const [, startTransition] = useTransition();

    useEffect(() => {
        setPreferences(initialPreferences);
    }, [initialPreferences]);

    const handleFieldChange = <K extends keyof CoboBoardPreference>(
        userId: string,
        field: K,
        value: CoboBoardPreference[K]
    ) => {
        setPreferences(prev =>
            prev.map(p => {
                if (p.user_id === userId) {
                    return { ...p, [field]: value };
                }
                return p;
            })
        );
    };

    const handleToggleAlcohol = (pref: CoboBoardPreference) => {
        if (!pref.user_id) return;
        const newAlcohol = !pref.drinks_alcohol;

        setPreferences(prev =>
            prev.map(p => {
                if (p.user_id === pref.user_id) {
                    return { ...p, drinks_alcohol: newAlcohol };
                }
                return p;
            })
        );

        startTransition(async () => {
            try {
                const res = await updateBoardPreferenceAction({
                    cobo_id: coboId,
                    user_id: pref.user_id as string,
                    drinks_alcohol: newAlcohol,
                    vetoes: pref.vetoes || '',
                    dietary_requirements: pref.dietary_requirements || '',
                    notes: pref.notes || ''
                });

                if (res.success) {
                    showToast(`Alcoholvoorkeur van ${pref.user?.first_name || 'bestuurslid'} bijgewerkt!`, 'success');
                    router.refresh();
                } else {
                    showToast(res.error || 'Opslaan mislukt', 'error');
                }
            } catch {
                showToast('Er is een fout opgetreden bij het opslaan', 'error');
            }
        });
    };

    const handleSaveMember = (pref: CoboBoardPreference) => {
        if (!pref.user_id) return;

        setSavingUserId(pref.user_id);
        startTransition(async () => {
            try {
                const res = await updateBoardPreferenceAction({
                    cobo_id: coboId,
                    user_id: pref.user_id as string,
                    drinks_alcohol: pref.drinks_alcohol ?? true,
                    vetoes: pref.vetoes || '',
                    dietary_requirements: pref.dietary_requirements || '',
                    notes: pref.notes || ''
                });

                if (res.success) {
                    showToast(`Voorkeuren van ${pref.user?.first_name || 'bestuurslid'} opgeslagen!`, 'success');
                    router.refresh();
                } else {
                    showToast(res.error || 'Opslaan mislukt', 'error');
                }
            } catch {
                showToast('Er is een fout opgetreden bij het opslaan', 'error');
            } finally {
                setSavingUserId(null);
            }
        });
    };

    if (preferences.length === 0) {
        return (
            <div className="rounded-2xl border border-border-color bg-bg-card p-8 text-center shadow-sm">
                <Shield className="mx-auto mb-3 size-12 text-purple-400 opacity-60" />
                <h3 className="text-lg font-bold text-text-main">Geen bestuursleden gevonden</h3>
                <p className="mt-1 text-sm text-text-muted">
                    Zorg dat er bestuursleden zijn gekoppeld in het bestuursoverzicht.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-black text-purple-700 dark:text-purple-300">
                        Bestuursvoorkeuren &amp; Veto&apos;s
                    </h3>
                    <p className="text-xs text-text-muted">
                        Beheer per bestuurslid of ze alcohol drinken, welke drankjes zij weigeren (veto&apos;s) en eventuele allergieën.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {preferences.map((pref) => {
                    const userId = pref.user_id || '';
                    const isSaving = savingUserId === userId;
                    const memberName = [pref.user?.first_name, pref.user?.last_name].filter(Boolean).join(' ') || 'Bestuurslid';

                    return (
                        <div
                            key={userId || pref.id}
                            className="flex flex-col justify-between rounded-2xl border border-border-color bg-bg-card p-6 shadow-sm transition-all hover:border-purple-500/30"
                        >
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 border-b border-border-color/60 pb-4">
                                    <div className="squircle relative flex size-14 shrink-0 items-center justify-center overflow-hidden border border-purple-500/20 bg-purple-500/10">
                                        {pref.user?.avatar ? (
                                            <Image
                                                src={getImageUrl(pref.user.avatar)}
                                                alt={memberName}
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                        ) : (
                                            <FallbackLogo className="object-contain p-2 opacity-45" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="truncate text-base font-bold text-text-main">
                                            {memberName}
                                        </h4>
                                        <span className="mt-1 inline-block rounded-md border border-purple-500/15 bg-purple-500/10 px-2.5 py-0.5 text-[11px] font-semibold tracking-wider text-purple-700 uppercase dark:text-purple-300">
                                            {pref.user?.functie || 'Bestuurslid'}
                                        </span>
                                    </div>
                                </div>

                                {/* Alcohol switch */}
                                <div className="flex items-center justify-between rounded-xl border border-border-color/40 bg-bg-soft p-3">
                                    <div className="flex items-center gap-2.5">
                                        <Wine className={`size-4 ${pref.drinks_alcohol ? 'text-emerald-500' : 'text-red-400'}`} />
                                        <span className="text-xs font-semibold text-text-main">Drinkt Alcohol</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleToggleAlcohol(pref)}
                                        className={`relative beheer-button inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                            pref.drinks_alcohol ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-red-700'
                                        }`}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                pref.drinks_alcohol ? 'translate-x-5' : 'translate-x-0'
                                            }`}
                                        />
                                    </button>
                                </div>

                                {/* Veto's input */}
                                <div>
                                    <label className="mb-1 flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-text-muted uppercase">
                                        <Ban className="size-3.5 text-rose-500" />
                                        <span>Veto&apos;s</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={pref.vetoes || ''}
                                        onChange={(e) => handleFieldChange(userId, 'vetoes', e.target.value)}
                                        placeholder="Bijv. Tequila, Sambuca, melkproducten..."
                                        className="beheer-input w-full rounded-xl border border-border-color bg-bg-soft px-3.5 py-2.5 text-xs font-medium text-text-main focus:border-theme-purple focus:outline-none"
                                    />
                                </div>

                                {/* Dietary Requirements */}
                                <div>
                                    <label className="mb-1 flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-text-muted uppercase">
                                        <Utensils className="size-3.5 text-amber-500" />
                                        <span>Allergieën</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={pref.dietary_requirements || ''}
                                        onChange={(e) => handleFieldChange(userId, 'dietary_requirements', e.target.value)}
                                        placeholder="Bijv. Notenallergie, Glutenintolerantie, Vegan..."
                                        className="beheer-input w-full rounded-xl border border-border-color bg-bg-soft px-3.5 py-2.5 text-xs font-medium text-text-main focus:border-theme-purple focus:outline-none"
                                    />
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="mb-1 flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-text-muted uppercase">
                                        <FileText className="size-3.5 text-blue-500" />
                                        <span>Extra Opmerkingen</span>
                                    </label>
                                    <textarea
                                        value={pref.notes || ''}
                                        onChange={(e) => handleFieldChange(userId, 'notes', e.target.value)}
                                        rows={2}
                                        placeholder="Bijzonderheden of instructies voor Team CoBo..."
                                        className="beheer-input w-full resize-none rounded-xl border border-border-color bg-bg-soft px-3.5 py-2.5 text-xs font-medium text-text-main focus:border-theme-purple focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Save button */}
                            <div className="mt-4 flex justify-end border-t border-border-color/60 pt-4">
                                <button
                                    type="button"
                                    onClick={() => handleSaveMember(pref)}
                                    disabled={isSaving}
                                    className="beheer-button inline-flex cursor-pointer items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-purple-700 disabled:opacity-50"
                                >
                                    {isSaving ? (
                                        <Loader2 className="size-3.5 animate-spin" />
                                    ) : (
                                        <Save className="size-3.5" />
                                    )}
                                    <span>Opslaan</span>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
