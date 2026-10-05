'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { type CoboBoardPreference } from '@salvemundi/validations';
import { updateBoardPreferenceAction } from '@/server/actions/beheer/cobo/beheer-cobo-management.actions';
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
            <div className="card-empty-state-container">
                <Shield className="icon-purple-centered-lg" />
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
                    <h3 className="text-lg font-black text-theme-purple">
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
                            className="card-preference-box"
                        >
                            <div className="space-y-4">
                                <div className="card-header-bordered">
                                    <div className="avatar-squircle-lg">
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
                                        <span className="badge-primary">
                                            {pref.user?.functie || 'Bestuurslid'}
                                        </span>
                                    </div>
                                </div>

                                {/* Alcohol switch */}
                                <div className="beheer-row-card">
                                    <div className="flex items-center gap-2.5">
                                        <Wine data-status={pref.drinks_alcohol ? 'success' : 'muted'} className="status-icon" />
                                        <span className="text-xs font-semibold text-text-main">Drinkt Alcohol</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleToggleAlcohol(pref)}
                                        aria-label="Toggle alcoholconsumptie"
                                        data-active={pref.drinks_alcohol}
                                        className="btn-toggle-switch"
                                    >
                                        <span
                                            data-active={pref.drinks_alcohol}
                                            className="visibility-toggle-thumb"
                                        />
                                    </button>
                                </div>

                                {/* Veto's input */}
                                <div>
                                    <label className="form-label-icon">
                                        <Ban data-status="error" className="status-icon" />
                                        <span>Veto&apos;s</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={pref.vetoes || ''}
                                        onChange={(e) => handleFieldChange(userId, 'vetoes', e.target.value)}
                                        placeholder="Bijv. Tequila, Sambuca, melkproducten..."
                                        className="beheer-input"
                                    />
                                </div>

                                {/* Dietary Requirements */}
                                <div>
                                    <label className="form-label-icon">
                                        <Utensils data-status="warning" className="status-icon" />
                                        <span>Allergieën</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={pref.dietary_requirements || ''}
                                        onChange={(e) => handleFieldChange(userId, 'dietary_requirements', e.target.value)}
                                        placeholder="Bijv. Notenallergie, Glutenintolerantie, Vegan..."
                                        className="beheer-input"
                                    />
                                </div>

                                {/* Notes */}
                                <div>
                                    <label className="form-label-icon">
                                        <FileText data-status="info" className="status-icon" />
                                        <span>Extra Opmerkingen</span>
                                    </label>
                                    <textarea
                                        value={pref.notes || ''}
                                        onChange={(e) => handleFieldChange(userId, 'notes', e.target.value)}
                                        rows={2}
                                        placeholder="Bijzonderheden of instructies voor Team CoBo..."
                                        className="beheer-input resize-none"
                                    />
                                </div>
                            </div>

                            {/* Save button */}
                            <div className="card-footer-right">
                                <button
                                    type="button"
                                    onClick={() => handleSaveMember(pref)}
                                    disabled={isSaving}
                                    className="beheer-button"
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
