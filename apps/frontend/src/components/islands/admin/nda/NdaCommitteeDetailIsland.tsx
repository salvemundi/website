'use client';

import { useState } from 'react';
import { Upload, FileText, Send, Loader2, RefreshCw, CheckCircle2, Eye, Bell, MapPin } from 'lucide-react';
import type { NdaCommitteeDetail, NdaMemberStatusRow, DerivedNdaStatus } from '@/server/queries/nda/admin-nda.queries';
import { uploadNdaTemplate, confirmNdaTemplateReady } from '@/server/actions/admin/nda/admin-nda-templates.actions';
import { sendNdaToCommitteeMembers, resendNdaInvite, recordHistoricalNdaSignature, sendRenewalReminderToMember } from '@/server/actions/admin/nda/admin-nda-signatures.actions';
import { Button, ActionButton } from '@/components/islands/admin/intro/IntroTabComponents';
import NdaSignatureLayoutEditor from '@/components/islands/admin/nda/NdaSignatureLayoutEditor';

interface Props {
    detail: NdaCommitteeDetail;
    isSecretary: boolean;
}

const statusBadge: Record<DerivedNdaStatus, { label: string; className: string }> = {
    none: { label: 'Nog niet geregistreerd', className: 'bg-(--beheer-text-muted)/10 text-(--beheer-text-muted)' },
    pending: { label: 'Verzonden', className: 'bg-amber-500/10 text-amber-500' },
    signed: { label: 'Getekend', className: 'bg-emerald-500/10 text-emerald-500' },
    expiring_soon: { label: 'Verloopt binnenkort', className: 'bg-orange-500/10 text-orange-500' },
    expired: { label: 'Verlopen', className: 'bg-red-500/10 text-red-500' },
};

function formatDate(iso: string | null): string {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('nl-NL');
}

