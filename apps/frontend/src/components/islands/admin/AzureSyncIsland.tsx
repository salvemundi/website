'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
    RefreshCw, User, CheckCircle, AlertCircle, 
    Loader2, ArrowRight, Settings, Info, 
    Check, X, AlertTriangle, Users
} from 'lucide-react';
import { 
    triggerFullSyncAction, 
    triggerUserSyncAction, 
    getSyncStatusAction,
    stopSyncAction
} from '@/server/actions/azure-sync.actions';

interface SyncStatus {
    jobId?: string;
    active: boolean;
    status: 'idle' | 'running' | 'completed' | 'failed' | 'aborted';
    total: number;
    processed: number;
    errorCount: number;
    warningCount: number;
    missingDataCount: number;
    successCount: number;
    excludedCount: number;
    errors: { email: string; message: string; timestamp: string }[];
    warnings: { email: string; message: string }[];
    missingData: { email: string; reason: string }[];
    successfulUsers: { email: string }[];
    excludedUsers: { email: string }[];
    startTime?: string;
    endTime?: string;
    abortRequested?: boolean;
}

const syncFieldOptions = [
    { id: 'membership_expiry', label: 'Lidmaatschap vervaldatum' },
    { id: 'geboortedatum', label: 'Geboortedatum' },
    { id: 'phone_number', label: 'Mobiel nummer' },
    { id: 'committees', label: 'Commissies' },
];

