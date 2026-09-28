'use client';

import React from 'react';
import { RefreshCw, X, Info } from 'lucide-react';
import { useSync } from './SyncContext';

export default function SyncControlIsland() {
    const {
        isStartingSync, isStopping, isResetting, isUserSyncLoading,
        selectedSyncFields, toggleField, forceLink, setForceLink,
        activeOnly, setActiveOnly, sendExpiryEmails, setSendExpiryEmails,
        convertUpn, setConvertUpn, ignoreGracePeriod, setIgnoreGracePeriod,
        handleFullSync, handleStopSync, handleResetSync,
        userId, setUserId, handleUserSync, syncFieldOptions, status
    } = useSync();

    const isBusy = isStartingSync || isStopping || isResetting || isUserSyncLoading;

    const toggles = [
        { label: 'Forceer Entra Link', value: forceLink, setValue: setForceLink },
        { label: 'Alleen Actieve Leden', value: activeOnly, setValue: setActiveOnly },
        { label: 'Verstuur Expiratie E-mails', value: sendExpiryEmails, setValue: setSendExpiryEmails },
        { label: 'Automatische UPN Conversie', value: convertUpn, setValue: setConvertUpn },
        { label: 'Negeer 14-Dagen Gratieperiode (Direct Verwijderen)', value: ignoreGracePeriod, setValue: setIgnoreGracePeriod }
    ];

    return (
        <div className={`mb-8 flex flex-col gap-6 ${isBusy ? 'pointer-events-none opacity-70' : ''}`}>
            <div className="rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-4">
                    <div className="rounded-xl bg-(--beheer-accent)/10 p-2.5 text-(--beheer-accent)">
                        <RefreshCw className="size-5" />
                    </div>
                    <h3 className="text-lg font-semibold tracking-tight text-(--beheer-text)">Volledige Sync</h3>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="mb-3 block text-xs font-semibold text-(--beheer-text-muted)">Velden om te synchroniseren</label>
                        <div className="flex flex-wrap gap-2">
                            {syncFieldOptions.map((field: { id: string; label: string }) => {
                                const isSelected = selectedSyncFields.includes(field.id);
                                return (
                                    <button
                                        key={field.id}
                                        onClick={() => toggleField(field.id)}
                                        disabled={isBusy}
                                        className={`beheer-button rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all ${
                                            isSelected 
                                                ? 'border-(--beheer-accent) bg-(--beheer-accent) text-white shadow-sm' 
                                                : 'border-(--beheer-border)/50 bg-(--beheer-card-bg) text-(--beheer-text-muted) hover:border-(--beheer-accent)/30 hover:text-(--beheer-text)'
                                        }`}
                                    >
                                        {field.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 border-t border-(--beheer-border)/50 pt-4">
                        {toggles.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => item.setValue(!item.value)}
                                disabled={isBusy}
                                className={`beheer-button flex items-center justify-between rounded-xl border p-3.5 transition-all ${item.value ? 'border-(--beheer-accent) bg-(--beheer-card-soft)' : 'group border-(--beheer-border) bg-(--beheer-card-bg) hover:border-(--beheer-accent)/30'}`}
                            >
                                <span className={`text-[11px] font-semibold transition-colors ${item.value ? 'text-(--beheer-text)' : 'text-(--beheer-text-muted) group-hover:text-(--beheer-text)'}`}>
                                    {item.label}
                                </span>
                                <div className={`relative h-4 w-8 rounded-full transition-all ${item.value ? 'bg-(--beheer-accent)' : 'bg-slate-300 dark:bg-slate-700'}`}>
                                    <div className={`absolute top-1 size-2 rounded-full bg-white transition-all ${item.value ? 'right-1' : 'left-1'}`} />
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col gap-3 pt-4">
                        {status?.active ? (
                            <>
                                <button
                                    onClick={() => { void handleStopSync(); }}
                                    disabled={isStopping || status.abortRequested}
                                    className="hover:scale-1.01 beheer-button flex w-full items-center justify-center gap-2 rounded-xl bg-(--beheer-inactive) py-3.5 text-xs font-semibold text-white shadow-md transition-all active:scale-95 disabled:opacity-50"
                                >
                                    <X className={`size-4 ${isStopping ? 'animate-spin' : ''}`} />
                                    {status.abortRequested ? 'Afbreken aangevraagd...' : 'Synchronisatie Stoppen'}
                                </button>
                                {status.abortRequested && (
                                    <button
                                        onClick={() => { void handleResetSync(); }}
                                        disabled={isResetting}
                                        className="beheer-button flex w-full items-center justify-center gap-2 py-2 text-[11px] font-semibold text-(--beheer-inactive) hover:underline disabled:opacity-50"
                                    >
                                        <RefreshCw className={`size-3 ${isResetting ? 'animate-spin' : ''}`} />
                                        Forceer Reset (Emergency)
                                    </button>
                                )}
                            </>
                        ) : (
                            <button
                                onClick={() => { void handleFullSync(); }}
                                disabled={isStartingSync || !!status?.error}
                                className="hover:scale-1.01 beheer-button flex w-full items-center justify-center gap-2 rounded-xl bg-(--beheer-accent) py-3.5 text-xs font-semibold text-white shadow-md transition-all active:scale-95 disabled:opacity-50"
                            >
                                <RefreshCw className={`size-4 ${isStartingSync ? 'animate-spin' : ''}`} />
                                Start Volledige Synchronisatie
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-4">
                    <div className="rounded-xl bg-(--beheer-accent)/10 p-2.5 text-(--beheer-accent)">
                        <Info className="size-5" />
                    </div>
                    <h3 className="text-lg font-semibold tracking-tight text-(--beheer-text)">Specifieke Gebruiker</h3>
                </div>

                <p className="mb-6 text-[11px] leading-relaxed font-semibold text-(--beheer-text-muted) opacity-70">
                    Synchroniseer een specifieke gebruiker op basis van their Entra ID (UUID).
                </p>

                <form onSubmit={(e) => { void handleUserSync(e); }} className="space-y-3">
                    <input
                        type="text"
                        value={userId}
                        autoComplete="off"
                        suppressHydrationWarning
                        disabled={isBusy}
                        onChange={(e) => setUserId(e.target.value)}
                        placeholder="Entra ID (UUID)..."
                        className="beheer-input w-full rounded-xl border border-(--beheer-border) bg-(--beheer-card-soft) px-5 py-3.5 text-xs font-semibold text-(--beheer-text) transition-all placeholder:text-(--beheer-text-muted)/30 focus:border-(--beheer-accent) focus:outline-none"
                    />
                    <button
                        type="submit"
                        disabled={isUserSyncLoading || !userId.trim() || !!status?.error}
                        className="beheer-button flex w-full items-center justify-center gap-2 rounded-xl border border-(--beheer-border) bg-(--beheer-card-soft) py-3.5 text-xs font-semibold text-(--beheer-text) transition-all hover:border-(--beheer-accent) hover:text-(--beheer-accent) active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw className={`size-4 ${isUserSyncLoading ? 'animate-spin' : ''}`} />
                        Sync Gebruiker
                    </button>
                </form>
            </div>
        </div>
    );
}