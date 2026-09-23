'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Check, X, Mail, ShieldCheck, Clock, Link2 } from 'lucide-react';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import AdminModal from '@/components/ui/admin/AdminModal';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import {
    deleteVacancyAction,
    approveSubmissionAction,
    rejectSubmissionAction,
    deleteSubmissionAction
} from '@/server/actions/vacancies/vacancies-admin.actions';
import type { VacancySubmissionDTO } from '@salvemundi/validations';

interface AdminVacancyRow {
    id: number;
    title: string;
    company: string;
    type: string;
    is_visible: boolean;
    published_at: string;
}

interface AdminVacanciesIslandProps {
    vacancies: AdminVacancyRow[];
    submissions: VacancySubmissionDTO[];
}

type Tab = 'vacatures' | 'aanmeldingen';

const STATUS_LABELS: Partial<Record<string, { label: string; className: string }>> = {
    pending_verification: { label: 'Wacht op e-mailverificatie', className: 'bg-(--theme-warning)/15 text-(--theme-warning)' },
    pending_review: { label: 'Klaar voor beoordeling', className: 'bg-(--theme-purple)/15 text-(--theme-purple)' },
    approved: { label: 'Goedgekeurd', className: 'bg-(--theme-success)/15 text-(--theme-success)' },
    rejected: { label: 'Afgewezen', className: 'bg-(--theme-error)/15 text-(--theme-error)' }
};

