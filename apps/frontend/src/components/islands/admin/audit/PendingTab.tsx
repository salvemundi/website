'use client';

import React from 'react';
import { 
    CheckSquare, Square, RefreshCw, CheckCircle, XCircle, Loader2, Tag, Clock
} from 'lucide-react';
import { PendingSignup } from '@salvemundi/validations';
import { formatDate } from '@/shared/lib/utils/date';

interface PendingTabProps {
    isLoading: boolean;
    isProcessing: string | null;
    isBulkProcessing: 'approve' | 'reject' | null;
    filteredSignups: PendingSignup[];
    selectedIds: Set<string>;
    filterType: string;
    onSetFilterType: (type: string) => void;
    onToggleSelectAll: () => void;
    onToggleSelectOne: (id: string) => void;
    onApprove: (id: string, type: string) => void;
    onReject: (id: string, type: string) => void;
    onBulkApprove: () => void;
    onBulkReject: () => void;
    onRefresh: () => void;
}

export default function PendingTab({
    isLoading,
    isProcessing,
    isBulkProcessing,
    filteredSignups,
    selectedIds,
    filterType,
    onSetFilterType,
    onToggleSelectAll,
    onToggleSelectOne,
    onApprove,
    onReject,
    onBulkApprove,
    onBulkReject,
    onRefresh
}: PendingTabProps) {
    return (
        <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] shadow-xl overflow-hidden">
            <div className="p-6 border-b border-[var(--beheer-border)]/50 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    {['all', 'event', 'trip', 'pub_crawl', 'membership'].map(type => (
                        <button
                            key={type}
                            onClick={() => onSetFilterType(type)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterType === type 
                                ? 'bg-[var(--beheer-accent)] text-white shadow-[var(--shadow-glow)]' 
                                : 'text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)] hover:bg-[var(--beheer-card-soft)]'}`}
                        >
                            {type.replace('_', ' ')}
                        </button>
                    ))}
                </div>
                
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBulkApprove}
                        disabled={selectedIds.size === 0 || !!isBulkProcessing || isLoading}
                        className={`p-2 rounded-xl transition-all border ${
                            selectedIds.size > 0 
                                ? 'bg-[var(--beheer-active)]/10 text-[var(--beheer-active)] border-[var(--beheer-active)]/20 hover:bg-[var(--beheer-active)] hover:text-white' 
                                : 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed opacity-50'
                        }`}
                        title="Bulk Goedkeuren"
                    >
                        {isBulkProcessing === 'approve' ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
                    </button>
                    <button
                        onClick={onBulkReject}
                        disabled={selectedIds.size === 0 || !!isBulkProcessing || isLoading}
                        className={`p-2 rounded-xl transition-all border ${
                            selectedIds.size > 0 
                                ? 'bg-[var(--beheer-inactive)]/10 text-[var(--beheer-inactive)] border-[var(--beheer-inactive)]/20 hover:bg-[var(--beheer-inactive)] hover:text-white' 
                                : 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed opacity-50'
                        }`}
                        title="Bulk Afwijzen"
                    >
                        {isBulkProcessing === 'reject' ? <Loader2 className="h-5 w-5 animate-spin" /> : <XCircle className="h-5 w-5" />}
                    </button>
                    
                    <button 
                        onClick={onRefresh}
                        disabled={isLoading || !!isBulkProcessing}
                        className="p-2 text-slate-400 hover:text-purple-600 transition-colors disabled:opacity-30"
                    >
                        <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-[var(--beheer-card-soft)]/50 border-b border-[var(--beheer-border)]/50">
                            <th className="p-4 w-12 text-center">
                                <button onClick={onToggleSelectAll} className="text-[var(--beheer-text-muted)] hover:text-[var(--beheer-accent)] transition-colors">
                                    {selectedIds.size > 0 && selectedIds.size === filteredSignups.length ? <CheckSquare className="h-5 w-5 text-[var(--beheer-accent)]" /> : <Square className="h-5 w-5" />}
                                </button>
                            </th>
                            <th className="p-4 text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">Datum</th>
                            <th className="p-4 text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">Naam</th>
                            <th className="p-4 text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">Product</th>
                            <th className="p-4 text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest text-center">Status</th>
                            <th className="p-4 text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest text-right">Acties</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--beheer-border)]/10">
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
                                        <CheckCircle className="h-12 w-12 text-[var(--beheer-active)] mb-4 opacity-20" />
                                        <h4 className="text-[var(--beheer-text)] font-black uppercase tracking-tight">Alles bijgewerkt!</h4>
                                        <p className="text-[var(--beheer-text-muted)] font-bold uppercase tracking-widest text-[10px] mt-2">Er zijn geen inschrijvingen die op goedkeuring wachten.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredSignups.map(s => (
                                <tr key={s.id} className={`hover:bg-[var(--beheer-accent)]/[0.02] transition-colors group ${selectedIds.has(s.id) ? 'bg-[var(--beheer-accent)]/[0.05]' : ''}`}>
                                    <td className="p-4 text-center">
                                        <button onClick={() => onToggleSelectOne(s.id)} className={`transition-colors ${selectedIds.has(s.id) ? 'text-[var(--beheer-accent)]' : 'text-[var(--beheer-text-muted)]/30'}`}>
                                            {selectedIds.has(s.id) ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                                        </button>
                                    </td>
                                    <td className="p-4 text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest whitespace-nowrap">
                                        {formatDate(s.created_at, true)}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-black text-[var(--beheer-text)] uppercase tracking-tight group-hover:text-[var(--beheer-accent)] transition-colors truncate">{s.first_name} {s.last_name}</span>
                                            <span className="text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest truncate">{s.email}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <Tag className="h-3.5 w-3.5 text-[var(--beheer-text-muted)]" />
                                            <span className="text-[10px] text-[var(--beheer-text)] font-black uppercase tracking-widest">{s.product_name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${s.payment_status === 'paid' ? 'bg-[var(--beheer-active)]/10 text-[var(--beheer-active)] border-[var(--beheer-active)]/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                            {s.payment_status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-end gap-3">
                                            <button 
                                                onClick={() => onApprove(s.id, s.type)}
                                                disabled={!!isProcessing}
                                                className="p-2 bg-[var(--beheer-active)]/10 text-[var(--beheer-active)] rounded-xl hover:bg-[var(--beheer-active)] hover:text-white transition-all disabled:opacity-50 border border-[var(--beheer-active)]/20"
                                            >
                                                {isProcessing === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                            </button>
                                            <button 
                                                onClick={() => onReject(s.id, s.type)}
                                                disabled={!!isProcessing}
                                                className="p-2 bg-[var(--beheer-inactive)]/10 text-[var(--beheer-inactive)] rounded-xl hover:bg-[var(--beheer-inactive)] hover:text-white transition-all disabled:opacity-50 border border-[var(--beheer-inactive)]/20"
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
    );
}
