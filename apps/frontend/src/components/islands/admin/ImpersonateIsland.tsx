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
                subtitle="Imiteer een andere gebruiker"
                backHref="/beheer"
                actions={
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-4 bg-(--beheer-card-soft) px-4 py-2 rounded-2xl border border-(--beheer-border)/50 shadow-sm">
                            <div className="flex flex-col items-center px-2">
                                <span className="text-[10px] font-semibold text-(--beheer-text-muted) leading-none mb-1 text-center">Status</span>
                                <span className={`text-base font-bold leading-none ${activeToken ? 'text-(--beheer-active)' : 'text-(--beheer-text)'}`}>
                                    {activeToken ? 'Testen' : 'Normaal'}
                                </span>
                            </div>
                            <div className="w-px h-6 bg-(--beheer-border)/20" />
                            <div className="flex flex-col items-center px-2">
                                <span className="text-[10px] font-semibold text-(--beheer-text-muted) leading-none mb-1 text-center">Doel</span>
                                <span className="text-base font-bold text-(--beheer-text) leading-none">{impersonatedName || 'Zelf'}</span>
                            </div>
                            <div className="w-px h-6 bg-(--beheer-border)/20" />
                            <div className="flex flex-col items-center px-2">
                                <span className="text-[10px] font-semibold text-(--beheer-text-muted) leading-none mb-1 text-center">Rechten</span>
                                <span className="text-base font-bold text-(--beheer-text) leading-none">{impersonatedCommittees.length}</span>
                            </div>
                            <div className="w-px h-6 bg-(--beheer-border)/20 hidden sm:block" />
                            <div className="flex-col items-center px-2 hidden sm:flex">
                                <span className="text-[10px] font-semibold text-(--beheer-text-muted) leading-none mb-1 text-center">Beveiliging</span>
                                <span className={`text-base font-bold leading-none ${activeToken ? 'text-(--beheer-inactive)' : 'text-(--beheer-text)'}`}>
                                    {activeToken ? 'Override' : 'Secure'}
                                </span>
                            </div>
                        </div>

                        {activeToken && (
                            <button
                                onClick={handleClear}
                                disabled={isPending}
                                className="flex items-center gap-2 px-4 py-2 bg-(--beheer-inactive)/10 text-(--beheer-inactive) border border-(--beheer-inactive)/20 rounded-(--beheer-radius) text-base font-semibold hover:bg-(--beheer-inactive) hover:text-white transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                            >
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4" />}
                                <span className="hidden md:inline">Stop Testen</span>
                            </button>
                        )}
                    </div>
                }
            />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {activeToken && (
                    <div className="p-8 rounded-(--beheer-radius) bg-(--beheer-accent)/5 border border-(--beheer-accent)/20 shadow-sm mb-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h3 className="text-base font-semibold text-(--beheer-accent) mb-2 flex items-center gap-2">
                                    <Shield className="h-3.5 w-3.5" />
                                    Actieve Sessie
                                </h3>
                                <p className="text-base font-semibold text-(--beheer-text) mb-4">
                                    Je navigeert nu over de website met de rechten van <span className="text-(--beheer-accent)">{impersonatedName}</span>.
                                </p>

                                {impersonatedCommittees.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {impersonatedCommittees.map(c => (
                                            <span key={c} className="text-base font-semibold px-2.5 py-1 rounded-lg bg-(--beheer-accent)/10 text-(--beheer-accent) border border-(--beheer-accent)/10">
                                                {c}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center gap-2 font-mono text-base bg-(--beheer-card-soft) p-2.5 rounded-xl text-(--beheer-text-muted) border border-(--beheer-border) w-fit">
                                    <Key className="h-3 w-3" />
                                    <span>{activeToken.substring(0, 12)}...{activeToken.substring(activeToken.length - 12)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {!activeToken && (
                    <div className="max-w-xl space-y-6">
                        <div>
                            <label className="block text-base font-semibold text-(--beheer-text-muted) mb-3 ml-1">
                                Directus Statische Token
                            </label>
                            <div className="relative group">
                                <input
                                    type="password"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    placeholder="Plak hier de token..."
                                    className={`w-full bg-(--beheer-card-bg) border rounded-(--beheer-radius) px-(--beheer-btn-px) py-(--beheer-btn-py) text-(--beheer-text) font-semibold placeholder:text-(--beheer-text-muted) focus:outline-none focus:ring-2 transition-all ${status === 'error' ? 'border-(--beheer-inactive)/50 focus:ring-(--beheer-inactive)/20' : 'border-(--beheer-border) focus:ring-(--beheer-accent)/20 focus:border-(--beheer-accent)'}`}
                                    disabled={isPending}
                                    autoComplete="off"
                                    suppressHydrationWarning
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={!token || isPending}
                            className="w-full py-(--beheer-btn-py) rounded-(--beheer-radius) bg-(--beheer-accent) text-white font-semibold text-base shadow-(--shadow-glow) hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {isPending ? (
                                <><Loader2 className="h-5 w-5 animate-spin" /> Controleren...</>
                            ) : status === 'success' ? (
                                <><Check className="h-5 w-5" /> Token Actief!</>
                            ) : (
                                <><Save className="h-5 w-5" /> Start Testen</>
                            )}
                        </button>

                        <div className="p-8 rounded-(--beheer-radius) bg-(--beheer-card-soft) border border-(--beheer-border)">
                            <h3 className="text-base font-semibold text-(--beheer-text) mb-4 flex items-center gap-2">
                                <Shield className="h-3.5 w-3.5 text-(--beheer-accent)" />
                                Hoe werkt het?
                            </h3>
                            <ul className="text-base text-(--beheer-text-muted) space-y-3 font-semibold">
                                <li className="flex gap-3"><span className="text-(--beheer-accent)">•</span> Ga naar Directus &gt; User Settings &gt; Token.</li>
                                <li className="flex gap-3"><span className="text-(--beheer-accent)">•</span> Kopieer de statische token van de user die je wilt testen.</li>
                                <li className="flex gap-3"><span className="text-(--beheer-accent)">•</span> Plak deze hierboven i.p.v. de placeholder.</li>
                                <li className="flex gap-3 text-(--beheer-inactive) opacity-80"><span className="text-(--beheer-inactive) font-semibold italic">!</span> Dit overschrijft tijdelijk je eigen rechten in de datalaag.</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
            <AdminToast toast={toast} onClose={hideToast} />
        </>
    );
}