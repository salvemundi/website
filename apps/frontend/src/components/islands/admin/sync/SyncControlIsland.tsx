'use client';

import React from 'react';
import { RefreshCw, X, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

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

export default function SyncControlIsland({
    isLoading, isStartingSync = false, isStopping = false, isUserSyncLoading = false,
    selectedSyncFields = [], toggleField, forceLink = false, setForceLink,
    activeOnly = false, setActiveOnly, handleFullSync, handleStopSync,
    userId = '', setUserId, handleUserSync, syncFieldOptions = [], status
}: SyncControlIslandProps) {
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2">
                <div className={`bg-[var(--beheer-card-bg)] p-8 rounded-[2rem] border border-[var(--beheer-border)] shadow-sm h-full ${isLoading ? 'skeleton-active' : ''}`}>
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
                            <div className="flex flex-wrap gap-2">
                                {syncFieldOptions.map(field => (
                                    <button
                                        key={field.id}
                                        onClick={() => toggleField?.(field.id)}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedSyncFields.includes(field.id) ? 'bg-[var(--beheer-accent)] text-white' : 'bg-[var(--beheer-card-soft)] text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)]'}`}
                                    >
                                        {field.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[var(--beheer-border)]/50">
                            <button
                                onClick={() => setForceLink?.(!forceLink)}
                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${forceLink ? 'border-[var(--beheer-accent)] bg-[var(--beheer-accent)]/5' : 'border-[var(--beheer-border)] hover:border-[var(--beheer-text-muted)]'}`}
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)]">Forceer Entra Link</span>
                                <div className={`h-4 w-8 rounded-full relative transition-all ${forceLink ? 'bg-[var(--beheer-accent)]' : 'bg-slate-300'}`}>
                                    <div className={`absolute top-1 w-2 h-2 rounded-full bg-white transition-all ${forceLink ? 'right-1' : 'left-1'}`} />
                                </div>
                            </button>

                            <button
                                onClick={() => setActiveOnly?.(!activeOnly)}
                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${activeOnly ? 'border-[var(--beheer-accent)] bg-[var(--beheer-accent)]/5' : 'border-[var(--beheer-border)] hover:border-[var(--beheer-text-muted)]'}`}
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)]">Alleen Actieve Leden</span>
                                <div className={`h-4 w-8 rounded-full relative transition-all ${activeOnly ? 'bg-[var(--beheer-accent)]' : 'bg-slate-300'}`}>
                                    <div className={`absolute top-1 w-2 h-2 rounded-full bg-white transition-all ${activeOnly ? 'right-1' : 'left-1'}`} />
                                </div>
                            </button>
                        </div>

                        <div className="pt-4">
                            {status?.active ? (
                                <button
                                    onClick={handleStopSync}
                                    disabled={isStopping || status?.abortRequested}
                                    className="w-full flex items-center justify-center gap-2 py-4 bg-[var(--beheer-inactive)] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-[var(--beheer-inactive)]/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all"
                                >
                                    <X className="h-5 w-5" />
                                    {status?.abortRequested ? 'Afbreken aangevraagd...' : 'Synchronisatie Stoppen'}
                                </button>
                            ) : (
                                <button
                                    onClick={handleFullSync}
                                    disabled={isStartingSync}
                                    className="w-full flex items-center justify-center gap-2 py-4 bg-[var(--beheer-accent)] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-[var(--beheer-accent)]/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all"
                                >
                                    <RefreshCw className={`h-5 w-5 ${isStartingSync ? 'animate-spin' : ''}`} />
                                    Start Volledige Synchronisatie
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <form 
                    onSubmit={handleUserSync} 
                    autoComplete="off"
                    className={`bg-[var(--beheer-card-bg)] p-8 rounded-[2rem] border border-[var(--beheer-border)] shadow-sm h-full ${isLoading ? 'skeleton-active' : ''}`}
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-purple-100 rounded-2xl text-purple-600">
                            <Info className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-black text-[var(--beheer-text)] uppercase tracking-tight">Single User</h3>
                    </div>

                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)] mb-8 leading-relaxed">
                        Synchroniseer een specifieke gebruiker op basis van hun Entra ID (UUID).
                    </p>

                    <div className="space-y-4">
                        <input
                            type="text"
                            value={userId}
                            autoComplete="off"
                            suppressHydrationWarning
                            onChange={(e) => setUserId?.(e.target.value)}
                            placeholder="Entra ID (UUID)..."
                            className="w-full px-6 py-4 bg-[var(--beheer-card-soft)] border border-[var(--beheer-border)] rounded-2xl text-xs font-bold focus:outline-none focus:border-[var(--beheer-accent)] transition-all"
                        />
                        <button
                            type="submit"
                            disabled={isUserSyncLoading || !userId.trim()}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-[var(--beheer-card-soft)] text-[var(--beheer-text)] border border-[var(--beheer-border)] rounded-2xl font-black uppercase tracking-widest text-xs hover:border-[var(--beheer-accent)] transition-all disabled:opacity-50 active:scale-95"
                        >
                            <RefreshCw className={`h-4 w-4 ${isUserSyncLoading ? 'animate-spin' : ''}`} />
                            Sync Gebruiker
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
