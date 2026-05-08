'use client';

import React from 'react';
import { RefreshCw, X, Info } from 'lucide-react';
import { useSync } from './SyncContext';

interface Props {
    tasks?: Record<string, unknown>[];
}

export default function SyncControlIsland({ tasks = [] }: Props) {
    const { 
        isStartingSync, isStopping, isResetting, isUserSyncLoading,
        selectedSyncFields, toggleField, forceLink, setForceLink,
        activeOnly, setActiveOnly, handleFullSync, handleStopSync, handleResetSync,
        userId, setUserId, handleUserSync, syncFieldOptions, status 
    } = useSync();
    
    return (
        <div className="flex flex-col gap-6 mb-8">
            <div className="bg-[var(--beheer-card-bg)] p-6 rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-2.5 bg-[var(--beheer-accent)]/10 rounded-xl text-[var(--beheer-accent)]">
                        <RefreshCw className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--beheer-text)] tracking-tight">Volledige Sync</h3>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="text-xs font-semibold text-[var(--beheer-text-muted)] mb-3 block">Velden om te synchroniseren</label>
                        <div className="flex flex-wrap gap-2">
                            {(syncFieldOptions || []).map((field: { id: string; label: string }) => (
                                <button
                                    key={field.id}
                                    onClick={() => toggleField?.(field.id)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all border ${selectedSyncFields.includes(field.id) ? 'bg-[var(--beheer-accent)] text-white border-[var(--beheer-accent)] shadow-md' : 'bg-[var(--beheer-card-soft)] text-[var(--beheer-text-muted)] border-[var(--beheer-border)]/50 hover:border-[var(--beheer-accent)]/30 hover:text-[var(--beheer-text)]'}`}
                                >
                                    {field.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 pt-4 border-t border-[var(--beheer-border)]/50">
                        <button
                            onClick={() => setForceLink?.(!forceLink)}
                            className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${forceLink ? 'border-[var(--beheer-accent)] bg-[var(--beheer-accent)]/5' : 'border-[var(--beheer-border)] hover:border-[var(--beheer-accent)]/30 group'}`}
                        >
                            <span className={`text-[11px] font-semibold transition-colors ${forceLink ? 'text-[var(--beheer-accent)]' : 'text-[var(--beheer-text-muted)] group-hover:text-[var(--beheer-text)]'}`}>Forceer Entra Link</span>
                            <div className={`h-4 w-8 rounded-full relative transition-all ${forceLink ? 'bg-[var(--beheer-accent)]' : 'bg-slate-300 dark:bg-slate-700'}`}>
                                <div className={`absolute top-1 w-2 h-2 rounded-full bg-white transition-all ${forceLink ? 'right-1' : 'left-1'}`} />
                            </div>
                        </button>

                        <button
                            onClick={() => setActiveOnly?.(!activeOnly)}
                            className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${activeOnly ? 'border-[var(--beheer-accent)] bg-[var(--beheer-accent)]/5' : 'border-[var(--beheer-border)] hover:border-[var(--beheer-accent)]/30 group'}`}
                        >
                            <span className={`text-[11px] font-semibold transition-colors ${activeOnly ? 'text-[var(--beheer-accent)]' : 'text-[var(--beheer-text-muted)] group-hover:text-[var(--beheer-text)]'}`}>Alleen Actieve Leden</span>
                            <div className={`h-4 w-8 rounded-full relative transition-all ${activeOnly ? 'bg-[var(--beheer-accent)]' : 'bg-slate-300 dark:bg-slate-700'}`}>
                                <div className={`absolute top-1 w-2 h-2 rounded-full bg-white transition-all ${activeOnly ? 'right-1' : 'left-1'}`} />
                            </div>
                        </button>
                    </div>

                    <div className="pt-4 flex flex-col gap-3">
                        {status?.active ? (
                            <>
                                <button
                                    onClick={handleStopSync}
                                    disabled={isStopping || status?.abortRequested}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-[var(--beheer-inactive)] text-white rounded-xl font-semibold text-xs shadow-md hover:scale-[1.01] active:scale-95 disabled:opacity-50 transition-all"
                                >
                                    <X className={`h-4 w-4 ${isStopping ? 'animate-spin' : ''}`} />
                                    {status?.abortRequested ? 'Afbreken aangevraagd...' : 'Synchronisatie Stoppen'}
                                </button>
                                {status?.abortRequested && (
                                    <button
                                        onClick={handleResetSync}
                                        disabled={isResetting}
                                        className="w-full flex items-center justify-center gap-2 py-2 text-[11px] text-[var(--beheer-inactive)] font-semibold hover:underline disabled:opacity-50"
                                    >
                                        <RefreshCw className={`h-3 w-3 ${isResetting ? 'animate-spin' : ''}`} />
                                        Forceer Reset (Emergency)
                                    </button>
                                )}
                            </>
                        ) : (
                            <button
                                onClick={handleFullSync}
                                disabled={isStartingSync}
                                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[var(--beheer-accent)] text-white rounded-xl font-semibold text-xs shadow-md hover:scale-[1.01] active:scale-95 disabled:opacity-50 transition-all"
                            >
                                <RefreshCw className={`h-4 w-4 ${isStartingSync ? 'animate-spin' : ''}`} />
                                Start Volledige Synchronisatie
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-[var(--beheer-card-bg)] p-6 rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-2.5 bg-[var(--beheer-accent)]/10 rounded-xl text-[var(--beheer-accent)]">
                        <Info className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--beheer-text)] tracking-tight">Specifieke Gebruiker</h3>
                </div>

                <p className="text-[11px] font-semibold text-[var(--beheer-text-muted)] mb-6 leading-relaxed opacity-70">
                    Synchroniseer een specifieke gebruiker op basis van hun Entra ID (UUID).
                </p>

                <form onSubmit={handleUserSync} className="space-y-3">
                    <input
                        type="text"
                        value={userId}
                        autoComplete="off"
                        suppressHydrationWarning
                        onChange={(e) => setUserId?.(e.target.value)}
                        placeholder="Entra ID (UUID)..."
                        className="w-full px-5 py-3.5 bg-[var(--beheer-card-soft)] border border-[var(--beheer-border)] rounded-xl text-xs font-semibold focus:outline-none focus:border-[var(--beheer-accent)] transition-all placeholder:text-[var(--beheer-text-muted)]/30 text-[var(--beheer-text)]"
                    />
                    <button
                        type="submit"
                        disabled={isUserSyncLoading || !userId.trim()}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-[var(--beheer-card-soft)] text-[var(--beheer-text)] border border-[var(--beheer-border)] rounded-xl font-semibold text-xs hover:border-[var(--beheer-accent)] hover:text-[var(--beheer-accent)] transition-all disabled:opacity-50 active:scale-95"
                    >
                        <RefreshCw className={`h-4 w-4 ${isUserSyncLoading ? 'animate-spin' : ''}`} />
                        Sync Gebruiker
                    </button>
                </form>
            </div>
        </div>
    );
}
