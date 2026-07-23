'use client';

import { 
    CheckSquare, Square, RefreshCw, CheckCircle, XCircle, Loader2, Tag
} from 'lucide-react';
import { type PendingSignup } from '@salvemundi/validations/schema/audit.zod';
import { formatDate } from '@/shared/lib/utils/date';

interface PendingTabProps {
    isProcessing: string | null;
    isBulkProcessing: 'approve' | 'reject' | null;
    filteredSignups: PendingSignup[];
    selectedIds: Set<string>;
    onToggleSelectAll: () => void;
    onToggleSelectOne: (id: string) => void;
    onApprove: (id: string, type: string) => void;
    onReject: (id: string, type: string) => void;
    onBulkApprove: () => void;
    onBulkReject: () => void;
    onRefresh: () => void;
}

export default function PendingTab({
    isProcessing,
    isBulkProcessing,
    filteredSignups,
    selectedIds,
    onToggleSelectAll,
    onToggleSelectOne,
    onApprove,
    onReject,
    onBulkApprove,
    onBulkReject,
    onRefresh
}: PendingTabProps) {
    return (
        <div className="bg-(--beheer-card-bg) rounded-(--beheer-radius) border border-(--beheer-border) shadow-xl overflow-hidden">
            <div className="p-6 border-b border-(--beheer-border)/50 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                    <span className="text-xs font-semibold text-(--beheer-text-muted) tracking-tight">Lidmaatschap Wachtrij</span>
                </div>
                
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBulkApprove}
                        disabled={selectedIds.size === 0 || !!isBulkProcessing}
                        className={`beheer-button p-2 rounded-xl transition-all border ${
                            selectedIds.size > 0 
                                ? 'bg-(--beheer-active)/10 text-(--beheer-active) border-(--beheer-active)/20 hover:bg-(--beheer-active) hover:text-white' 
                                : 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed opacity-50'
                        }`}
                        title="Bulk Goedkeuren"
                    >
                        {isBulkProcessing === 'approve' ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
                    </button>
                    <button
                        onClick={onBulkReject}
                        disabled={selectedIds.size === 0 || !!isBulkProcessing}
                        className={`beheer-button p-2 rounded-xl transition-all border ${
                            selectedIds.size > 0 
                                ? 'bg-(--beheer-inactive)/10 text-(--beheer-inactive) border-(--beheer-inactive)/20 hover:bg-(--beheer-inactive) hover:text-white' 
                                : 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed opacity-50'
                        }`}
                        title="Bulk Afwijzen"
                    >
                        {isBulkProcessing === 'reject' ? <Loader2 className="h-5 w-5 animate-spin" /> : <XCircle className="h-5 w-5" />}
                    </button>
                    
                    <button 
                        onClick={onRefresh}
                        className="icon-button p-2 text-(--beheer-text-muted) hover:text-(--beheer-accent) transition-colors"
                    >
                        <RefreshCw className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-(--beheer-card-soft)/50 border-b border-(--beheer-border)/50">
                            <th className="p-4 w-12 text-center">
                                <button onClick={onToggleSelectAll} className="icon-button text-(--beheer-text-muted) hover:text-(--beheer-accent) transition-colors">
                                    {selectedIds.size > 0 && selectedIds.size === filteredSignups.length ? <CheckSquare className="h-5 w-5 text-(--beheer-accent)" /> : <Square className="h-5 w-5" />}
                                </button>
                            </th>
                            <th className="p-4 text-xs font-semibold text-(--beheer-text-muted) tracking-tight">Datum</th>
                            <th className="p-4 text-xs font-semibold text-(--beheer-text-muted) tracking-tight">Naam</th>
                            <th className="p-4 text-xs font-semibold text-(--beheer-text-muted) tracking-tight">Product</th>
                            <th className="p-4 text-xs font-semibold text-(--beheer-text-muted) tracking-tight text-center">Status</th>
                            <th className="p-4 text-xs font-semibold text-(--beheer-text-muted) tracking-tight text-right">Acties</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-(--beheer-border)/10">
                        {filteredSignups.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-20 text-center">
                                    <div className="flex flex-col items-center">
                                        <CheckCircle className="h-12 w-12 text-(--beheer-active) mb-4 opacity-20" />
                                        <h4 className="text-(--beheer-text) font-semibold text-lg tracking-tight">Alles bijgewerkt!</h4>
                                        <p className="text-(--beheer-text-muted) font-medium text-sm mt-2">Er zijn geen inschrijvingen die op goedkeuring wachten.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredSignups.map(s => (
                                <tr key={s.id} className={`hover:bg-(--beheer-accent)/2 transition-colors group ${selectedIds.has(s.id) ? 'bg-(--beheer-accent)/5' : ''}`}>
                                    <td className="p-4 text-center">
                                        <button onClick={() => onToggleSelectOne(s.id)} className={`icon-button transition-colors ${selectedIds.has(s.id) ? 'text-(--beheer-accent)' : 'text-(--beheer-text-muted)/30'}`}>
                                            {selectedIds.has(s.id) ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                                        </button>
                                    </td>
                                    <td className="p-4 text-xs font-medium text-(--beheer-text-muted) tracking-tight whitespace-nowrap">
                                        {formatDate(s.created_at, 'dd-MM-yyyy HH:mm')}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-semibold text-(--beheer-text) tracking-tight group-hover:text-(--beheer-accent) transition-colors truncate">{s.first_name} {s.last_name}</span>
                                            <span className="text-xs font-medium text-(--beheer-text-muted) truncate">{s.email}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <Tag className="h-3.5 w-3.5 text-(--beheer-text-muted)" />
                                            <span className="text-xs text-(--beheer-text) font-semibold tracking-tight">{s.product_name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-tight border ${s.payment_status === 'paid' ? 'bg-(--beheer-active)/10 text-(--beheer-active) border-(--beheer-active)/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                            {s.payment_status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-end gap-3">
                                            <button 
                                                onClick={() => onApprove(s.id, s.type)}
                                                disabled={!!isProcessing}
                                                className="icon-button p-2 bg-(--beheer-active)/10 text-(--beheer-active) rounded-xl hover:bg-(--beheer-active) hover:text-white transition-all disabled:opacity-50 border border-(--beheer-active)/20"
                                            >
                                                {isProcessing === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                            </button>
                                            <button 
                                                onClick={() => onReject(s.id, s.type)}
                                                disabled={!!isProcessing}
                                                className="icon-button p-2 bg-(--beheer-inactive)/10 text-(--beheer-inactive) rounded-xl hover:bg-(--beheer-inactive) hover:text-white transition-all disabled:opacity-50 border border-(--beheer-inactive)/20"
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
