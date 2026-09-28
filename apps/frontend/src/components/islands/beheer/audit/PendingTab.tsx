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
        <div className="overflow-hidden rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-(--beheer-border)/50 p-6">
                <div className="custom-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
                    <span className="text-xs font-semibold tracking-tight text-(--beheer-text-muted)">Lidmaatschap Wachtrij</span>
                </div>
                
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBulkApprove}
                        disabled={selectedIds.size === 0 || !!isBulkProcessing}
                        className={`beheer-button rounded-xl border p-2 transition-all ${
                            selectedIds.size > 0 
                                ? 'border-(--beheer-active)/20 bg-(--beheer-active)/10 text-(--beheer-active) hover:bg-(--beheer-active) hover:text-white' 
                                : 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-300 opacity-50'
                        }`}
                        title="Bulk Goedkeuren"
                    >
                        {isBulkProcessing === 'approve' ? <Loader2 className="size-5 animate-spin" /> : <CheckCircle className="size-5" />}
                    </button>
                    <button
                        onClick={onBulkReject}
                        disabled={selectedIds.size === 0 || !!isBulkProcessing}
                        className={`beheer-button rounded-xl border p-2 transition-all ${
                            selectedIds.size > 0 
                                ? 'border-(--beheer-inactive)/20 bg-(--beheer-inactive)/10 text-(--beheer-inactive) hover:bg-(--beheer-inactive) hover:text-white' 
                                : 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-300 opacity-50'
                        }`}
                        title="Bulk Afwijzen"
                    >
                        {isBulkProcessing === 'reject' ? <Loader2 className="size-5 animate-spin" /> : <XCircle className="size-5" />}
                    </button>
                    
                    <button 
                        onClick={onRefresh}
                        className="icon-button p-2 text-(--beheer-text-muted) transition-colors hover:text-(--beheer-accent)"
                    >
                        <RefreshCw className="size-5" />
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-(--beheer-border)/50 bg-(--beheer-card-soft)/50">
                            <th className="w-12 p-4 text-center">
                                <button onClick={onToggleSelectAll} className="icon-button text-(--beheer-text-muted) transition-colors hover:text-(--beheer-accent)">
                                    {selectedIds.size > 0 && selectedIds.size === filteredSignups.length ? <CheckSquare className="size-5 text-(--beheer-accent)" /> : <Square className="size-5" />}
                                </button>
                            </th>
                            <th className="p-4 text-xs font-semibold tracking-tight text-(--beheer-text-muted)">Datum</th>
                            <th className="p-4 text-xs font-semibold tracking-tight text-(--beheer-text-muted)">Naam</th>
                            <th className="p-4 text-xs font-semibold tracking-tight text-(--beheer-text-muted)">Product</th>
                            <th className="p-4 text-center text-xs font-semibold tracking-tight text-(--beheer-text-muted)">Status</th>
                            <th className="p-4 text-right text-xs font-semibold tracking-tight text-(--beheer-text-muted)">Acties</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-(--beheer-border)/10">
                        {filteredSignups.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-20 text-center">
                                    <div className="flex flex-col items-center">
                                        <CheckCircle className="mb-4 size-12 text-(--beheer-active) opacity-20" />
                                        <h4 className="text-lg font-semibold tracking-tight text-(--beheer-text)">Alles bijgewerkt!</h4>
                                        <p className="mt-2 text-sm font-medium text-(--beheer-text-muted)">Er zijn geen inschrijvingen die op goedkeuring wachten.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredSignups.map(s => (
                                <tr key={s.id} className={`group transition-colors hover:bg-(--beheer-accent)/2 ${selectedIds.has(s.id) ? 'bg-(--beheer-accent)/5' : ''}`}>
                                    <td className="p-4 text-center">
                                        <button onClick={() => onToggleSelectOne(s.id)} className={`icon-button transition-colors ${selectedIds.has(s.id) ? 'text-(--beheer-accent)' : 'text-(--beheer-text-muted)/30'}`}>
                                            {selectedIds.has(s.id) ? <CheckSquare className="size-5" /> : <Square className="size-5" />}
                                        </button>
                                    </td>
                                    <td className="p-4 text-xs font-medium tracking-tight whitespace-nowrap text-(--beheer-text-muted)">
                                        {formatDate(s.created_at, 'dd-MM-yyyy HH:mm')}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex min-w-0 flex-col">
                                            <span className="truncate font-semibold tracking-tight text-(--beheer-text) transition-colors group-hover:text-(--beheer-accent)">{s.first_name} {s.last_name}</span>
                                            <span className="truncate text-xs font-medium text-(--beheer-text-muted)">{s.email}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <Tag className="size-3.5 text-(--beheer-text-muted)" />
                                            <span className="text-xs font-semibold tracking-tight text-(--beheer-text)">{s.product_name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold tracking-tight ${s.payment_status === 'paid' ? 'border-(--beheer-active)/20 bg-(--beheer-active)/10 text-(--beheer-active)' : 'border-amber-500/20 bg-amber-500/10 text-amber-500'}`}>
                                            {s.payment_status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-end gap-3">
                                            <button 
                                                onClick={() => onApprove(s.id, s.type)}
                                                disabled={!!isProcessing}
                                                className="icon-button rounded-xl border border-(--beheer-active)/20 bg-(--beheer-active)/10 p-2 text-(--beheer-active) transition-all hover:bg-(--beheer-active) hover:text-white disabled:opacity-50"
                                            >
                                                {isProcessing === s.id ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}
                                            </button>
                                            <button 
                                                onClick={() => onReject(s.id, s.type)}
                                                disabled={!!isProcessing}
                                                className="icon-button rounded-xl border border-(--beheer-inactive)/20 bg-(--beheer-inactive)/10 p-2 text-(--beheer-inactive) transition-all hover:bg-(--beheer-inactive) hover:text-white disabled:opacity-50"
                                            >
                                                {isProcessing === s.id ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
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
