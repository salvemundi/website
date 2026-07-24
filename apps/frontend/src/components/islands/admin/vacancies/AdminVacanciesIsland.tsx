'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Check, X, Mail, ShieldCheck, Clock } from 'lucide-react';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import AdminModal from '@/components/ui/admin/AdminModal';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import {
    deleteVacancyAction,
    approveSubmissionAction,
    rejectSubmissionAction
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

const STATUS_LABELS: Record<VacancySubmissionDTO['status'], { label: string; className: string }> = {
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
                    <Link
                        href="/beheer/bijbanenbank/nieuw"
                        className="flex items-center justify-center gap-1.5 px-4 py-2 bg-theme-purple text-white rounded-xl squircle text-xs font-semibold shadow-lg hover:opacity-90 transition-all active:scale-95 border border-white/10 whitespace-nowrap"
                    >
                        <Plus className="h-4 w-4" />
                        Nieuwe Vacature
                    </Link>
                }
            />

            <div className="admin-container py-4 md:py-8 flex flex-col gap-6">
                <div className="flex p-1 bg-(--beheer-card-soft) rounded-(--beheer-radius) border border-(--beheer-border) shadow-sm w-full lg:w-auto">
                    <button
                        type="button"
                        onClick={() => setTab('vacatures')}
                        className={`tab-button flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === 'vacatures' ? 'bg-(--beheer-accent) text-white shadow-sm' : 'text-(--beheer-text-muted) hover:text-(--beheer-text)'}`}
                    >
                        Vacatures ({vacancies.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('aanmeldingen')}
                        className={`tab-button flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === 'aanmeldingen' ? 'bg-(--beheer-accent) text-white shadow-sm' : 'text-(--beheer-text-muted) hover:text-(--beheer-text)'}`}
                    >
                        Aanmeldingen {pendingCount > 0 && `(${pendingCount})`}
                    </button>
                </div>

                {tab === 'vacatures' ? (
                    <div className="flex flex-col gap-3">
                        {vacancies.length === 0 ? (
                            <p className="text-(--text-muted) text-sm py-8 text-center">Nog geen vacatures aangemaakt.</p>
                        ) : (
                            vacancies.map((vacancy) => (
                                <div key={vacancy.id} className="flex items-center justify-between gap-4 bg-(--beheer-card-bg) border border-(--beheer-border) rounded-(--beheer-radius) p-4">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider text-white ${vacancy.type === 'internship' ? 'bg-(--theme-purple)' : 'bg-(--theme-success)'}`}>
                                                {vacancy.type === 'internship' ? 'Stage' : 'Bijbaan'}
                                            </span>
                                            {!vacancy.is_visible && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-(--bg-soft) text-(--text-muted)">Verborgen</span>
                                            )}
                                        </div>
                                        <p className="font-bold text-(--beheer-text) truncate mt-1">{vacancy.title}</p>
                                        <p className="text-xs text-(--beheer-text-muted)">{vacancy.company}</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Link
                                            href={`/beheer/bijbanenbank/${vacancy.id}/bewerken`}
                                            className="p-2 rounded-lg bg-(--beheer-card-soft) text-(--beheer-text-muted) hover:text-(--beheer-accent) transition-colors"
                                            title="Bewerken"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Link>
                                        <button
                                            type="button"
                                            disabled={isPending}
                                            onClick={() => handleDelete(vacancy.id, vacancy.title)}
                                            className="icon-button p-2 rounded-lg bg-(--beheer-card-soft) text-(--beheer-text-muted) hover:text-(--theme-error) transition-colors disabled:opacity-50"
                                            title="Verwijderen"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {submissions.length === 0 ? (
                            <p className="text-(--text-muted) text-sm py-8 text-center">Nog geen aanmeldingen ontvangen.</p>
                        ) : (
                            submissions.map((submission) => {
                                const statusMeta = STATUS_LABELS[submission.status];
                                return (
                                    <div key={submission.id} className="flex flex-col gap-3 bg-(--beheer-card-bg) border border-(--beheer-border) rounded-(--beheer-radius) p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider text-white ${submission.type === 'internship' ? 'bg-(--theme-purple)' : 'bg-(--theme-success)'}`}>
                                                        {submission.type === 'internship' ? 'Stage' : 'Bijbaan'}
                                                    </span>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${statusMeta.className}`}>
                                                        {statusMeta.label}
                                                    </span>
                                                </div>
                                                <p className="font-bold text-(--beheer-text) mt-1">{submission.title}</p>
                                                <p className="text-xs text-(--beheer-text-muted) flex items-center gap-1.5">
                                                    <Mail className="h-3 w-3" /> {submission.company} &middot; {submission.contact_email}
                                                </p>
                                                {submission.status === 'rejected' && submission.rejection_reason && (
                                                    <p className="text-xs text-(--theme-error) mt-1">Reden: {submission.rejection_reason}</p>
                                                )}
                                            </div>
                                            {submission.status === 'pending_review' && (
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button
                                                        type="button"
                                                        disabled={isPending}
                                                        onClick={() => handleApprove(submission)}
                                                        className="btn-approve flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-(--theme-success) text-white text-xs font-bold disabled:opacity-50"
                                                    >
                                                        <Check className="h-3.5 w-3.5" /> Goedkeuren
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={isPending}
                                                        onClick={() => { setRejectTarget(submission); setRejectReason(''); }}
                                                        className="btn-reject flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-(--theme-error) text-white text-xs font-bold disabled:opacity-50"
                                                    >
                                                        <X className="h-3.5 w-3.5" /> Afwijzen
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-[11px] text-(--beheer-text-muted) font-medium">
                                            <span className="flex items-center gap-1">
                                                <ShieldCheck className="h-3.5 w-3.5" />
                                                {submission.verified_at ? 'E-mail geverifieerd' : 'Nog niet geverifieerd'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3.5 w-3.5" />
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
                            className="btn-cancel px-4 py-2 rounded-xl text-sm font-bold text-(--text-muted) hover:text-(--text-main)"
                        >
                            Annuleren
                        </button>
                        <button
                            type="button"
                            disabled={isPending || rejectReason.trim().length === 0}
                            onClick={handleReject}
                            className="btn-reject px-4 py-2 rounded-xl text-sm font-bold bg-(--theme-error) text-white disabled:opacity-50"
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
