'use client';

import { useState, useEffect } from 'react';
import { Shield, Check, Save, Trash2, ArrowLeft, Key } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePagePermission } from '@/shared/lib/hooks/usePermissions';
const TEST_TOKEN_COOKIE = 'directus_test_token';

export default function ImpersonatePage() {
    const router = useRouter();
    const [token, setToken] = useState('');
    const [activeToken, setActiveToken] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const { isAuthorized, isLoading } = usePagePermission('admin_impersonate', ['ictcommissie', 'bestuur', 'ict']);

    useEffect(() => {
        if (!isLoading && isAuthorized === false && !activeToken) {
            // Not authorized and not currently impersonating: redirect back
            router.push('/admin');
        }
    }, [isAuthorized, isLoading, router, activeToken]);

    useEffect(() => {
        // Read existing cookie
        const cookies = document.cookie.split(';');
        const testToken = cookies.find(c => c.trim().startsWith('directus_test_token='));
        if (testToken) {
            setActiveToken(testToken.split('=')[1]);
        }
    }, []);

    const handleSave = () => {
        if (!token) return;

        // Set cookie for 7 days
        const expires = new Date();
        expires.setDate(expires.getDate() + 7);
        // Important: lax samesite and no HttpOnly because we need to read it on the client to show the UI
        document.cookie = `${TEST_TOKEN_COOKIE}=${token}; path=/; expires=${expires.toUTCString()}; samesite=lax`;

        setActiveToken(token);
        setStatus('success');
        setToken('');

        setTimeout(() => setStatus('idle'), 3000);
    };

    const handleClear = () => {
        document.cookie = 'directus_test_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax';
        setActiveToken(null);
        setStatus('idle');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-theme-purple/20 border-t-theme-purple" />
            </div>
        );
    }

    if (!isAuthorized) return null;

    return (
        <main className="min-h-screen bg-[var(--bg-main)] p-4 sm:p-8">
            <div className="mx-auto max-w-2xl">
                <button
                    onClick={() => router.push('/admin')}
                    className="mb-8 flex items-center gap-2 text-theme-purple-lighter/60 hover:text-theme-purple transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Terug naar Dashboard
                </button>

                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-theme-gradient-start to-theme-gradient-end shadow-2xl border border-white/5">
                    {/* Decorative Blurs */}
                    <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-theme-purple/10 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-blue-500/5 blur-3xl" />

                    <div className="relative p-8">
                        <header className="mb-8">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="rounded-2xl bg-theme-purple/20 p-3 text-theme-purple-lighter">
                                    <Shield className="w-8 h-8" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-white tracking-tight">Test Modus</h1>
                                    <p className="text-theme-purple-lighter/60">Imiteer een andere gebruiker</p>
                                </div>
                            </div>
                        </header>

                        <div className="space-y-8">
                            {/* Active Status */}
                            <div className={`p-6 rounded-2xl border transition-all duration-500 ${activeToken ? 'bg-green-500/10 border-green-500/20' : 'bg-white/5 border-white/10'}`}>
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                                            Status: {activeToken ? (
                                                <span className="text-green-400">Actief</span>
                                            ) : (
                                                <span className="text-theme-purple-lighter/40">Inactief</span>
                                            )}
                                        </h2>
                                        <p className="text-sm text-theme-purple-lighter/70">
                                            {activeToken
                                                ? 'De website gebruikt nu jouw ingevoerde token voor alle Directus-verzoeken.'
                                                : 'Voer hieronder een Directus Statische Token in om de website te bekijken als die gebruiker.'}
                                        </p>
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
                                            className="flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Stop Testen
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Token Input Section */}
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
                                            className="w-full bg-black/30 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-theme-purple/50 focus:border-theme-purple/50 transition-all"
                                        />
                                    </div>
                                    <button
                                        onClick={handleSave}
                                        disabled={!token}
                                        className="w-full py-4 rounded-2xl bg-theme-purple text-white font-bold text-lg shadow-xl shadow-theme-purple/20 hover:bg-theme-purple-dark hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {status === 'success' ? (
                                            <>
                                                <Check className="w-5 h-5" />
                                                Token Opgeslagen!
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-5 h-5" />
                                                Start Testen
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* Instructions */}
                            <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-theme-purple" />
                                    Hoe werkt het?
                                </h3>
                                <ul className="text-sm text-theme-purple-lighter/60 space-y-2">
                                    <li className="flex gap-2">
                                        <span className="text-theme-purple font-bold">•</span>
                                        Ga naar Directus &gt; User Settings &gt; Token.
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-theme-purple font-bold">•</span>
                                        Kopieer de statische token van de user die je wilt testen.
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-theme-purple font-bold">•</span>
                                        Plak deze hierboven en klik op 'Start Testen'.
                                    </li>
                                    <li className="flex gap-2 text-orange-400/80">
                                        <span className="text-orange-400 font-bold">•</span>
                                        Let op: Dit omzeilt de browser-login. Wis cookies om terug te keren.
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
