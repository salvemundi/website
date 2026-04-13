'use client';

import React from 'react';
import { RefreshCw, X, Info } from 'lucide-react';

interface SyncControlIslandProps {
    isLoading?: boolean;
    isStartingSync?: boolean;
    isStopping?: boolean;
    isUserSyncLoading?: boolean;
    selectedSyncFields?: string[];
    toggleField?: (id: string) => void;
    forceLink?: boolean;
    setForceLink?: (val: boolean) => void;
    activeOnly?: boolean;
    setActiveOnly?: (val: boolean) => void;
    handleFullSync?: () => void;
    handleStopSync?: () => void;
    userId?: string;
    setUserId?: (val: string) => void;
    handleUserSync?: (e: React.FormEvent) => void;
    syncFieldOptions?: { id: string, label: string }[];
    status?: any | null;
}

import { useSync } from './SyncContext';

export default function SyncControlIsland() {
    const { 
        isLoading, isStartingSync, isStopping, isUserSyncLoading,
        selectedSyncFields, toggleField, forceLink, setForceLink,
        activeOnly, setActiveOnly, handleFullSync, handleStopSync,
        userId, setUserId, handleUserSync, syncFieldOptions, status 
    } = useSync();
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2">
                <div className={`bg-[var(--beheer-card-bg)] p-8 rounded-[2rem] border border-[var(--beheer-border)] shadow-sm h-full ${!isLoading ? 'animate-in fade-in duration-700' : ''}`}>
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-[var(--beheer-accent)]/10 rounded-2xl text-[var(--beheer-accent)]">
                                <RefreshCw className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-black text-[var(--beheer-text)] uppercase tracking-tight">Full Sync</h3>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)] mb-4 block">Velden om te synchroniseren</label>
                            <div className={`flex flex-wrap gap-2 ${isLoading ? 'skeleton-active' : ''}`}>
                                {(isLoading ? [1,2,3,4] : syncFieldOptions).map((field: any, idx: number) => (
                                    <button
                                        key={typeof field === 'number' ? field : field.id}
                                        onClick={() => typeof field !== 'number' && toggleField?.(field.id)}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isLoading && selectedSyncFields.includes(field.id) ? 'bg-[var(--beheer-accent)] text-white shadow-lg shadow-[var(--beheer-accent)]/20' : 'bg-[var(--beheer-card-soft)] text-[var(--beheer-text-muted)] hover:bg-[var(--beheer-border)]/50 hover:text-[var(--beheer-text)]'}`}
                                    >
                                        {typeof field === 'number' ? 'FIELD NAME' : field.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[var(--beheer-border)]/50">
                            <button
                                onClick={() => setForceLink?.(!forceLink)}
                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isLoading ? 'skeleton-active' : (forceLink ? 'border-[var(--beheer-accent)] bg-[var(--beheer-accent)]/5' : 'border-[var(--beheer-border)] hover:border-[var(--beheer-accent)]/30 group')}`}
                            >
                                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${!isLoading && forceLink ? 'text-[var(--beheer-accent)]' : 'text-[var(--beheer-text-muted)] group-hover:text-[var(--beheer-text)]'}`}>Forceer Entra Link</span>
                                <div className={`h-4 w-8 rounded-full relative transition-all ${!isLoading && forceLink ? 'bg-[var(--beheer-accent)]' : 'bg-slate-300 dark:bg-slate-700'}`}>
                                    <div className={`absolute top-1 w-2 h-2 rounded-full bg-white transition-all ${!isLoading && forceLink ? 'right-1' : 'left-1'}`} />
                                </div>
                            </button>

                            <button
                                onClick={() => setActiveOnly?.(!activeOnly)}
                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isLoading ? 'skeleton-active' : (activeOnly ? 'border-[var(--beheer-accent)] bg-[var(--beheer-accent)]/5' : 'border-[var(--beheer-border)] hover:border-[var(--beheer-accent)]/30 group')}`}
                            >
                                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${!isLoading && activeOnly ? 'text-[var(--beheer-accent)]' : 'text-[var(--beheer-text-muted)] group-hover:text-[var(--beheer-text)]'}`}>Alleen Actieve Leden</span>
                                <div className={`h-4 w-8 rounded-full relative transition-all ${!isLoading && activeOnly ? 'bg-[var(--beheer-accent)]' : 'bg-slate-300 dark:bg-slate-700'}`}>
                                    <div className={`absolute top-1 w-2 h-2 rounded-full bg-white transition-all ${!isLoading && activeOnly ? 'right-1' : 'left-1'}`} />
                                </div>
                            </button>
                        </div>

                        <div className={`pt-4 ${isLoading ? 'skeleton-active' : ''}`}>
                            {!isLoading && status?.active ? (
                                <button
                                    onClick={handleStopSync}
                                    disabled={isStopping || status?.abortRequested}
                                    className="w-full flex items-center justify-center gap-2 py-4 bg-[var(--beheer-inactive)] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-[var(--beheer-inactive)]/20 hover:scale-[1.01] active:scale-95 disabled:opacity-50 transition-all"
                                >
                                    <X className={`h-5 w-5 ${isStopping ? 'animate-spin' : ''}`} />
                                    {status?.abortRequested ? 'Afbreken aangevraagd...' : 'Synchronisatie Stoppen'}
                                </button>
                            ) : (
                                <button
                                    onClick={handleFullSync}
                                    disabled={isLoading || isStartingSync}
                                    className="w-full flex items-center justify-center gap-2 py-4 bg-[var(--beheer-accent)] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-[var(--beheer-accent)]/20 hover:scale-[1.01] active:scale-95 disabled:opacity-50 transition-all"
                                >
                                    <RefreshCw className={`h-5 w-5 ${!isLoading && isStartingSync ? 'animate-spin' : ''}`} />
                                    {isLoading ? 'SYNC WORDT GELADEN' : 'Start Volledige Synchronisatie'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <div 
                    className={`bg-[var(--beheer-card-bg)] p-8 rounded-[2rem] border border-[var(--beheer-border)] shadow-sm h-full ${!isLoading ? 'animate-in fade-in duration-700' : ''}`}
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-[var(--beheer-accent)]/10 rounded-2xl text-[var(--beheer-accent)]">
                            <Info className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-black text-[var(--beheer-text)] uppercase tracking-tight">Single User</h3>
                    </div>

                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)] mb-8 leading-relaxed">
                        Synchroniseer een specifieke gebruiker op basis van hun Entra ID (UUID).
                    </p>

                    <form onSubmit={handleUserSync} className={`space-y-4 ${isLoading ? 'skeleton-active' : ''}`}>
                        <input
                            type="text"
                            value={userId}
                            autoComplete="off"
                            suppressHydrationWarning
                            disabled={isLoading}
                            onChange={(e) => setUserId?.(e.target.value)}
                            placeholder="Entra ID (UUID)..."
                            className="w-full px-6 py-4 bg-[var(--beheer-card-soft)] border border-[var(--beheer-border)] rounded-2xl text-xs font-bold focus:outline-none focus:border-[var(--beheer-accent)] transition-all placeholder:text-[var(--beheer-text-muted)]/30 text-[var(--beheer-text)]"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || isUserSyncLoading || !userId.trim()}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-[var(--beheer-card-soft)] text-[var(--beheer-text)] border border-[var(--beheer-border)] rounded-2xl font-black uppercase tracking-widest text-xs hover:border-[var(--beheer-accent)] hover:text-[var(--beheer-accent)] transition-all disabled:opacity-50 active:scale-95"
                        >
                            <RefreshCw className={`h-4 w-4 ${!isLoading && isUserSyncLoading ? 'animate-spin' : ''}`} />
                            {isLoading ? 'SYNC WORDT GELADEN' : 'Sync Gebruiker'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
