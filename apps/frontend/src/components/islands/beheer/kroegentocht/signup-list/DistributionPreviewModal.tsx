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
        <div className="modal-wrapper">
            <div
                className="modal-backdrop"
                onClick={onClose}
            />

            <div className="modal-content z-10 max-w-4xl">
                <div className="modal-header">
                    <div>
                        <h2 className="section-title-sm">
                            <div className="icon-box">
                                <Sparkles className="size-4 animate-pulse text-theme-purple" />
                            </div>
                            Automatische Verdeling Preview
                        </h2>
                        <p className="mt-1 text-xs text-(--text-muted)">
                            Controleer de voorgestelde indeling voordat je deze definitief opslaat. Bestaande groepsindelingen worden hiermee overschreven.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="icon-button"
                        type="button"
                        aria-label="Sluiten"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                <div className="modal-body-scroll">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {previewData.groups.map(({ name: groupName, signups: assignedSignups, ticketCount }) => (
                            <div key={groupName} className="beheer-row-card-box">
                                <div className="beheer-row-card-header">
                                    <span className="text-xs font-bold text-(--text-main)">{groupName}</span>
                                    <span className="badge-status bg-theme-purple/10 text-theme-purple">
                                        {ticketCount} tickets
                                    </span>
                                </div>
                                <div className="scrollable-list-box">
                                    {assignedSignups.length === 0 ? (
                                        <p className="text-xs text-(--text-muted) italic">Geen aanmeldingen verdeeld naar deze groep</p>
                                    ) : (
                                        assignedSignups.map((s, idx) => {
                                            const changed = s.oldGroup !== groupName;
                                            return (
                                                <div key={idx} className="beheer-card-mini">
                                                    <div className="flex min-w-0 flex-col">
                                                        <span className="truncate font-semibold text-(--text-main)" title={s.name}>{s.name}</span>
                                                        {changed && (
                                                            <span className="badge-warning-text">
                                                                Was: {s.oldGroup || 'Niet ingedeeld'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="shrink-0 text-xs font-medium text-(--text-muted)">
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

                <div className="modal-footer-row">
                    <div className="text-xs font-medium text-(--text-muted)">
                        Totaal te verdelen: <strong className="text-(--text-main)">{previewData.assignments.length} aanmeldingen</strong>
                    </div>
                    <div className="flex w-full gap-3 sm:w-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary w-full sm:w-auto"
                        >
                            Annuleren
                        </button>
                        <button
                            type="button"
                            onClick={onSave}
                            disabled={isPending}
                            className="form-button w-full sm:w-auto"
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
