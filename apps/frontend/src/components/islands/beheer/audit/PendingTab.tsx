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
        <div className="form-card">
            <div className="card-header-flex">
                <div className="flex-row-scroll-sm">
                    <span className="text-xs font-semibold tracking-tight text-(--beheer-text-muted)">Lidmaatschap Wachtrij</span>
                </div>
                
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBulkApprove}
                        disabled={selectedIds.size === 0 || !!isBulkProcessing}
                        className={selectedIds.size > 0 ? 'icon-button-active' : 'icon-button-disabled'}
                        title="Bulk Goedkeuren"
                        type="button">
                        {isBulkProcessing === 'approve' ? <Loader2 className="size-5 animate-spin" /> : <CheckCircle className="size-5" />}
                    </button>
                    <button
                        onClick={onBulkReject}
                        disabled={selectedIds.size === 0 || !!isBulkProcessing}
                        className={selectedIds.size > 0 ? 'icon-button-inactive' : 'icon-button-disabled'}
                        title="Bulk Afwijzen"
                        type="button">
                        {isBulkProcessing === 'reject' ? <Loader2 className="size-5 animate-spin" /> : <XCircle className="size-5" />}
                    </button>
                    
                    <button
                        onClick={onRefresh}
                        className="icon-button p-2 text-(--beheer-text-muted) hover:text-(--beheer-accent)"
                        type="button">
                        <RefreshCw className="size-5" />
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="table-header-row">
                            <th className="w-12 p-4 text-center">
                                <button
                                    onClick={onToggleSelectAll}
                                    className="icon-button text-(--beheer-text-muted) hover:text-(--beheer-accent)"
                                    type="button">
                                    {selectedIds.size > 0 && selectedIds.size === filteredSignups.length ? <CheckSquare className="size-5 text-(--beheer-accent)" /> : <Square className="size-5" />}
                                </button>
                            </th>
                            <th className="table-th-beheer">Datum</th>
                            <th className="table-th-beheer">Naam</th>
                            <th className="table-th-beheer">Product</th>
                            <th className="table-th-beheer text-center">Status</th>
                            <th className="table-th-beheer text-right">Acties</th>
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
                                <tr key={s.id} className={selectedIds.has(s.id) ? 'group table-row-interactive bg-(--beheer-accent)/5' : 'group table-row-interactive'}>
                                    <td className="p-4 text-center">
                                        <button
                                            onClick={() => onToggleSelectOne(s.id)}
                                            className={`icon-button transition-colors ${selectedIds.has(s.id) ? 'text-(--beheer-accent)' : 'text-(--beheer-text-muted)/30'}`}
                                            type="button">
                                            {selectedIds.has(s.id) ? <CheckSquare className="size-5" /> : <Square className="size-5" />}
                                        </button>
                                    </td>
                                    <td className="table-td-muted">
                                        {formatDate(s.created_at, 'dd-MM-yyyy HH:mm')}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex min-w-0 flex-col">
                                            <span className="table-cell-title-hover">{s.first_name} {s.last_name}</span>
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
                                        <span className={s.payment_status === 'paid' ? 'badge-pill-success' : 'badge-pill-warning'}>
                                            {s.payment_status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-end gap-3">
                                            <button
                                                onClick={() => onApprove(s.id, s.type)}
                                                disabled={!!isProcessing}
                                                className="icon-button-active"
                                                type="button">
                                                {isProcessing === s.id ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}
                                            </button>
                                            <button
                                                onClick={() => onReject(s.id, s.type)}
                                                disabled={!!isProcessing}
                                                className="icon-button-inactive"
                                                type="button">
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
