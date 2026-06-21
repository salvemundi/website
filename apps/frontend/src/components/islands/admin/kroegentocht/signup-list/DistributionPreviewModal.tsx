'use client';

import { RefreshCw, Sparkles, X } from 'lucide-react';

interface PreviewSignup {
    signupId: number;
    name: string;
    amountTickets: number;
    oldGroup: string | null;
}

interface DistributionPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    previewData: {
        assignments: { signupId: number; groupName: string }[];
        groups: { name: string; signups: PreviewSignup[]; ticketCount: number }[];
    } | null;
    isPending: boolean;
    onSave: () => void;
}

export default function DistributionPreviewModal({
    isOpen,
    onClose,
    previewData,
    isPending,
    onSave
}: DistributionPreviewModalProps) {
    if (!isOpen || !previewData) return null;

    return (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-(--bg-card) border border-(--border-color)/30 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="p-6 border-b border-(--border-color)/20 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-(--text-main) flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-(--theme-purple) animate-pulse" />
                            Automatische Verdeling Preview
                        </h2>
                        <p className="text-xs text-(--text-muted) mt-1">
                            Controleer de voorgestelde indeling voordat je deze definitief opslaat. Bestaande groepsindelingen worden hiermee overschreven.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-(--text-muted) hover:bg-(--bg-main)/50 hover:text-(--text-main) transition-colors cursor-pointer"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {previewData.groups.map(({ name: groupName, signups: assignedSignups, ticketCount }) => (
                            <div key={groupName} className="bg-(--bg-main)/30 border border-(--border-color)/20 rounded-xl p-4 space-y-3">
                                <div className="flex justify-between items-center border-b border-(--border-color)/10 pb-2">
                                    <span className="font-bold text-xs text-(--text-main)">{groupName}</span>
                                    <span className="px-2 py-0.5 bg-(--theme-purple)/10 text-(--theme-purple) border border-(--theme-purple)/20 rounded-full text-[10px] font-bold">
                                        {ticketCount} tickets
                                    </span>
                                </div>
                                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                    {assignedSignups.length === 0 ? (
                                        <p className="text-[10px] text-(--text-muted) italic">Geen aanmeldingen verdeeld naar deze groep</p>
                                    ) : (
                                        assignedSignups.map((s, idx) => {
                                            const changed = s.oldGroup !== groupName;
                                            return (
                                                <div key={idx} className="flex justify-between items-center text-[11px] bg-(--bg-card)/50 border border-(--border-color)/10 px-2 py-1.5 rounded-lg">
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-semibold text-(--text-main) truncate" title={s.name}>{s.name}</span>
                                                        {changed && (
                                                            <span className="text-[9px] text-amber-500 font-medium">
                                                                Was: {s.oldGroup || 'Niet ingedeeld'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] font-bold text-(--text-muted) shrink-0">
                                                        {s.amountTickets} {s.amountTickets === 1 ? 'ticket' : 'tickets'}
                                                    </span>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 border-t border-(--border-color)/20 bg-(--bg-main)/20 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-xs text-(--text-muted) font-semibold">
                        Totaal te verdelen: <strong className="text-(--text-main)">{previewData.assignments.length} aanmeldingen</strong>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full sm:w-auto px-6 py-2.5 bg-(--bg-card) border border-(--border-color)/30 rounded-xl text-xs font-semibold text-(--text-muted) hover:text-(--text-main) hover:bg-(--bg-main) transition-all active:scale-95 cursor-pointer text-center"
                        >
                            Annuleren
                        </button>
                        <button
                            type="button"
                            onClick={onSave}
                            disabled={isPending}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-2.5 bg-green-600 hover:opacity-90 text-white font-semibold text-xs rounded-xl shadow-lg shadow-green-600/10 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                            {isPending && <RefreshCw className="h-4 w-4 animate-spin" />}
                            Indeling Opslaan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