export default function NdaCommitteeDetailIsland({ detail, isSecretary }: Props) {
    const { committee, template, members } = detail;

    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [confirming, setConfirming] = useState(false);
    const [confirmError, setConfirmError] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [sendResult, setSendResult] = useState<string | null>(null);
    const [resendingId, setResendingId] = useState<number | null>(null);
    const [historicalDates, setHistoricalDates] = useState<Record<string, string>>({});
    const [savingHistoricalFor, setSavingHistoricalFor] = useState<string | null>(null);
    const [reminderId, setReminderId] = useState<number | null>(null);
    const [reminderError, setReminderError] = useState<string | null>(null);
    const [editingLayout, setEditingLayout] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';

        setUploading(true);
        setUploadError(null);
        const formData = new FormData();
        formData.append('document', file);
        const result = await uploadNdaTemplate(committee.id, formData);
        setUploading(false);
        if (!result.success) {
            setUploadError(result.error);
            return;
        }
        window.location.reload();
    };

    const handleConfirmReady = async () => {
        if (!template) return;
        setConfirming(true);
        setConfirmError(null);
        const result = await confirmNdaTemplateReady(template.id);
        setConfirming(false);
        if (!result.success) {
            setConfirmError(result.error);
            return;
        }
        window.location.reload();
    };

    const handleSendToMembers = async () => {
        if (!template) return;
        setSending(true);
        setSendResult(null);
        const result = await sendNdaToCommitteeMembers(template.id);
        setSending(false);
        setSendResult(result.success ? `Verstuurd naar ${result.sentCount} lid/leden.` : (result.error ?? 'Versturen mislukt'));
        if (result.success) window.location.reload();
    };

    const handleResend = async (signatureId: number) => {
        setResendingId(signatureId);
        await resendNdaInvite(signatureId);
        setResendingId(null);
    };

    const handleSendReminder = async (signatureId: number) => {
        setReminderId(signatureId);
        setReminderError(null);
        const result = await sendRenewalReminderToMember(signatureId);
        setReminderId(null);
        if (!result.success) {
            setReminderError(result.error ?? 'Versturen mislukt');
            return;
        }
        window.location.reload();
    };

    const handleSaveHistorical = async (userId: string) => {
        const date = historicalDates[userId];
        if (!date) return;
        setSavingHistoricalFor(userId);
        const result = await recordHistoricalNdaSignature(committee.id, userId, date);
        setSavingHistoricalFor(null);
        if (result.success) window.location.reload();
    };

    return (
        <div className="space-y-8">
            <div className="bg-(--beheer-card-bg) rounded-(--beheer-radius) border border-(--beheer-border) p-6 shadow-sm">
                <h3 className="font-semibold text-xs text-(--beheer-text-muted) mb-4">NDA-document ({new Date().getFullYear()})</h3>
                <div className="flex flex-col sm:flex-row items-start gap-5">
                    <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-(--beheer-card-soft) ring-1 ring-(--beheer-border) flex items-center justify-center">
                        <FileText className={`h-6 w-6 ${template?.document ? 'text-(--beheer-accent)' : 'text-(--beheer-text-muted) opacity-40'}`} />
                        {uploading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Loader2 className="h-5 w-5 text-white animate-spin" />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        {(!template || template.status === 'draft') && (
                            <>
                                <input type="file" accept="application/pdf,.pdf" onChange={(e) => { void handleUpload(e); }} className="hidden" id="nda-doc-upload" />
                                <label htmlFor="nda-doc-upload" className="btn-upload-nda cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-(--beheer-accent)/10 text-(--beheer-accent) border border-(--beheer-accent)/20 text-sm font-semibold hover:bg-(--beheer-accent)/20 transition-all w-fit">
                                    <Upload className="h-4 w-4" />
                                    {template?.document ? 'Ander bestand kiezen' : 'NDA-PDF uploaden'}
                                </label>
                            </>
                        )}
                        {template?.document && (
                            <a href={`/api/assets/${template.document}`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-(--beheer-accent) hover:underline">
                                Geüploade NDA bekijken
                            </a>
                        )}
                        {uploadError && <p className="text-xs font-semibold text-red-500">{uploadError}</p>}
                        {!template?.document && !uploadError && (
                            <p className="text-xs text-(--beheer-text-muted) opacity-70 max-w-sm">Upload de NDA-PDF zoals ondertekend door de secretaris en voorzitter — het document moet de handtekeningen van beiden al bevatten.</p>
                        )}
                    </div>
                </div>
            </div>

            {template?.document && (
                <div className="bg-(--beheer-card-bg) rounded-(--beheer-radius) border border-(--beheer-border) p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-xs text-(--beheer-text-muted)">Handtekeningplek instellen</h3>
                        {template.signatureLayout && !editingLayout && (
                            <button
                                type="button"
                                onClick={() => setEditingLayout(true)}
                                className="btn-edit-nda-layout text-xs font-semibold text-(--beheer-accent) hover:underline"
                            >
                                Opnieuw instellen
                            </button>
                        )}
                    </div>
                    {template.signatureLayout && !editingLayout ? (
                        <p className="text-sm text-(--beheer-text-muted) flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-emerald-500" />
                            De plek voor locatie, datum, naam en handtekening van het commissielid is ingesteld.
                        </p>
                    ) : (
                        <NdaSignatureLayoutEditor
                            templateId={template.id}
                            documentFileId={template.document}
                            initialLayout={template.signatureLayout}
                            onSaved={() => window.location.reload()}
                        />
                    )}
                </div>
            )}

            {template?.status === 'draft' && template.document && template.signatureLayout && (
                <div className="bg-(--beheer-card-bg) rounded-(--beheer-radius) border border-(--beheer-border) p-6 shadow-sm">
                    <h3 className="font-semibold text-xs text-(--beheer-text-muted) mb-4">Bevestigen en klaarzetten</h3>
                    {isSecretary ? (
                        <div className="space-y-4 max-w-md">
                            <p className="text-sm text-(--beheer-text-muted)">Controleer of het geüploade document de handtekeningen van de secretaris en de voorzitter bevat, en bevestig dan dat de NDA klaar is om naar de leden verstuurd te worden.</p>
                            {confirmError && <p className="text-xs font-semibold text-red-500">{confirmError}</p>}
                            <Button onClick={() => { void handleConfirmReady(); }} loading={confirming} icon={CheckCircle2}>
                                Bevestigen: klaar om te versturen
                            </Button>
                        </div>
                    ) : (
                        <p className="text-sm text-(--beheer-text-muted)">Wacht op bevestiging door de aangewezen secretaris.</p>
                    )}
                </div>
            )}

            {template?.status === 'signed' && (
                <div className="bg-(--beheer-card-bg) rounded-(--beheer-radius) border border-(--beheer-border) p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <p className="text-sm text-(--beheer-text-muted)">Bevestigd op {formatDate(template.secretarySignedAt)}. Verstuur nu naar de leden van {committee.name}.</p>
                    <Button onClick={() => { void handleSendToMembers(); }} loading={sending} icon={Send}>
                        Verstuur naar alle leden
                    </Button>
                </div>
            )}
            {sendResult && <p className="text-sm text-(--beheer-text-muted)">{sendResult}</p>}
            {reminderError && <p className="text-sm font-semibold text-red-500">{reminderError}</p>}

            <div className="bg-(--beheer-card-bg) rounded-(--beheer-radius) border border-(--beheer-border) overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-(--beheer-border) text-left text-xs text-(--beheer-text-muted)">
                                <th className="p-4 font-semibold">Naam</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold">Verzonden</th>
                                <th className="p-4 font-semibold">Getekend</th>
                                <th className="p-4 font-semibold">Verloopt</th>
                                <th className="p-4 font-semibold">Actie</th>
                            </tr>
                        </thead>
                        <tbody>
                            {members.map((member: NdaMemberStatusRow) => {
                                const badge = statusBadge[member.status];
                                return (
                                    <tr key={member.userId} className="border-b border-(--beheer-border)/50 last:border-0">
                                        <td className="p-4">
                                            <div className="font-semibold text-(--beheer-text)">{member.name}</div>
                                            <div className="text-xs text-(--beheer-text-muted)">{member.email}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badge.className}`}>{badge.label}</span>
                                        </td>
                                        <td className="p-4 text-(--beheer-text-muted)">{formatDate(member.sentAt)}</td>
                                        <td className="p-4 text-(--beheer-text-muted)">{formatDate(member.signedAt)}</td>
                                        <td className="p-4 text-(--beheer-text-muted)">{formatDate(member.expiresAt)}</td>
                                        <td className="p-4">
                                            {member.status === 'pending' && member.signatureId && (
                                                <ActionButton
                                                    icon={RefreshCw}
                                                    onClick={() => { void handleResend(member.signatureId as number); }}
                                                    loading={resendingId === member.signatureId}
                                                    title="Opnieuw versturen"
                                                />
                                            )}
                                            {(member.status === 'signed' || member.status === 'expiring_soon' || member.status === 'expired') && member.signedDocument && (
                                                <a
                                                    href={`/api/assets/${member.signedDocument}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-(--beheer-accent) hover:underline"
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                    Bekijken
                                                </a>
                                            )}
                                            {member.status === 'expired' && member.signatureId && (
                                                <button
                                                    type="button"
                                                    onClick={() => { void handleSendReminder(member.signatureId as number); }}
                                                    disabled={reminderId === member.signatureId}
                                                    className="btn-send-reminder mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-(--beheer-accent) hover:underline disabled:opacity-40"
                                                >
                                                    {reminderId === member.signatureId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
                                                    Stuur herinnering
                                                </button>
                                            )}
                                            {member.status === 'none' && (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="date"
                                                        value={historicalDates[member.userId] ?? ''}
                                                        onChange={(e) => setHistoricalDates((prev) => ({ ...prev, [member.userId]: e.target.value }))}
                                                        className="beheer-input text-xs py-1.5"
                                                    />
                                                    <button
                                                        type="button"
                                                        disabled={!historicalDates[member.userId] || savingHistoricalFor === member.userId}
                                                        onClick={() => { void handleSaveHistorical(member.userId); }}
                                                        className="btn-save-historical text-xs font-semibold text-(--beheer-accent) hover:underline disabled:opacity-40"
                                                    >
                                                        Eerder getekend op
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
