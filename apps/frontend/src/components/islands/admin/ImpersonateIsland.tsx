'use client';

import { useState, useTransition } from 'react';
import { Check, Save, Trash2, Key, Loader2, Shield, User, Lock, Activity } from 'lucide-react';
import { setImpersonateToken, clearImpersonateToken } from '@/server/actions/admin.actions';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import AdminStatsBar from '@/components/ui/admin/AdminStatsBar';
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
                    setTimeout(() => setStatus('idle'), 3000);
                } else {
                    setStatus('error');
                    showToast(result?.error || 'Ongeldige token of fout bij valideren.', 'error');
                }
            } catch (err) {
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
        });
    };

    const adminStats = [
        { label: 'Status', value: activeToken ? 'Testen' : 'Normaal', icon: Activity, trend: activeToken ? 'Impersonating' : 'Direct Access' },
        { label: 'Doel', value: impersonatedName || 'Zelf', icon: User, trend: 'Identity' },
        { label: 'Rechten', value: impersonatedCommittees?.length || 0, icon: Shield, trend: 'Committees' },
        { label: 'Beveiliging', value: activeToken ? 'Override' : 'Secure', icon: Lock, trend: 'Layer' },
    ];

    return (
        <>
            <AdminToolbar 
                title="Test Modus"
                subtitle="Imiteer een andere gebruiker"
                backHref="/beheer"
                actions={
                    activeToken ? (
                        <button
                            onClick={handleClear}
                            disabled={isPending}
                            className="flex items-center gap-2 px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] bg-[var(--beheer-inactive)]/10 text-[var(--beheer-inactive)] border border-[var(--beheer-inactive)]/20 rounded-[var(--beheer-radius)] text-xs font-black uppercase tracking-widest hover:bg-[var(--beheer-inactive)] hover:text-white transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            Stop Testen
                        </button>
                    ) : null
                }
            />

            <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-700">
                <AdminStatsBar stats={adminStats} />

                {/* Active Status Box */}
                {activeToken && (
                    <div className="p-8 rounded-[var(--beheer-radius)] bg-[var(--beheer-accent)]/5 border border-[var(--beheer-accent)]/20 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-accent)] mb-2 flex items-center gap-2">
                                    <Shield className="h-3.5 w-3.5" />
                                    Actieve Sessie
                                </h3>
                                <p className="text-sm font-bold text-[var(--beheer-text)] mb-4">
                                    Je navigeert nu over de website met de rechten van <span className="text-[var(--beheer-accent)]">{impersonatedName}</span>.
                                </p>
                                
                                {impersonatedCommittees.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {impersonatedCommittees.map(c => (
                                            <span key={c} className="text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-lg bg-[var(--beheer-accent)]/10 text-[var(--beheer-accent)] border border-[var(--beheer-accent)]/10">
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
                    <div className="max-w-xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)] mb-3 ml-1">
                                Directus Statische Token
                            </label>
                            <div className="relative group">
                                <input
                                    type="password"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    placeholder="Plak hier de token..."
                                    className={`w-full bg-[var(--beheer-card-bg)] border rounded-2xl px-6 py-4 text-[var(--beheer-text)] font-semibold placeholder:text-[var(--beheer-text-muted)] focus:outline-none focus:ring-2 transition-all ${status === 'error' ? 'border-[var(--beheer-inactive)]/50 focus:ring-[var(--beheer-inactive)]/20' : 'border-[var(--beheer-border)] focus:ring-[var(--beheer-accent)]/20 focus:border-[var(--beheer-accent)]'}`}
                                    disabled={isPending}
                                    autoComplete="off"
                                    suppressHydrationWarning
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={!token || isPending}
                            className="w-full py-4 rounded-2xl bg-[var(--beheer-accent)] text-white font-black uppercase tracking-widest text-sm shadow-[var(--shadow-glow)] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
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
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text)] mb-4 flex items-center gap-2">
                                <Shield className="h-3.5 w-3.5 text-[var(--beheer-accent)]" />
                                Hoe werkt het?
                            </h3>
                            <ul className="text-xs text-[var(--beheer-text-muted)] space-y-3 font-bold">
                                <li className="flex gap-3"><span className="text-[var(--beheer-accent)]">•</span> Ga naar Directus &gt; User Settings &gt; Token.</li>
                                <li className="flex gap-3"><span className="text-[var(--beheer-accent)]">•</span> Kopieer de statische token van de user die je wilt testen.</li>
                                <li className="flex gap-3"><span className="text-[var(--beheer-accent)]">•</span> Plak deze hierboven en klik op 'Start Testen'.</li>
                                <li className="flex gap-3 text-[var(--beheer-inactive)] opacity-80"><span className="text-[var(--beheer-inactive)] font-black italic">!</span> Dit overschrijft tijdelijk je eigen rechten in de datalaag.</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
            <AdminToast toast={toast} onClose={hideToast} />
        </>
    );
}
