'use client';

import { useState, useTransition } from 'react';
import { Check, Save, Trash2, Key, Loader2, Shield } from 'lucide-react';
import { setImpersonateToken, clearImpersonateToken } from '@/server/actions/impersonation.actions';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';

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
                if (result && result.success) {
                    setStatus('success');
                    setToken('');
                    showToast('Test modus succesvol geactiveerd', 'success');
                    setTimeout(() => {
                        setStatus('idle');
                        window.location.reload();
                    }, 1000);
                } else {
                    setStatus('error');
                    showToast(result?.error || 'Ongeldige token of fout bij valideren.', 'error');
                }
            } catch {
                setStatus('error');
                showToast('Er is een onverwachte fout opgetreden.', 'error');
            }
        });
    };

    const handleClear = () => {
        startTransition(async () => {
            await clearImpersonateToken();
            showToast('Test modus gedeactiveerd', 'info');
            setStatus('idle');
            setTimeout(() => window.location.reload(), 1000);
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
                        <div className="flex items-center gap-4 bg-[var(--beheer-card-soft)] px-4 py-2 rounded-2xl border border-[var(--beheer-border)]/50 shadow-sm">
                            <div className="flex flex-col items-center px-2">
                                <span className="text-[10px] font-semibold text-[var(--beheer-text-muted)] leading-none mb-1 text-center">Status</span>
                                <span className={`text-sm font-bold leading-none ${activeToken ? 'text-[var(--beheer-active)]' : 'text-[var(--beheer-text)]'}`}>
                                    {activeToken ? 'Testen' : 'Normaal'}
                                </span>
                            </div>
                            <div className="w-px h-6 bg-[var(--beheer-border)]/20" />
                            <div className="flex flex-col items-center px-2">
                                <span className="text-[10px] font-semibold text-[var(--beheer-text-muted)] leading-none mb-1 text-center">Doel</span>
                                <span className="text-sm font-bold text-[var(--beheer-text)] leading-none">{impersonatedName || 'Zelf'}</span>
                            </div>
                            <div className="w-px h-6 bg-[var(--beheer-border)]/20" />
                            <div className="flex flex-col items-center px-2">
                                <span className="text-[10px] font-semibold text-[var(--beheer-text-muted)] leading-none mb-1 text-center">Rechten</span>
                                <span className="text-sm font-bold text-[var(--beheer-text)] leading-none">{impersonatedCommittees?.length || 0}</span>
                            </div>
                            <div className="w-px h-6 bg-[var(--beheer-border)]/20 hidden sm:block" />
                            <div className="flex-col items-center px-2 hidden sm:flex">
                                <span className="text-[10px] font-semibold text-[var(--beheer-text-muted)] leading-none mb-1 text-center">Beveiliging</span>
                                <span className={`text-sm font-bold leading-none ${activeToken ? 'text-[var(--beheer-inactive)]' : 'text-[var(--beheer-text)]'}`}>
                                    {activeToken ? 'Override' : 'Secure'}
                                </span>
                            </div>
                        </div>

                        {activeToken && (
                            <button
                                onClick={handleClear}
                                disabled={isPending}
                                className="flex items-center gap-2 px-4 py-2 bg-[var(--beheer-inactive)]/10 text-[var(--beheer-inactive)] border border-[var(--beheer-inactive)]/20 rounded-[var(--beheer-radius)] text-xs font-semibold hover:bg-[var(--beheer-inactive)] hover:text-white transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                            >
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                <span className="hidden md:inline">Stop Testen</span>
                            </button>
                        )}
                    </div>
                }
            />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Active Status Box */}
                {activeToken && (
                    <div className="p-8 rounded-[var(--beheer-radius)] bg-[var(--beheer-accent)]/5 border border-[var(--beheer-accent)]/20 shadow-sm mb-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h3 className="text-xs font-semibold text-[var(--beheer-accent)] mb-2 flex items-center gap-2">
                                    <Shield className="h-3.5 w-3.5" />
                                    Actieve Sessie
                                </h3>
                                <p className="text-sm font-semibold text-[var(--beheer-text)] mb-4">
                                    Je navigeert nu over de website met de rechten van <span className="text-[var(--beheer-accent)]">{impersonatedName}</span>.
                                </p>
                                
                                {impersonatedCommittees.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {impersonatedCommittees.map(c => (
                                            <span key={c} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[var(--beheer-accent)]/10 text-[var(--beheer-accent)] border border-[var(--beheer-accent)]/10">
                                                {c}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                
                                <div className="flex items-center gap-2 font-mono text-[10px] bg-[var(--beheer-card-soft)] p-2.5 rounded-xl text-[var(--beheer-text-muted)] border border-[var(--beheer-border)] w-fit">
                                    <Key className="h-3 w-3" />
                                    <span>{activeToken.substring(0, 12)}...{activeToken.substring(activeToken.length - 12)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Token Input Form */}
                {!activeToken && (
                    <div className="max-w-xl space-y-6">
                        <div>
                            <label className="block text-xs font-semibold text-[var(--beheer-text-muted)] mb-3 ml-1">
                                Directus Statische Token
                            </label>
                            <div className="relative group">
                                <input
                                    type="password"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    placeholder="Plak hier de token..."
                                    className={`w-full bg-[var(--beheer-card-bg)] border rounded-[var(--beheer-radius)] px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] text-[var(--beheer-text)] font-semibold placeholder:text-[var(--beheer-text-muted)] focus:outline-none focus:ring-2 transition-all ${status === 'error' ? 'border-[var(--beheer-inactive)]/50 focus:ring-[var(--beheer-inactive)]/20' : 'border-[var(--beheer-border)] focus:ring-[var(--beheer-accent)]/20 focus:border-[var(--beheer-accent)]'}`}
                                    disabled={isPending}
                                    autoComplete="off"
                                    suppressHydrationWarning
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={!token || isPending}
                            className="w-full py-[var(--beheer-btn-py)] rounded-[var(--beheer-radius)] bg-[var(--beheer-accent)] text-white font-semibold text-sm shadow-[var(--shadow-glow)] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {isPending ? (
                                <><Loader2 className="h-5 w-5 animate-spin" /> Controleren...</>
                            ) : status === 'success' ? (
                                <><Check className="h-5 w-5" /> Token Actief!</>
                            ) : (
                                <><Save className="h-5 w-5" /> Start Testen</>
                            )}
                        </button>
                        
                        {/* Instructies */}
                        <div className="p-8 rounded-[var(--beheer-radius)] bg-[var(--beheer-card-soft)] border border-[var(--beheer-border)]">
                            <h3 className="text-xs font-semibold text-[var(--beheer-text)] mb-4 flex items-center gap-2">
                                <Shield className="h-3.5 w-3.5 text-[var(--beheer-accent)]" />
                                Hoe werkt het?
                            </h3>
                            <ul className="text-xs text-[var(--beheer-text-muted)] space-y-3 font-semibold">
                                <li className="flex gap-3"><span className="text-[var(--beheer-accent)]">•</span> Ga naar Directus &gt; User Settings &gt; Token.</li>
                                <li className="flex gap-3"><span className="text-[var(--beheer-accent)]">•</span> Kopieer de statische token van de user die je wilt testen.</li>
                                <li className="flex gap-3"><span className="text-[var(--beheer-accent)]">•</span> Plak deze hierboven en klik op 'Start Testen'.</li>
                                <li className="flex gap-3 text-[var(--beheer-inactive)] opacity-80"><span className="text-[var(--beheer-inactive)] font-semibold italic">!</span> Dit overschrijft tijdelijk je eigen rechten in de datalaag.</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
            <AdminToast toast={toast} onClose={hideToast} />
        </>
    );
}
