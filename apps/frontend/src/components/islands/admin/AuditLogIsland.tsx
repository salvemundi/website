'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
    Shield, CheckCircle, XCircle, RefreshCw, Clock, 
    Tag, Loader2, ArrowRight, Filter, 
    CheckSquare, Square
} from 'lucide-react';
import { 
    getPendingSignupsAction, 
    approveSignupAction, 
    rejectSignupAction,
    getAuditSettingsAction,
    updateAuditSettingsAction
} from '@/server/actions/audit.actions';
import { PendingSignup } from '@salvemundi/validations';

export default function AuditLogIsland() {
    const [signups, setSignups] = useState<PendingSignup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [manualApproval, setManualApproval] = useState(false);
    
    // Filters
    const [filterType, setFilterType] = useState<string>('all');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [signupsRes, settingsRes] = await Promise.all([
                getPendingSignupsAction(),
                getAuditSettingsAction()
            ]);

            if (signupsRes.success && signupsRes.data) setSignups(signupsRes.data);
            if (settingsRes.success && settingsRes.data) setManualApproval(settingsRes.data.manual_approval);
        } catch (err) {
            console.error("Failed to load audit data", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filteredSignups = useMemo(() => {
        if (filterType === 'all') return signups;
        return signups.filter(s => s.type === filterType);
    }, [signups, filterType]);

    const handleApprove = async (id: string, type: string) => {
        setIsProcessing(id);
        try {
            const res = await approveSignupAction(id, type);
            if (res.success) {
                setSignups(prev => prev.filter(s => s.id !== id));
            }
        } finally {
            setIsProcessing(null);
        }
    };

    const handleReject = async (id: string, type: string) => {
        if (!confirm('Weet je zeker dat je deze inschrijving wilt afwijzen?')) return;
        setIsProcessing(id);
        try {
            const res = await rejectSignupAction(id, type);
            if (res.success) {
                setSignups(prev => prev.filter(s => s.id !== id));
            }
        } finally {
            setIsProcessing(null);
        }
    };

    const toggleManualApproval = async () => {
        const newValue = !manualApproval;
        setManualApproval(newValue);
        await updateAuditSettingsAction(newValue);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredSignups.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredSignups.map(s => s.id)));
        }
    };

    const toggleSelectOne = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    return (
        <div className="space-y-6">
            {/* Settings & Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Shield className="h-5 w-5 text-purple-600" />
                            Goedkeuringsmodus
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {manualApproval 
                                ? "Handmatige goedkeuring is ACTIEF. Alle nieuwe aanmeldingen moeten worden gecontroleerd."
                                : "Automatische goedkeuring is ACTIEF. Aanmeldingen worden direct verwerkt."}
                        </p>
                    </div>
                    <button 
                        onClick={toggleManualApproval}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${manualApproval ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${manualApproval ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                <div className="bg-purple-600 p-6 rounded-3xl shadow-lg shadow-purple-200 dark:shadow-none text-white overflow-hidden relative">
                    <div className="relative z-10">
                        <p className="text-purple-100 text-sm font-medium">In afwachting</p>
                        <h3 className="text-4xl font-black mt-1">{signups.length}</h3>
                    </div>
                    <Clock className="absolute -right-4 -bottom-4 h-24 w-24 text-white/10" />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4 overflow-x-auto pb-1 custom-scrollbar">
                        {['all', 'event', 'trip', 'pub_crawl'].map(type => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${filterType === type 
                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' 
                                    : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                            >
                                {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                    
                    <button 
                        onClick={loadData}
                        disabled={isLoading}
                        className="p-2 text-slate-400 hover:text-purple-600 transition-colors"
                    >
                        <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                                <th className="p-4 w-12 text-center">
                                    <button onClick={toggleSelectAll} className="text-slate-400 hover:text-purple-600">
                                        {selectedIds.size > 0 && selectedIds.size === filteredSignups.length ? <CheckSquare className="h-5 w-5 text-purple-600" /> : <Square className="h-5 w-5" />}
                                    </button>
                                </th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Datum</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Naam</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Product</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Status</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Acties</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="p-8">
                                            <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-full" />
                                        </td>
                                    </tr>
                                ))
                            ) : filteredSignups.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <CheckCircle className="h-12 w-12 text-green-500 mb-4 opacity-20" />
                                            <h4 className="text-slate-900 dark:text-white font-bold">Alles bijgewerkt!</h4>
                                            <p className="text-slate-500 dark:text-slate-400 text-sm">Er zijn geen inschrijvingen die op goedkeuring wachten.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredSignups.map(s => (
                                    <tr key={s.id} className={`hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-colors ${selectedIds.has(s.id) ? 'bg-purple-50 dark:bg-purple-900/10' : ''}`}>
                                        <td className="p-4 text-center">
                                            <button onClick={() => toggleSelectOne(s.id)} className={`transition-colors ${selectedIds.has(s.id) ? 'text-purple-600' : 'text-slate-300'}`}>
                                                {selectedIds.has(s.id) ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                                            </button>
                                        </td>
                                        <td className="p-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                            {new Date(s.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-bold text-slate-900 dark:text-white truncate">{s.first_name} {s.last_name}</span>
                                                <span className="text-xs text-slate-400 truncate">{s.email}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <Tag className="h-3.5 w-3.5 text-slate-400" />
                                                <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">{s.product_name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${s.payment_status === 'paid' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
                                                {s.payment_status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleApprove(s.id, s.type)}
                                                    disabled={!!isProcessing}
                                                    className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/40 transition-all disabled:opacity-50"
                                                >
                                                    {isProcessing === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                                </button>
                                                <button 
                                                    onClick={() => handleReject(s.id, s.type)}
                                                    disabled={!!isProcessing}
                                                    className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-all disabled:opacity-50"
                                                >
                                                    {isProcessing === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
