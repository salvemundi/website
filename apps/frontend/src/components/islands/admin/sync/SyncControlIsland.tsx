'use client';

import React from 'react';
import { RefreshCw, X, Info } from 'lucide-react';
import { useSync } from './SyncContext';

export default function SyncControlIsland() {
    const {
        isStartingSync, isStopping, isResetting, isUserSyncLoading,
        selectedSyncFields, toggleField, forceLink, setForceLink,
        activeOnly, setActiveOnly, sendExpiryEmails, setSendExpiryEmails,
        convertUpn, setConvertUpn,
        handleFullSync, handleStopSync, handleResetSync,
        userId, setUserId, handleUserSync, syncFieldOptions, status
    } = useSync();

    const toggles = [
        { label: 'Forceer Entra Link', value: forceLink, setValue: setForceLink },
        { label: 'Alleen Actieve Leden', value: activeOnly, setValue: setActiveOnly },
        { label: 'Verstuur Expiratie E-mails', value: sendExpiryEmails, setValue: setSendExpiryEmails },
        { label: 'Automatische UPN Conversie', value: convertUpn, setValue: setConvertUpn }
    ];

    return (
        <div className="flex flex-col gap-6 mb-8">
            <div className="bg-(--beheer-card-bg) p-6 rounded-(--beheer-radius) border border-(--beheer-border) shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-2.5 bg-(--beheer-accent)/10 rounded-xl text-(--beheer-accent)">
                        <RefreshCw className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-(--beheer-text) tracking-tight">Volledige Sync</h3>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="text-xs font-semibold text-(--beheer-text-muted) mb-3 block">Velden om te synchroniseren</label>
                        <div className="flex flex-wrap gap-2">
                            {syncFieldOptions.map((field: { id: string; label: string }) => {
                                const isSelected = selectedSyncFields.includes(field.id);
                                return (
                                    <button
                                        key={field.id}
                                        onClick={() => toggleField(field.id)}
                                        className={`beheer-button px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                                            isSelected 
                                                ? 'bg-(--beheer-accent) text-white border-(--beheer-accent) shadow-sm' 
                                                : 'bg-(--beheer-card-bg) text-(--beheer-text-muted) border-(--beheer-border)/50 hover:border-(--beheer-accent)/30 hover:text-(--beheer-text)'
                                        }`}
                                    >
                                        {field.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 pt-4 border-t border-(--beheer-border)/50">
                        {toggles.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => item.setValue(!item.value)}
                                className={`beheer-button flex items-center justify-between p-3.5 rounded-xl border transition-all ${item.value ? 'border-(--beheer-accent) bg-(--beheer-card-soft)' : 'border-(--beheer-border) bg-(--beheer-card-bg) hover:border-(--beheer-accent)/30 group'}`}
                            >
                                <span className={`text-[11px] font-semibold transition-colors ${item.value ? 'text-(--beheer-text)' : 'text-(--beheer-text-muted) group-hover:text-(--beheer-text)'}`}>
                                    {item.label}
                                </span>
                                <div className={`h-4 w-8 rounded-full relative transition-all ${item.value ? 'bg-(--beheer-accent)' : 'bg-slate-300 dark:bg-slate-700'}`}>
                                    <div className={`absolute top-1 w-2 h-2 rounded-full bg-white transition-all ${item.value ? 'right-1' : 'left-1'}`} />
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="pt-4 flex flex-col gap-3">
                        {status?.active ? (
                            <>
                                <button
                                    onClick={() => { void handleStopSync(); }}
                                    disabled={isStopping || status.abortRequested}
                                    className="beheer-button w-full flex items-center justify-center gap-2 py-3.5 bg-(--beheer-inactive) text-white rounded-xl font-semibold text-xs shadow-md hover:scale-[1.01] active:scale-95 disabled:opacity-50 transition-all"
                                >
                                    <X className={`h-4 w-4 ${isStopping ? 'animate-spin' : ''}`} />
                                    {status.abortRequested ? 'Afbreken aangevraagd...' : 'Synchronisatie Stoppen'}
                                </button>
                                {status.abortRequested && (
                                    <button
                                        onClick={() => { void handleResetSync(); }}
                                        disabled={isResetting}
                                        className="beheer-button w-full flex items-center justify-center gap-2 py-2 text-[11px] text-(--beheer-inactive) font-semibold hover:underline disabled:opacity-50"
                                    >
                                        <RefreshCw className={`h-3 w-3 ${isResetting ? 'animate-spin' : ''}`} />
                                        Forceer Reset (Emergency)
                                    </button>
                                )}
                            </>
                        ) : (
                            <button
                                onClick={() => { void handleFullSync(); }}
                                disabled={isStartingSync || !!status?.error}
                                className="beheer-button w-full flex items-center justify-center gap-2 py-3.5 bg-(--beheer-accent) text-white rounded-xl font-semibold text-xs shadow-md hover:scale-[1.01] active:scale-95 disabled:opacity-50 transition-all"
                            >
                                <RefreshCw className={`h-4 w-4 ${isStartingSync ? 'animate-spin' : ''}`} />
                                Start Volledige Synchronisatie
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-(--beheer-card-bg) p-6 rounded-(--beheer-radius) border border-(--beheer-border) shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-2.5 bg-(--beheer-accent)/10 rounded-xl text-(--beheer-accent)">
                        <Info className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-(--beheer-text) tracking-tight">Specifieke Gebruiker</h3>
                </div>

                <p className="text-[11px] font-semibold text-(--beheer-text-muted) mb-6 leading-relaxed opacity-70">
                    Synchroniseer een specifieke gebruiker op basis van hun Entra ID (UUID).
                </p>

                <form onSubmit={(e) => { void handleUserSync(e); }} className="space-y-3">
                    <input
                        type="text"
                        value={userId}
                        autoComplete="off"
                        suppressHydrationWarning
                        onChange={(e) => setUserId(e.target.value)}
                        placeholder="Entra ID (UUID)..."
                        className="beheer-input w-full px-5 py-3.5 bg-(--beheer-card-soft) border border-(--beheer-border) rounded-xl text-xs font-semibold focus:outline-none focus:border-(--beheer-accent) transition-all placeholder:text-(--beheer-text-muted)/30 text-(--beheer-text)"
                    />
                    <button
                        type="submit"
                        disabled={isUserSyncLoading || !userId.trim() || !!status?.error}
                        className="beheer-button w-full flex items-center justify-center gap-2 py-3.5 bg-(--beheer-card-soft) text-(--beheer-text) border border-(--beheer-border) rounded-xl font-semibold text-xs hover:border-(--beheer-accent) hover:text-(--beheer-accent) transition-all disabled:opacity-50 active:scale-95"
                    >
                        <RefreshCw className={`h-4 w-4 ${isUserSyncLoading ? 'animate-spin' : ''}`} />
                        Sync Gebruiker
                    </button>
                </form>
            </div>
        </div>
    );
}