export default function AdminVacanciesIsland({ vacancies, submissions }: AdminVacanciesIslandProps) {
    const router = useRouter();
    const { toast, showToast, hideToast } = useAdminToast();
    const [tab, setTab] = useState<Tab>('vacatures');
    const [isPending, startTransition] = useTransition();
    const [rejectTarget, setRejectTarget] = useState<VacancySubmissionDTO | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    const pendingCount = useMemo(() => submissions.filter((s) => s.status === 'pending_review').length, [submissions]);

    const handleDelete = (id: number, title: string) => {
        if (!window.confirm(`Weet je zeker dat je "${title}" wilt verwijderen?`)) return;
        startTransition(async () => {
            const result = await deleteVacancyAction(id);
            if (result.success) {
                showToast('Vacature verwijderd.', 'success');
                router.refresh();
            } else {
                showToast(result.error || 'Verwijderen mislukt.', 'error');
            }
        });
    };

    const handleApprove = (submission: VacancySubmissionDTO) => {
        startTransition(async () => {
            const result = await approveSubmissionAction(submission.id);
            if (result.success) {
                showToast('Vacature goedgekeurd en gepubliceerd.', 'success');
                router.refresh();
            } else {
                showToast(result.error || 'Goedkeuren mislukt.', 'error');
            }
        });
    };

    const handleDeleteSubmission = (submission: VacancySubmissionDTO) => {
        if (!window.confirm(`Weet je zeker dat je de aanmelding "${submission.title}" wilt verwijderen?`)) return;
        startTransition(async () => {
            const result = await deleteSubmissionAction(submission.id);
            if (result.success) {
                showToast('Aanmelding verwijderd.', 'success');
                router.refresh();
            } else {
                showToast(result.error || 'Verwijderen mislukt.', 'error');
            }
        });
    };

    const handleCopySubmissionLink = async () => {
        const link = `${window.location.origin}/bijbanenbank/plaatsen`;
        await navigator.clipboard.writeText(link);
        showToast('Aanmeldlink gekopieerd naar klembord', 'success');
    };

    const handleReject = () => {
        if (!rejectTarget) return;
        startTransition(async () => {
            const result = await rejectSubmissionAction(rejectTarget.id, rejectReason);
            if (result.success) {
                showToast('Aanmelding afgewezen.', 'success');
                setRejectTarget(null);
                setRejectReason('');
                router.refresh();
            } else {
                showToast(result.error || 'Afwijzen mislukt.', 'error');
            }
        });
    };

    return (
        <div className="w-full">
            <AdminToolbar
                title="Bijbanenbank Beheer"
                backHref="/beheer"
                actions={
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={() => { void handleCopySubmissionLink(); }}
                            className="squircle form-button flex items-center justify-center gap-1.5 rounded-xl border border-(--beheer-border) bg-(--beheer-card-bg) px-4 py-2 text-xs font-semibold whitespace-nowrap text-(--beheer-text) shadow-sm transition-all hover:border-(--beheer-accent)/50 active:scale-95"
                        >
                            <Link2 className="size-4" />
                            Aanmeldlink kopiëren
                        </button>
                        <Link
                            href="/beheer/bijbanenbank/nieuw"
                            className="squircle flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-theme-purple px-4 py-2 text-xs font-semibold whitespace-nowrap text-white shadow-lg transition-all hover:opacity-90 active:scale-95"
                        >
                            <Plus className="size-4" />
                            Nieuwe Vacature
                        </Link>
                    </div>
                }
            />

            <div className="admin-container flex flex-col gap-6 py-4 md:py-8">
                <div className="flex w-full rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-soft) p-1 shadow-sm lg:w-auto">
                    <button
                        type="button"
                        onClick={() => setTab('vacatures')}
                        className={`tab-button flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${tab === 'vacatures' ? 'bg-(--beheer-accent) text-white shadow-sm' : 'text-(--beheer-text-muted) hover:text-(--beheer-text)'}`}
                    >
                        Vacatures ({vacancies.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('aanmeldingen')}
                        className={`tab-button flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${tab === 'aanmeldingen' ? 'bg-(--beheer-accent) text-white shadow-sm' : 'text-(--beheer-text-muted) hover:text-(--beheer-text)'}`}
                    >
                        Aanmeldingen {pendingCount > 0 && `(${pendingCount})`}
                    </button>
                </div>

                {tab === 'vacatures' ? (
                    <div className="flex flex-col gap-3">
                        {vacancies.length === 0 ? (
                            <p className="py-8 text-center text-sm text-(--text-muted)">Nog geen vacatures aangemaakt.</p>
                        ) : (
                            vacancies.map((vacancy) => (
                                <div key={vacancy.id} className="flex items-center justify-between gap-4 rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) p-4">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase ${vacancy.type === 'internship' ? 'bg-(--theme-purple)' : 'bg-(--theme-success)'}`}>
                                                {vacancy.type === 'internship' ? 'Stage' : 'Bijbaan'}
                                            </span>
                                            {!vacancy.is_visible && (
                                                <span className="rounded-full bg-(--bg-soft) px-2 py-0.5 text-[10px] font-bold tracking-wider text-(--text-muted) uppercase">Verborgen</span>
                                            )}
                                        </div>
                                        <p className="mt-1 truncate font-bold text-(--beheer-text)">{vacancy.title}</p>
                                        <p className="text-xs text-(--beheer-text-muted)">{vacancy.company}</p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                        <Link
                                            href={`/beheer/bijbanenbank/${vacancy.id}/bewerken`}
                                            className="rounded-lg bg-(--beheer-card-soft) p-2 text-(--beheer-text-muted) transition-colors hover:text-(--beheer-accent)"
                                            title="Bewerken"
                                        >
                                            <Pencil className="size-4" />
                                        </Link>
                                        <button
                                            type="button"
                                            disabled={isPending}
                                            onClick={() => handleDelete(vacancy.id, vacancy.title)}
                                            className="icon-button rounded-lg bg-(--beheer-card-soft) p-2 text-(--beheer-text-muted) transition-colors hover:text-(--theme-error) disabled:opacity-50"
                                            title="Verwijderen"
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {submissions.length === 0 ? (
                            <p className="py-8 text-center text-sm text-(--text-muted)">Nog geen aanmeldingen ontvangen.</p>
                        ) : (
                            submissions.map((submission) => {
                                const statusMeta = STATUS_LABELS[submission.status] || {
                                    label: String(submission.status),
                                    className: 'bg-(--bg-soft) text-(--text-muted)'
                                };
                                return (
                                    <div key={submission.id} className="flex flex-col gap-3 rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase ${submission.type === 'internship' ? 'bg-(--theme-purple)' : 'bg-(--theme-success)'}`}>
                                                        {submission.type === 'internship' ? 'Stage' : 'Bijbaan'}
                                                    </span>
                                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${statusMeta.className}`}>
                                                        {statusMeta.label}
                                                    </span>
                                                </div>
                                                <p className="mt-1 font-bold text-(--beheer-text)">{submission.title}</p>
                                                <p className="flex items-center gap-1.5 text-xs text-(--beheer-text-muted)">
                                                    <Mail className="size-3" /> {submission.company} &middot; {submission.contact_email}
                                                </p>
                                                {submission.status === 'rejected' && submission.rejection_reason && (
                                                    <p className="mt-1 text-xs text-(--theme-error)">Reden: {submission.rejection_reason}</p>
                                                )}
                                            </div>
                                            {submission.status === 'pending_review' && (
                                                <div className="flex shrink-0 items-center gap-2">
                                                    <button
                                                        type="button"
                                                        disabled={isPending}
                                                        onClick={() => handleApprove(submission)}
                                                        className="btn-approve flex items-center gap-1.5 rounded-lg bg-(--theme-success) px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                                                    >
                                                        <Check className="size-3.5" /> Goedkeuren
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={isPending}
                                                        onClick={() => { setRejectTarget(submission); setRejectReason(''); }}
                                                        className="btn-reject flex items-center gap-1.5 rounded-lg bg-(--theme-error) px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                                                    >
                                                        <X className="size-3.5" /> Afwijzen
                                                    </button>
                                                </div>
                                            )}
                                            {submission.status === 'pending_verification' && (
                                                <div className="flex shrink-0 items-center gap-2">
                                                    <button
                                                        type="button"
                                                        disabled={isPending}
                                                        onClick={() => handleDeleteSubmission(submission)}
                                                        className="btn-reject flex items-center gap-1.5 rounded-lg bg-(--theme-error) px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                                                        title="Verwijderen voordat het e-mailadres is bevestigd"
                                                    >
                                                        <Trash2 className="size-3.5" /> Verwijderen
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-[11px] font-medium text-(--beheer-text-muted)">
                                            <span className="flex items-center gap-1">
                                                <ShieldCheck className="size-3.5" />
                                                {submission.verified_at ? 'E-mail geverifieerd' : 'Nog niet geverifieerd'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="size-3.5" />
                                                Aangemeld op {new Date(submission.created_at).toLocaleDateString('nl-NL')}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            <AdminModal
                title="Aanmelding afwijzen"
                isOpen={!!rejectTarget}
                onClose={() => setRejectTarget(null)}
                maxWidth="md"
            >
                <div className="space-y-4">
                    <p className="text-sm text-(--text-muted)">
                        Geef een reden op voor de afwijzing van &quot;{rejectTarget?.title}&quot;. Deze reden wordt per e-mail naar het bedrijf gestuurd.
                    </p>
                    <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={4}
                        className="form-input w-full"
                        placeholder="Bijv. Deze vacature sluit niet aan bij onze doelgroep."
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setRejectTarget(null)}
                            className="btn-cancel rounded-xl px-4 py-2 text-sm font-bold text-(--text-muted) hover:text-(--text-main)"
                        >
                            Annuleren
                        </button>
                        <button
                            type="button"
                            disabled={isPending || rejectReason.trim().length === 0}
                            onClick={handleReject}
                            className="btn-reject rounded-xl bg-(--theme-error) px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                        >
                            Afwijzen
                        </button>
                    </div>
                </div>
            </AdminModal>

            <AdminToast toast={toast} onClose={hideToast} />
        </div>
    );
}