export default function AzureSyncIsland() {
    const [mounted, setMounted] = useState(false);
    const [status, setStatus] = useState<SyncStatus | null>(null);
    const [isStartingSync, setIsStartingSync] = useState(false);
    const [isStopping, setIsStopping] = useState(false);
    const [isUserSyncLoading, setIsUserSyncLoading] = useState(false);
    const [userId, setUserId] = useState('');
    const [error, setError] = useState<string | null>(null);

    const [selectedSyncFields, setSelectedSyncFields] = useState<string[]>(['membership_expiry', 'geboortedatum', 'phone_number', 'committees']);
    const [forceLink, setForceLink] = useState(false);
    const [activeOnly, setActiveOnly] = useState(false);
    const [resultFilter, setResultFilter] = useState<'all' | 'success' | 'warnings' | 'missing' | 'errors' | 'excluded'>('all');

    const fetchStatus = useCallback(async () => {
        try {
            const data = await getSyncStatusAction();
            if (data && 'status' in data) {
                setStatus(data as SyncStatus);
            }
        } catch (err) {
            console.error('Failed to fetch sync status:', err);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        setMounted(true);
        fetchStatus();
    }, [fetchStatus]);

    // Polling while active or starting
    useEffect(() => {
        let interval: NodeJS.Timeout;
        const shouldPoll = status?.active || status?.status === 'running' || isStartingSync;
        
        if (shouldPoll && mounted) {
            interval = setInterval(fetchStatus, 2000);
        }
        return () => clearInterval(interval);
    }, [status?.active, status?.status, isStartingSync, fetchStatus, mounted]);

    if (!mounted) return null;

    const handleFullSync = async () => {
        setIsStartingSync(true);
        setError(null);
        try {
            const result = await triggerFullSyncAction({
                fields: selectedSyncFields,
                forceLink,
                activeOnly
            });
            if (!result.success) {
                setError(result.error || 'Kon sync niet starten');
            } else {
                fetchStatus();
            }
        } catch (err) {
            setError('Netwerkfout bij het starten van de sync.');
        } finally {
            setIsStartingSync(false);
        }
    };

    const handleStopSync = async () => {
        setIsStopping(true);
        setError(null);
        try {
            const result = await stopSyncAction();
            if (!result.success) {
                setError(result.error || 'Kon sync niet stoppen');
            } else {
                fetchStatus();
            }
        } catch (err) {
            setError('Netwerkfout bij het stoppen van de sync.');
        } finally {
            setIsStopping(false);
        }
    };

    const handleUserSync = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId.trim()) return;
        setIsUserSyncLoading(true);
        setError(null);
        try {
            const result = await triggerUserSyncAction(userId.trim());
            if (!result.success) {
                setError(result.error || 'Fout bij individuele sync');
            } else {
                setUserId('');
            }
        } catch (err) {
            setError('Netwerkfout bij het synchroniseren van de gebruiker.');
        } finally {
            setIsUserSyncLoading(false);
        }
    };

    const toggleField = (id: string) => {
        setSelectedSyncFields(prev => 
            prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        );
    };

    const progress = status ? (status.total > 0 ? (status.processed / status.total) * 100 : 0) : 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Global Error Banner */}
            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 animate-in slide-in-from-top-2">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                    <button onClick={() => setError(null)} className="ml-auto hover:bg-red-500/10 p-1 rounded-lg">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Configuration Card */}
                <div className="lg:col-span-2 space-y-8">
                    <section className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-500/5 border border-white/20 dark:border-white/5">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500">
                                    <Settings className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold dark:text-white">Configuratie</h3>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-4 block uppercase tracking-wider">
                                    Te synchroniseren velden
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {syncFieldOptions.map(option => (
                                        <button
                                            key={option.id}
                                            onClick={() => toggleField(option.id)}
                                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 border ${
                                                selectedSyncFields.includes(option.id)
                                                    ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/20'
                                                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-transparent hover:border-slate-300 dark:hover:border-white/10'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                {selectedSyncFields.includes(option.id) && <Check className="h-4 w-4" />}
                                                {option.label}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
                                <label className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 cursor-pointer group hover:bg-slate-100 dark:hover:bg-white/10 transition-colors border border-transparent hover:border-indigo-500/20">
                                    <input 
                                        type="checkbox" 
                                        checked={forceLink} 
                                        onChange={e => setForceLink(e.target.checked)}
                                        className="h-5 w-5 rounded-lg border-2 border-slate-300 dark:border-white/20 text-indigo-500 focus:ring-indigo-500 transition-all cursor-pointer"
                                    />
                                    <div>
                                        <div className="text-sm font-bold dark:text-white group-hover:text-indigo-500 transition-colors">Force Link</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">Koppel bestaande accounts op e-mail</div>
                                    </div>
                                </label>
                                <label className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 cursor-pointer group hover:bg-slate-100 dark:hover:bg-white/10 transition-colors border border-transparent hover:border-indigo-500/20">
                                    <input 
                                        type="checkbox" 
                                        checked={activeOnly} 
                                        onChange={e => setActiveOnly(e.target.checked)}
                                        className="h-5 w-5 rounded-lg border-2 border-slate-300 dark:border-white/20 text-indigo-500 focus:ring-indigo-500 transition-all cursor-pointer"
                                    />
                                    <div>
                                        <div className="text-sm font-bold dark:text-white group-hover:text-indigo-500 transition-colors">Active Only</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">Synchroniseer alleen actieve leden</div>
                                    </div>
                                </label>
                            </div>

                            {status?.active ? (
                                <button
                                    onClick={handleStopSync}
                                    disabled={isStopping || status?.abortRequested}
                                    className="w-full mt-4 py-4 px-6 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl shadow-xl shadow-red-500/20 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
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
                                    className="w-full mt-4 py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale active:scale-95"
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
                    <section className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl shadow-blue-500/5 border border-white/20 dark:border-white/5 h-full">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                                <User className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold dark:text-white">Single Sync</h3>
                        </div>
                        
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                            Synchroniseer direct een specifieke gebruiker door hun Directus UUID in te voeren. 
                        </p>

                        <form onSubmit={handleUserSync} className="space-y-4">
                            <input 
                                value={userId}
                                onChange={e => setUserId(e.target.value)}
                                placeholder="UUID (bijv. d3a1b2...)"
                                autoComplete="off"
                                className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:text-white"
                            />
                            <button
                                type="submit"
                                disabled={isUserSyncLoading || !userId.trim()}
                                className="w-full py-4 px-6 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isUserSyncLoading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Nu Bijwerken'}
                            </button>
                        </form>
                    </section>
                </div>
            </div>

            {/* Progress & Results Section */}
            {status && (
                <section className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-white/5 animate-in slide-in-from-bottom-4 duration-700">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-2xl font-black dark:text-white">Live Voortgang</h3>
                                {status.active && <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />}
                            </div>
                            <p className="text-sm text-slate-500">Status: <span className="capitalize font-bold text-indigo-500">{status.status}</span></p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-black text-indigo-500">{Math.round(progress)}%</div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{status.processed} / {status.total} Leden</div>
                        </div>
                    </div>

                    {/* Thick Progress Bar */}
                    <div className="h-6 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden mb-12 flex items-center p-1.5 border border-slate-200 dark:border-white/10 shadow-inner">
                        <div 
                            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-[length:200%_100%] animate-shimmer rounded-full transition-all duration-1000 ease-out shadow-lg"
                            style={{ width: `${Math.max(progress, 3)}%` }}
                        />
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                        <StatCard icon={<CheckCircle className="text-green-500" />} label="Geslaagd" count={status.successCount} color="green" />
                        <StatCard icon={<AlertTriangle className="text-amber-500" />} label="Warnings" count={status.warningCount} color="amber" />
                        <StatCard icon={<Info className="text-blue-500" />} label="Missend" count={status.missingDataCount} color="blue" />
                        <StatCard icon={<AlertCircle className="text-red-500" />} label="Fouten" count={status.errorCount} color="red" />
                    </div>

                    {/* Results Explorer */}
                    <div className="space-y-6">
                        <div className="flex bg-slate-100 dark:bg-black/40 p-1.5 rounded-2xl overflow-x-auto gap-1">
                            <FilterTab active={resultFilter === 'all'} label="Alles" count={status.processed} onClick={() => setResultFilter('all')} />
                            <FilterTab active={resultFilter === 'success'} label="Success" count={status.successCount} onClick={() => setResultFilter('success')} color="green" />
                            <FilterTab active={resultFilter === 'warnings'} label="Warnings" count={status.warningCount} onClick={() => setResultFilter('warnings')} color="amber" />
                            <FilterTab active={resultFilter === 'missing'} label="Missend" count={status.missingDataCount} onClick={() => setResultFilter('missing')} color="blue" />
                            <FilterTab active={resultFilter === 'errors'} label="Errors" count={status.errorCount} onClick={() => setResultFilter('errors')} color="red" />
                            <FilterTab active={resultFilter === 'excluded'} label="Excluded" count={status.excludedCount} onClick={() => setResultFilter('excluded')} color="slate" />
                        </div>

                        <div className="bg-slate-50 dark:bg-black/20 rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden">
                            <div className="max-h-[30rem] overflow-y-auto custom-scrollbar p-1">
                                <ResultsList filter={resultFilter} status={status} />
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Documentation Alert */}
            <div className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 p-8 rounded-[2.5rem] border border-indigo-500/10 dark:border-white/5 flex gap-6 items-start">
                <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500 shrink-0">
                    <Info className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                    <h4 className="font-bold dark:text-white">Hoe werkt de Azure Synchronisatie?</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        Dit proces koppelt de Microsoft 365 groepen van Salve Mundi aan de commissies in deze portal. 
                        Tevens worden verloopdata van lidmaatschappen en andere profielgegevens ververst op basis van Azure AD attributes. 
                        <strong>Let op:</strong> Dit heeft invloed op wie toegang heeft tot de Beheer-secties en commissie-rechten.
                    </p>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, count, color }: { icon: React.ReactNode; label: string; count: number; color: string }) {
    const colorClasses: Record<string, string> = {
        green: 'border-green-500/10 bg-green-500/5',
        amber: 'border-amber-500/10 bg-amber-500/5',
        blue: 'border-blue-500/10 bg-blue-500/5',
        red: 'border-red-500/10 bg-red-500/5',
    };

    return (
        <div className={`p-6 rounded-3xl border transition-all hover:scale-[1.02] duration-300 ${colorClasses[color] || ''}`}>
            <div className="flex items-center gap-3 mb-2">
                {icon}
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</span>
            </div>
            <div className="text-3xl font-black dark:text-white">{count}</div>
        </div>
    );
}

function FilterTab({ active, label, count, onClick, color = 'indigo' }: { active: boolean; label: string; count: number; onClick: () => void; color?: string }) {
    const colorVariants: Record<string, string> = {
        indigo: 'bg-indigo-500 text-white',
        green: 'bg-green-500 text-white',
        amber: 'bg-amber-500 text-white',
        blue: 'bg-blue-500 text-white',
        red: 'bg-red-500 text-white',
        slate: 'bg-slate-500 text-white',
    };

    return (
        <button
            onClick={onClick}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                active 
                    ? `${colorVariants[color]} shadow-lg` 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5'
            }`}
        >
            {label}
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${active ? 'bg-white/20' : 'bg-slate-200 dark:bg-white/10'}`}>
                {count}
            </span>
        </button>
    );
}

function ResultsList({ filter, status }: { filter: string; status: SyncStatus }) {
    let items: React.ReactNode[] = [];

    if (filter === 'all' || filter === 'success') {
        items.push(...status.successfulUsers.map((u, i) => (
            <ResultRow key={`s-${i}`} email={u.email} type="success" />
        )));
    }
    if (filter === 'all' || filter === 'warnings') {
        items.push(...status.warnings.map((w, i) => (
            <ResultRow key={`w-${i}`} email={w.email} message={w.message} type="warning" />
        )));
    }
    if (filter === 'all' || filter === 'missing') {
        items.push(...status.missingData.map((m, i) => (
            <ResultRow key={`m-${i}`} email={m.email} message={m.reason} type="info" />
        )));
    }
    if (filter === 'all' || filter === 'errors') {
        items.push(...status.errors.map((e, i) => (
            <ResultRow key={`e-${i}`} email={e.email} message={e.message} type="error" />
        )));
    }
    if (filter === 'all' || filter === 'excluded') {
        items.push(...status.excludedUsers.map((u, i) => (
            <ResultRow key={`ex-${i}`} email={u.email} type="excluded" />
        )));
    }

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-slate-400">
                <Users className="h-12 w-12 mb-4 opacity-20" />
                <p className="font-medium">Geen resultaten gevonden voor dit filter.</p>
            </div>
        );
    }

    return <div className="divide-y divide-slate-200 dark:divide-white/5">{items}</div>;
}

function ResultRow({ email, message, type }: { email: string; message?: string; type: 'success' | 'warning' | 'error' | 'info' | 'excluded' }) {
    const icons = {
        success: <CheckCircle className="h-4 w-4 text-green-500" />,
        warning: <AlertTriangle className="h-4 w-4 text-amber-500" />,
        error: <X className="h-4 w-4 text-red-500" />,
        info: <Info className="h-4 w-4 text-blue-500" />,
        excluded: <Users className="h-4 w-4 text-slate-400" />,
    };

    return (
        <div className="p-4 flex items-start gap-4 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
            <div className="mt-0.5">{icons[type]}</div>
            <div className="min-w-0">
                <div className="text-sm font-bold dark:text-white truncate">{email}</div>
                {message && <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{message}</div>}
            </div>
            <div className="ml-auto text-[10px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-600">
                {type}
            </div>
        </div>
    );
}
