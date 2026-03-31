'use client';

import React from 'react';
import { Settings, Check, X, Loader2, RefreshCw, User } from 'lucide-react';

interface SyncOverviewProps {
    status: any;
    selectedSyncFields: string[];
    toggleField: (id: string) => void;
    forceLink: boolean;
    setForceLink: (value: boolean) => void;
    activeOnly: boolean;
    setActiveOnly: (value: boolean) => void;
    isStopping: boolean;
    isStartingSync: boolean;
    handleStopSync: () => void;
    handleFullSync: () => void;
    userId: string;
    setUserId: (value: string) => void;
    isUserSyncLoading: boolean;
    handleUserSync: (e: React.FormEvent) => void;
    syncFieldOptions: { id: string; label: string }[];
}

export default function SyncOverview({
    status,
    selectedSyncFields,
    toggleField,
    forceLink,
    setForceLink,
    activeOnly,
    setActiveOnly,
    isStopping,
    isStartingSync,
    handleStopSync,
    handleFullSync,
    userId,
    setUserId,
    isUserSyncLoading,
    handleUserSync,
    syncFieldOptions
}: SyncOverviewProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Configuration Card */}
            <div className="lg:col-span-2 space-y-8">
                <section className="bg-[var(--beheer-card-bg)] p-8 rounded-[var(--beheer-radius)] shadow-sm border border-[var(--beheer-border)] h-full">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-[var(--beheer-accent)]/10 rounded-2xl text-[var(--beheer-accent)]">
                                <Settings className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-black text-[var(--beheer-text)] uppercase tracking-tight">Configuratie</h3>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)] mb-4 block">
                                Te synchroniseren velden
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {syncFieldOptions.map(option => (
                                    <button
                                        key={option.id}
                                        onClick={() => toggleField(option.id)}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border ${
                                            selectedSyncFields.includes(option.id)
                                                ? 'bg-[var(--beheer-accent)] text-white border-[var(--beheer-accent)] shadow-[var(--shadow-glow)]'
                                                : 'bg-[var(--beheer-card-soft)] text-[var(--beheer-text-muted)] border-[var(--beheer-border)] hover:border-[var(--beheer-accent)]/30'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {selectedSyncFields.includes(option.id) && <Check className="h-3.5 w-3.5" />}
                                            {option.label}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[var(--beheer-border)]">
                            <label className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--beheer-card-soft)] cursor-pointer group hover:bg-[var(--beheer-card-bg)] transition-all border border-[var(--beheer-border)] hover:border-[var(--beheer-accent)]/20">
                                <input 
                                    type="checkbox" 
                                    checked={forceLink} 
                                    onChange={e => setForceLink(e.target.checked)}
                                    className="h-5 w-5 rounded-lg border-2 border-[var(--beheer-border)] text-[var(--beheer-accent)] focus:ring-[var(--beheer-accent)] transition-all cursor-pointer"
                                />
                                <div>
                                    <div className="text-[10px] font-black text-[var(--beheer-text)] group-hover:text-[var(--beheer-accent)] transition-colors uppercase tracking-widest">Force Link</div>
                                    <div className="text-[10px] text-[var(--beheer-text-muted)] font-bold uppercase tracking-widest">Koppel bestaande accounts op e-mail</div>
                                </div>
                            </label>
                            <label className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--beheer-card-soft)] cursor-pointer group hover:bg-[var(--beheer-card-bg)] transition-all border border-[var(--beheer-border)] hover:border-[var(--beheer-accent)]/20">
                                <input 
                                    type="checkbox" 
                                    checked={activeOnly} 
                                    onChange={e => setActiveOnly(e.target.checked)}
                                    className="h-5 w-5 rounded-lg border-2 border-[var(--beheer-border)] text-[var(--beheer-accent)] focus:ring-[var(--beheer-accent)] transition-all cursor-pointer"
                                />
                                <div>
                                    <div className="text-[10px] font-black text-[var(--beheer-text)] group-hover:text-[var(--beheer-accent)] transition-colors uppercase tracking-widest">Active Only</div>
                                    <div className="text-[10px] text-[var(--beheer-text-muted)] font-bold uppercase tracking-widest">Synchroniseer alleen actieve leden</div>
                                </div>
                            </label>
                        </div>

                        {status?.active ? (
                            <button
                                onClick={handleStopSync}
                                disabled={isStopping || status?.abortRequested}
                                className="w-full mt-4 py-4 px-6 bg-[var(--beheer-inactive)]/10 hover:bg-[var(--beheer-inactive)] text-[var(--beheer-inactive)] hover:text-white border border-[var(--beheer-inactive)]/20 font-black uppercase tracking-widest text-sm rounded-2xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                            >
                                {isStopping ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    <>
                                        <X className="h-6 w-6" />
                                        <span>{status?.abortRequested ? 'Stoppen aangevraagd...' : 'Synchronisatie Stoppen'}</span>
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={handleFullSync}
                                disabled={isStartingSync}
                                className="w-full mt-4 py-4 px-6 bg-[var(--beheer-accent)] hover:opacity-90 text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-[var(--shadow-glow)] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale active:scale-95"
                            >
                                {isStartingSync ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    <>
                                        <RefreshCw className="h-6 w-6" />
                                        <span>Start Volledige Synchronisatie</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </section>
            </div>

            {/* Individual Sync Card */}
            <div className="space-y-8">
                <section className="bg-[var(--beheer-card-bg)] p-8 rounded-[var(--beheer-radius)] shadow-sm border border-[var(--beheer-border)] h-full">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-[var(--beheer-accent)]/10 rounded-2xl text-[var(--beheer-accent)]">
                            <User className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-black text-[var(--beheer-text)] uppercase tracking-tight">Single Sync</h3>
                    </div>
                    
                    <p className="text-[10px] text-[var(--beheer-text-muted)] mb-8 leading-relaxed font-black uppercase tracking-widest">
                        Synchroniseer direct een specifiek lid door hun Azure Entra ID in te voeren. 
                    </p>

                    <form onSubmit={handleUserSync} className="space-y-4">
                        <input 
                            value={userId}
                            onChange={e => setUserId(e.target.value)}
                            placeholder="Azure Entra ID (bijv. d3a1b2...)"
                            autoComplete="off"
                            className="w-full p-4 bg-[var(--beheer-card-soft)] border border-[var(--beheer-border)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--beheer-accent)]/20 focus:border-[var(--beheer-accent)] transition-all text-[var(--beheer-text)] font-semibold"
                        />
                        <button
                            type="submit"
                            disabled={isUserSyncLoading || !userId.trim()}
                            className="w-full py-4 px-6 bg-[var(--beheer-card-soft)] hover:bg-[var(--beheer-card-bg)] text-[var(--beheer-text)] font-black uppercase tracking-widest text-xs rounded-2xl border border-[var(--beheer-border)] transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isUserSyncLoading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Nu via Azure Syncen'}
                        </button>
                    </form>
                </section>
            </div>
        </div>
    );
}
