'use client';

import { useState, useTransition } from 'react';
import { Check, Save, Trash, Key, Loader2, Shield } from 'lucide-react';
import { setImpersonateToken, clearImpersonateToken } from '@/server/actions/admin/admin-impersonation.actions';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
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
            <AdminToolbar
                title="Test Modus"
                backHref="/beheer"
                actions={
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-4 rounded-2xl border border-(--beheer-border)/50 bg-(--beheer-card-soft) px-4 py-2 shadow-sm">
                            <div className="flex flex-col items-center px-2">
                                <span className="mb-1 text-center text-[10px] leading-none font-semibold text-(--beheer-text-muted)">Status</span>
                                <span className={`text-base leading-none font-bold ${activeToken ? 'text-(--beheer-active)' : 'text-(--beheer-text)'}`}>
                                    {activeToken ? 'Testen' : 'Normaal'}
                                </span>
                            </div>
                            <div className="h-6 w-px bg-(--beheer-border)/20" />
                            <div className="flex flex-col items-center px-2">
                                <span className="mb-1 text-center text-[10px] leading-none font-semibold text-(--beheer-text-muted)">Doel</span>
                                <span className="text-base leading-none font-bold text-(--beheer-text)">{impersonatedName || 'Zelf'}</span>
                            </div>
                            <div className="h-6 w-px bg-(--beheer-border)/20" />
                            <div className="flex flex-col items-center px-2">
                                <span className="mb-1 text-center text-[10px] leading-none font-semibold text-(--beheer-text-muted)">Rechten</span>
                                <span className="text-base leading-none font-bold text-(--beheer-text)">{impersonatedCommittees.length}</span>
                            </div>
                            <div className="hidden h-6 w-px bg-(--beheer-border)/20 sm:block" />
                            <div className="hidden flex-col items-center px-2 sm:flex">
                                <span className="mb-1 text-center text-[10px] leading-none font-semibold text-(--beheer-text-muted)">Beveiliging</span>
                                <span className={`text-base leading-none font-bold ${activeToken ? 'text-(--beheer-inactive)' : 'text-(--beheer-text)'}`}>
                                    {activeToken ? 'Override' : 'Secure'}
                                </span>
                            </div>
                        </div>

                        {activeToken && (
                            <button
                                onClick={handleClear}
                                disabled={isPending}
                                className="beheer-button flex items-center gap-2 rounded-(--beheer-radius) border border-(--beheer-inactive)/20 bg-(--beheer-inactive)/10 px-4 py-2 text-base font-semibold text-(--beheer-inactive) shadow-sm transition-all hover:bg-(--beheer-inactive) hover:text-white active:scale-95 disabled:opacity-50"
                            >
                                {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash className="size-4" />}
                                <span className="hidden md:inline">Stop Testen</span>
                            </button>
                        )}
                    </div>
                }
            />

            <div className="container mx-auto max-w-7xl px-4 py-8">
                {activeToken && (
                    <div className="mb-8 rounded-(--beheer-radius) border border-(--beheer-accent)/20 bg-(--beheer-accent)/5 p-8 shadow-sm">
                        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                            <div>
                                <h3 className="mb-2 flex items-center gap-2 text-base font-semibold text-(--beheer-accent)">
                                    <Shield className="size-3.5" />
                                    Actieve Sessie
                                </h3>
                                <p className="mb-4 text-base font-semibold text-(--beheer-text)">
                                    Je navigeert nu over de website met de rechten van <span className="text-(--beheer-accent)">{impersonatedName}</span>.
                                </p>

                                {impersonatedCommittees.length > 0 && (
                                    <div className="mb-4 flex flex-wrap gap-2">
                                        {impersonatedCommittees.map(c => (
                                            <span key={c} className="rounded-lg border border-(--beheer-accent)/10 bg-(--beheer-accent)/10 px-2.5 py-1 text-base font-semibold text-(--beheer-accent)">
                                                {c}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className="flex w-fit items-center gap-2 rounded-xl border border-(--beheer-border) bg-(--beheer-card-soft) p-2.5 font-mono text-base text-(--beheer-text-muted)">
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
                            <label className="mb-3 ml-1 block text-base font-semibold text-(--beheer-text-muted)">
                                Directus Statische Token
                            </label>
                            <div className="group relative">
                                <input
                                    type="password"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    placeholder="Plak hier de token..."
                                    className={`beheer-input w-full rounded-(--beheer-radius) border bg-(--beheer-card-bg) px-(--beheer-btn-px) py-(--beheer-btn-py) font-semibold text-(--beheer-text) transition-all placeholder:text-(--beheer-text-muted) focus:ring-2 focus:outline-none ${status === 'error' ? 'border-(--beheer-inactive)/50 focus:ring-(--beheer-inactive)/20' : 'border-(--beheer-border) focus:border-(--beheer-accent) focus:ring-(--beheer-accent)/20'}`}
                                    disabled={isPending}
                                    autoComplete="off"
                                    suppressHydrationWarning
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={!token || isPending}
                            className="active:scale-0.98 flex w-full items-center justify-center gap-3 rounded-(--beheer-radius) bg-(--beheer-accent) py-(--beheer-btn-py) text-base font-semibold text-white shadow-(--shadow-glow) transition-all hover:opacity-90 disabled:opacity-50"
                        >
                            {isPending ? (
                                <><Loader2 className="size-5 animate-spin" /> Controleren...</>
                            ) : status === 'success' ? (
                                <><Check className="size-5" /> Token Actief!</>
                            ) : (
                                <><Save className="size-5" /> Start Testen</>
                            )}
                        </button>

                        <div className="rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-soft) p-8">
                            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-(--beheer-text)">
                                <Shield className="size-3.5 text-(--beheer-accent)" />
                                Hoe werkt het?
                            </h3>
                            <ul className="space-y-3 text-base font-semibold text-(--beheer-text-muted)">
                                <li className="flex gap-3"><span className="text-(--beheer-accent)">•</span> Ga naar Directus &gt; User Settings &gt; Token.</li>
                                <li className="flex gap-3"><span className="text-(--beheer-accent)">•</span> Kopieer de statische token van de user die je wilt testen.</li>
                                <li className="flex gap-3"><span className="text-(--beheer-accent)">•</span> Plak deze hierboven i.p.v. de placeholder.</li>
                                <li className="flex gap-3 text-(--beheer-inactive) opacity-80"><span className="font-semibold text-(--beheer-inactive) italic">!</span> Dit overschrijft tijdelijk je eigen rechten in de datalaag.</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
            <AdminToast toast={toast} onClose={hideToast} />
        </>
    );
}