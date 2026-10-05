'use client';

import { useState, useTransition } from 'react';
import { Check, Save, Trash, Key, Loader2, Shield } from 'lucide-react';
import { setImpersonateToken, clearImpersonateToken } from '@/server/actions/beheer/impersonation/beheer-impersonation.actions';
import BeheerToolbar from '@/components/ui/beheer/BeheerToolbar';
import BeheerToast from '@/components/ui/beheer/BeheerToast';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import { safeConsoleError } from '@/server/utils/logger';

interface Props {
    activeToken: string | null;
    impersonatedName: string | null;
    impersonatedCommittees: string[];
}

export default function ImpersonateIsland({ activeToken, impersonatedName, impersonatedCommittees }: Props) {
    const { toast, showToast, hideToast } = useAdminToast();
    const [token, setToken] = useState('');
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [isPending, startTransition] = useTransition();

    const handleSave = () => {
        if (!token || isPending) return;
        setStatus('idle');

        startTransition(async () => {
            try {
                const result = await setImpersonateToken(token);
                if (result.success) {
                    setStatus('success');
                    setToken('');
                    showToast('Test modus succesvol geactiveerd', 'success');
                    setTimeout(() => {
                        setStatus('idle');
                        window.location.reload();
                    }, 1000);
                } else {
                    setStatus('error');
                    showToast(result.error || 'Ongeldige token of fout bij valideren.', 'error');
                }
            } catch (error) {
                safeConsoleError('[ImpersonateIsland.tsx][ImpersonateIsland] ', error);
                setStatus('error');
                showToast('Er is een onverwachte fout opgetreden.', 'error');
            }
        });
    };

    const handleClear = () => {
        startTransition(async () => {
            try {
                await clearImpersonateToken();
                showToast('Test modus gedeactiveerd', 'info');
                setStatus('idle');
                setTimeout(() => window.location.reload(), 1000);
            } catch (error) {
                safeConsoleError('[ImpersonateIsland.tsx][ImpersonateIsland] ', error);
                showToast('Er is een onverwachte fout opgetreden.', 'error');
            }
        });
    };

    return (
        <>
            <BeheerToolbar
                title="Test Modus"
                backHref="/beheer"
                actions={
                    <div className="flex items-center gap-3">
                        <div className="beheer-stat-strip">
                            <div className="flex flex-col items-center px-2">
                                <span className="form-label-muted">Status</span>
                                <span className={`text-sm font-bold ${activeToken ? 'text-(--beheer-active)' : 'text-(--beheer-text)'}`}>
                                    {activeToken ? 'Testen' : 'Normaal'}
                                </span>
                            </div>
                            <div className="h-6 w-px bg-(--beheer-border)/20" />
                            <div className="flex flex-col items-center px-2">
                                <span className="form-label-muted">Doel</span>
                                <span className="text-sm font-bold text-(--beheer-text)">{impersonatedName || 'Zelf'}</span>
                            </div>
                            <div className="h-6 w-px bg-(--beheer-border)/20" />
                            <div className="flex flex-col items-center px-2">
                                <span className="form-label-muted">Rechten</span>
                                <span className="text-sm font-bold text-(--beheer-text)">{impersonatedCommittees.length}</span>
                            </div>
                            <div className="v-divider-sm" />
                            <div className="stat-col-hidden">
                                <span className="form-label-muted">Beveiliging</span>
                                <span className={`text-sm font-bold ${activeToken ? 'text-(--beheer-inactive)' : 'text-(--beheer-text)'}`}>
                                    {activeToken ? 'Override' : 'Secure'}
                                </span>
                            </div>
                        </div>

                        {activeToken && (
                            <button
                                onClick={handleClear}
                                disabled={isPending}
                                className="btn-secondary"
                                type="button">
                                {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash className="size-4" />}
                                <span className="hidden md:inline">Stop Testen</span>
                            </button>
                        )}
                    </div>
                }
            />

            <div className="beheer-container py-8">
                {activeToken && (
                    <div className="beheer-accent-banner">
                        <div className="page-header-row">
                            <div>
                                <h3 className="mb-2 section-title-sm text-(--beheer-accent)">
                                    <Shield className="size-3.5" />
                                    Actieve Sessie
                                </h3>
                                <p className="mb-4 text-sm font-semibold text-(--beheer-text)">
                                    Je navigeert nu over de website met de rechten van <span className="text-(--beheer-accent)">{impersonatedName}</span>.
                                </p>

                                {impersonatedCommittees.length > 0 && (
                                    <div className="mb-4 flex flex-wrap gap-2">
                                        {impersonatedCommittees.map(c => (
                                            <span key={c} className="badge-primary">
                                                {c}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className="key-badge-mono">
                                    <Key className="size-3" />
                                    <span>{activeToken.substring(0, 12)}...{activeToken.substring(activeToken.length - 12)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {!activeToken && (
                    <div className="max-w-xl space-y-6">
                        <div>
                            <label className="mb-3 block form-label-muted">
                                Directus Statische Token
                            </label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    placeholder="Plak hier de token..."
                                    className="beheer-input"
                                    disabled={isPending}
                                    autoComplete="off"
                                    suppressHydrationWarning
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={!token || isPending}
                            className="form-button w-full"
                            type="button">
                            {isPending ? (
                                <><Loader2 className="size-5 animate-spin" /> Controleren...</>
                            ) : status === 'success' ? (
                                <><Check className="size-5" /> Token Actief!</>
                            ) : (
                                <><Save className="size-5" /> Start Testen</>
                            )}
                        </button>

                        <div className="beheer-info-box">
                            <h3 className="mb-4 section-title-sm">
                                <Shield className="size-3.5 text-(--beheer-accent)" />
                                Hoe werkt het?
                            </h3>
                            <ul className="space-y-3 text-sm font-semibold text-(--beheer-text-muted)">
                                <li className="flex gap-3"><span className="text-(--beheer-accent)">•</span> Ga naar Directus &gt; User Settings &gt; Token.</li>
                                <li className="flex gap-3"><span className="text-(--beheer-accent)">•</span> Kopieer de statische token van de user die je wilt testen.</li>
                                <li className="flex gap-3"><span className="text-(--beheer-accent)">•</span> Plak deze hierboven i.p.v. de placeholder.</li>
                                <li className="flex gap-3 opacity-80"><span className="font-semibold italic">•</span> Dit overschrijft tijdelijk je eigen rechten in de datalaag.</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
            <BeheerToast toast={toast} onClose={hideToast} />
        </>
    );
}