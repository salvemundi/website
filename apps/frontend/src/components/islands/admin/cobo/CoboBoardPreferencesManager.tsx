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
            <div className="bg-bg-card rounded-2xl p-8 text-center border border-border-color shadow-sm">
                <Shield className="h-12 w-12 text-purple-400 mx-auto mb-3 opacity-60" />
                <h3 className="text-lg font-bold text-text-main">Geen bestuursleden gevonden</h3>
                <p className="text-sm text-text-muted mt-1">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {preferences.map((pref) => {
                    const userId = pref.user_id || '';
                    const isSaving = savingUserId === userId;
                    const memberName = [pref.user?.first_name, pref.user?.last_name].filter(Boolean).join(' ') || 'Bestuurslid';

                    return (
                        <div
                            key={userId || pref.id}
                            className="bg-bg-card rounded-2xl p-6 border border-border-color shadow-sm hover:border-purple-500/30 transition-all flex flex-col justify-between"
                        >
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 pb-4 border-b border-border-color/60">
                                    <div className="relative h-14 w-14 squircle bg-purple-500/10 flex items-center justify-center overflow-hidden border border-purple-500/20 shrink-0">
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
                                        <h4 className="font-bold text-text-main text-base truncate">
                                            {memberName}
                                        </h4>
                                        <span className="inline-block px-2.5 py-0.5 mt-1 rounded-md text-[11px] font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/15 uppercase tracking-wider">
                                            {pref.user?.functie || 'Bestuurslid'}
                                        </span>
                                    </div>
                                </div>

                                {/* Alcohol switch */}
                                <div className="flex items-center justify-between p-3 rounded-xl bg-bg-soft border border-border-color/40">
                                    <div className="flex items-center gap-2.5">
                                        <Wine className={`h-4 w-4 ${pref.drinks_alcohol ? 'text-emerald-500' : 'text-red-400'}`} />
                                        <span className="text-xs font-semibold text-text-main">Drinkt Alcohol</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleToggleAlcohol(pref)}
                                        className={`beheer-button relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                            pref.drinks_alcohol ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-red-700'
                                        }`}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                pref.drinks_alcohol ? 'translate-x-5' : 'translate-x-0'
                                            }`}
                                        />
                                    </button>
                                </div>

                                {/* Veto's input */}
                                <div>
                                    <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                        <Ban className="h-3.5 w-3.5 text-rose-500" />
                                        <span>Veto&apos;s</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={pref.vetoes || ''}
                                        onChange={(e) => handleFieldChange(userId, 'vetoes', e.target.value)}
                                        placeholder="Bijv. Tequila, Sambuca, melkproducten..."
                                        className="beheer-input w-full px-3.5 py-2.5 bg-bg-soft rounded-xl border border-border-color focus:border-theme-purple focus:outline-none text-xs text-text-main font-medium"
                                    />
                                </div>

                                {/* Dietary Requirements */}
                                <div>
                                    <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                        <Utensils className="h-3.5 w-3.5 text-amber-500" />
                                        <span>Allergieën</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={pref.dietary_requirements || ''}
                                        onChange={(e) => handleFieldChange(userId, 'dietary_requirements', e.target.value)}
                                        placeholder="Bijv. Notenallergie, Glutenintolerantie, Vegan..."
                                        className="beheer-input w-full px-3.5 py-2.5 bg-bg-soft rounded-xl border border-border-color focus:border-theme-purple focus:outline-none text-xs text-text-main font-medium"
                                    />
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                        <FileText className="h-3.5 w-3.5 text-blue-500" />
                                        <span>Extra Opmerkingen</span>
                                    </label>
                                    <textarea
                                        value={pref.notes || ''}
                                        onChange={(e) => handleFieldChange(userId, 'notes', e.target.value)}
                                        rows={2}
                                        placeholder="Bijzonderheden of instructies voor Team CoBo..."
                                        className="beheer-input w-full px-3.5 py-2.5 bg-bg-soft rounded-xl border border-border-color focus:border-theme-purple focus:outline-none text-xs text-text-main font-medium resize-none"
                                    />
                                </div>
                            </div>

                            {/* Save button */}
                            <div className="pt-4 mt-4 border-t border-border-color/60 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => handleSaveMember(pref)}
                                    disabled={isSaving}
                                    className="beheer-button inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {isSaving ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Save className="h-3.5 w-3.5" />
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
