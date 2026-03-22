'use client';

import { useState, useTransition } from 'react';
import { Check, Save, Trash2, Key, Loader2, AlertCircle } from 'lucide-react';
import { setImpersonateToken, clearImpersonateToken } from '@/server/actions/admin.actions';

interface Props {
    activeToken: string | null;
    impersonatedName: string | null;
    impersonatedCommittees: string[];
}

export default function ImpersonateIsland({ activeToken, impersonatedName, impersonatedCommittees }: Props) {
    const [token, setToken] = useState('');
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [isPending, startTransition] = useTransition();

    const handleSave = () => {
        if (!token) return;
        setErrorMessage('');
        startTransition(async () => {
            const result = await setImpersonateToken(token);
            if (result && result.success) {
                setStatus('success');
                setToken('');
                setTimeout(() => setStatus('idle'), 3000);
            } else {
                setStatus('error');
                setErrorMessage(result?.error || 'Er ging iets mis met valideren.');
                setTimeout(() => setStatus('idle'), 4000);
            }
        });
    };

    const handleClear = () => {
        startTransition(async () => {
            await clearImpersonateToken();
            setStatus('idle');
        });
    };

    return (
        <div className="space-y-8">
            {/* Active Status Box */}
            <div className={`p-6 rounded-2xl border transition-all duration-500 ${activeToken ? 'bg-green-500/10 border-green-500/20' : 'bg-white/5 border-white/10'}`}>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                            Status: {activeToken ? (
                                <span className="text-green-400">Actief ({impersonatedName})</span>
                            ) : (
                                <span className="text-theme-purple-lighter/40">Inactief</span>
                            )}
                        </h2>
                        <p className="text-sm text-theme-purple-lighter/70">
                            {activeToken
                                ? `Je navigeert nu over de website met de rechten van ${impersonatedName}.`
                                : 'Voer hieronder een Directus Statische Token in om de website te bekijken als die gebruiker.'}
                        </p>
                        {activeToken && impersonatedCommittees.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {impersonatedCommittees.map(c => (
                                    <span key={c} className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md bg-green-500/20 text-green-400 border border-green-500/20">
                                        {c}
                                    </span>
                                ))}
                            </div>
                        )}
                        {activeToken && (
                            <div className="mt-4 flex items-center gap-2 font-mono text-xs bg-black/40 p-2 rounded-lg text-theme-purple-lighter/80">
                                <Key className="w-3 h-3" />
                                <span>{activeToken.substring(0, 10)}...{activeToken.substring(activeToken.length - 10)}</span>
                            </div>
                        )}
                    </div>
                    {activeToken && (
                        <button
                            onClick={handleClear}
                            disabled={isPending}
                            className="flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all disabled:opacity-50"
                        >
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            Stop Testen
                        </button>
                    )}
                </div>
            </div>

            {/* Token Input Form */}
            {!activeToken && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <label className="block text-sm font-medium text-theme-purple-lighter/80 ml-1">
                        Directus Statische Token
                    </label>
                    <div className="relative group">
                        <input
                            type="password"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder="Plak hier de token..."
                            className={`w-full bg-black/30 border rounded-2xl px-6 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 transition-all ${status === 'error' ? 'border-red-500/50 focus:ring-red-500/50' : 'border-white/10 focus:ring-theme-purple/50 focus:border-theme-purple/50'}`}
                            disabled={isPending}
                            autoComplete="off"
                            suppressHydrationWarning
                        />
                    </div>

                    {status === 'error' && (
                        <div className="flex items-center gap-2 text-red-400 text-sm ml-1 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="w-4 h-4" />
                            {errorMessage}
                        </div>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={!token || isPending}
                        className="w-full py-4 rounded-2xl bg-theme-purple text-white font-bold text-lg shadow-xl shadow-theme-purple/20 hover:bg-theme-purple-dark hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isPending ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Bezig met valideren...</>
                        ) : status === 'success' ? (
                            <><Check className="w-5 h-5" /> Token Geaccepteerd!</>
                        ) : (
                            <><Save className="w-5 h-5" /> Start Testen</>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}