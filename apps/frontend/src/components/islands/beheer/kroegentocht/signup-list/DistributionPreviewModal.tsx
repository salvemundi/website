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
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm duration-200">
            <div className="animate-in fade-in zoom-in-95 flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-(--border-color)/30 bg-(--bg-card) shadow-2xl duration-150">
                <div className="flex items-center justify-between border-b border-(--border-color)/20 p-6">
                    <div>
                        <h2 className="flex items-center gap-2 text-lg font-bold text-(--text-main)">
                            <Sparkles className="size-5 animate-pulse text-(--theme-purple)" />
                            Automatische Verdeling Preview
                        </h2>
                        <p className="mt-1 text-xs text-(--text-muted)">
                            Controleer de voorgestelde indeling voordat je deze definitief opslaat. Bestaande groepsindelingen worden hiermee overschreven.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="icon-button cursor-pointer rounded-lg p-2 text-(--text-muted) transition-colors hover:bg-(--bg-main)/50 hover:text-(--text-main)"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                <div className="flex-1 space-y-6 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {previewData.groups.map(({ name: groupName, signups: assignedSignups, ticketCount }) => (
                            <div key={groupName} className="space-y-3 rounded-xl border border-(--border-color)/20 bg-(--bg-main)/30 p-4">
                                <div className="flex items-center justify-between border-b border-(--border-color)/10 pb-2">
                                    <span className="text-xs font-bold text-(--text-main)">{groupName}</span>
                                    <span className="rounded-full border border-(--theme-purple)/20 bg-(--theme-purple)/10 px-2 py-0.5 text-[10px] font-bold text-(--theme-purple)">
                                        {ticketCount} tickets
                                    </span>
                                </div>
                                <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
                                    {assignedSignups.length === 0 ? (
                                        <p className="text-[10px] text-(--text-muted) italic">Geen aanmeldingen verdeeld naar deze groep</p>
                                    ) : (
                                        assignedSignups.map((s, idx) => {
                                            const changed = s.oldGroup !== groupName;
                                            return (
                                                <div key={idx} className="flex items-center justify-between rounded-lg border border-(--border-color)/10 bg-(--bg-card)/50 px-2 py-1.5 text-[11px]">
                                                    <div className="flex min-w-0 flex-col">
                                                        <span className="truncate font-semibold text-(--text-main)" title={s.name}>{s.name}</span>
                                                        {changed && (
                                                            <span className="text-[9px] font-medium text-amber-500">
                                                                Was: {s.oldGroup || 'Niet ingedeeld'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="shrink-0 text-[10px] font-bold text-(--text-muted)">
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

                <div className="flex flex-col items-center justify-between gap-4 border-t border-(--border-color)/20 bg-(--bg-main)/20 p-6 sm:flex-row">
                    <div className="text-xs font-semibold text-(--text-muted)">
                        Totaal te verdelen: <strong className="text-(--text-main)">{previewData.assignments.length} aanmeldingen</strong>
                    </div>
                    <div className="flex w-full gap-3 sm:w-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            className="beheer-button w-full cursor-pointer rounded-xl border border-(--border-color)/30 bg-(--bg-card) px-6 py-2.5 text-center text-xs font-semibold text-(--text-muted) transition-all hover:bg-(--bg-main) hover:text-(--text-main) active:scale-95 sm:w-auto"
                        >
                            Annuleren
                        </button>
                        <button
                            type="button"
                            onClick={onSave}
                            disabled={isPending}
                            className="beheer-button flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-green-600 px-8 py-2.5 text-xs font-semibold text-white shadow-lg shadow-green-600/10 transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 sm:w-auto"
                        >
                            {isPending && <RefreshCw className="size-4 animate-spin" />}
                            Indeling Opslaan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
