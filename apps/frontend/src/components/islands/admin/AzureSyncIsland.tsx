'use client';

import React, { useState } from 'react';
import { RefreshCw, User, CheckCircle, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { triggerFullSyncAction, triggerUserSyncAction } from '@/server/actions/azure-sync.actions';

export default function AzureSyncIsland() {
    const [isFullSyncLoading, setIsFullSyncLoading] = useState(false);
    const [isUserSyncLoading, setIsUserSyncLoading] = useState(false);
    const [userId, setUserId] = useState('');
    const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

    const handleFullSync = async () => {
        setIsFullSyncLoading(true);
        setStatus({ type: null, message: '' });
        
        try {
            const result = await triggerFullSyncAction();
            if (result.success) {
                setStatus({ type: 'success', message: result.message || 'Synchronisatie succesvol gestart.' });
            } else {
                setStatus({ type: 'error', message: result.error || 'Er is een fout opgetreden.' });
            }
        } catch (err) {
            setStatus({ type: 'error', message: 'Netwerkfout bij het starten van de sync.' });
        } finally {
            setIsFullSyncLoading(false);
        }
    };

    const handleUserSync = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId.trim()) return;

        setIsUserSyncLoading(true);
        setStatus({ type: null, message: '' });

        try {
            const result = await triggerUserSyncAction(userId.trim());
            if (result.success) {
                setStatus({ type: 'success', message: result.message || 'Gebruiker succesvol gesynchroniseerd.' });
                setUserId('');
            } else {
                setStatus({ type: 'error', message: result.error || 'Er is een fout opgetreden.' });
            }
        } catch (err) {
            setStatus({ type: 'error', message: 'Netwerkfout bij het synchroniseren van de gebruiker.' });
        } finally {
            setIsUserSyncLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Status Messages */}
            {status.type && (
                <div className={`flex items-center gap-3 p-4 rounded-2xl border ${status.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800 text-green-800 dark:text-green-200' : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800 text-red-800 dark:text-red-200'}`}>
                    {status.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    <p className="font-medium">{status.message}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Full Sync Card */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-2xl text-purple-600 dark:text-purple-400">
                            <RefreshCw className={`h-8 w-8 ${isFullSyncLoading ? 'animate-spin' : ''}`} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Volledige Synchronisatie</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Update alle leden en commissies vanaf Azure AD.</p>
                        </div>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                        Dit proces synchroniseert alle gebruikersgegevens, inclusief lidmaatschapsstatus, geboortedatums en commissie-rechten. 
                        Dit gebeurt op de achtergrond en kan enkele minuten duren voor alle leden.
                    </p>

                    <button
                        onClick={handleFullSync}
                        disabled={isFullSyncLoading}
                        className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-purple-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed group"
                    >
                        {isFullSyncLoading ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                            <>
                                <span>Nu uitvloeren</span>
                                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </div>

                {/* Individual User Sync Card */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-400">
                            <User className="h-8 w-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Individuele Focus</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Synchroniseer een specifiek lid direct.</p>
                        </div>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                        Handig voor het direct bijwerken van rechten voor een specifiek lid. Voer de Directus User ID in om de sync te forceren.
                    </p>

                    <form onSubmit={handleUserSync} className="space-y-4">
                        <div className="relative">
                            <input
                                type="text"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                placeholder="User UUID (bijv. d3a1b2...)"
                                className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:border-blue-500 transition-colors dark:text-white"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isUserSyncLoading || !userId.trim()}
                            className="w-full py-4 px-6 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isUserSyncLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <span>Gebruiker Bijwerken</span>}
                        </button>
                    </form>
                </div>
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-3xl border border-blue-100 dark:border-blue-900/30">
                <div className="flex gap-4">
                    <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <div className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
                        <p className="font-bold">Hoe werkt de sync?</p>
                        <p>
                            De Azure Sync service vergelijkt de groepen in Microsoft 365 met de commissies in Directus. 
                            Als een lid lid is van een groep in Azure, wordt hij automatisch toegevoegd aan de bijbehorende commissie in de portal. 
                            Tevens worden expiry dates van lidmaatschappen bijgewerkt.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
