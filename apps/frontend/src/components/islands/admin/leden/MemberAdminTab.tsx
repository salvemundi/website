'use client';

import React, { useState } from 'react';
import { 
    Shield, 
    ShieldAlert, 
    Plus, 
    Loader2, 
    CheckCircle2, 
    XCircle, 
    Award, 
    Trash2, 
    CalendarPlus, 
    RefreshCw 
} from 'lucide-react';
import { cleanName } from './LedenSharedComponents';
import { COMMITTEES } from '@/shared/lib/permissions-config';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';

interface Member {
    id: string;
    first_name: string;
    last_name: string;
    entra_id?: string | null;
}

interface CommitteeMembership {
    id: string;
    is_leader: boolean;
    committee_id: {
        id: string;
        name: string;
        azure_group_id?: string | null;
    };
}

interface Committee {
    id: string;
    name: string;
    azure_group_id: string;
}

interface Props {
    member: Member;
    optimisticMemberships: CommitteeMembership[];
    availableCommittees: Committee[];
    onProvision: () => Promise<{ success: boolean, message: string } | null>;
    onMembershipChange: (groupId: string, action: 'add' | 'remove', name: string) => Promise<void>;
    onRenew: (months: number) => Promise<{ success: boolean, message: string } | null>;
    onSync: () => Promise<{ success: boolean, message: string } | null>;
    isActionInProgress: string | null;
}

export default function MemberAdminTab({
    member,
    optimisticMemberships,
    availableCommittees,
    onProvision,
    onMembershipChange,
    onRenew,
    onSync,
    isActionInProgress
}: Props) {
    const { toast, showToast, hideToast } = useAdminToast();
    const [provisioningLoading, setProvisioningLoading] = useState(false);
    const [renewMonths, setRenewMonths] = useState(12);
    const [renewLoading, setRenewLoading] = useState(false);
    const [syncLoading, setSyncLoading] = useState(false);

    const handleProvision = async () => {
        setProvisioningLoading(true);
        const res = await onProvision();
        if (res) {
            showToast(res.message, res.success ? 'success' : 'error');
        }
        setProvisioningLoading(false);
    };

    const handleRenew = async () => {
        setRenewLoading(true);
        const res = await onRenew(renewMonths);
        if (res) {
            showToast(res.message, res.success ? 'success' : 'error');
        }
        setRenewLoading(false);
    };

    const handleSync = async () => {
        setSyncLoading(true);
        const res = await onSync();
        if (res) {
            showToast(res.message, res.success ? 'success' : 'error');
        }
        setSyncLoading(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Azure Provisioning */}
            {!member.entra_id && (
                <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] p-8 border-l-8 border-l-amber-500 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                <ShieldAlert className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-[var(--beheer-text)] leading-tight uppercase tracking-tight">Azure Account Ontbreekt</h3>
                                <p className="text-xs text-[var(--beheer-text-muted)] font-black uppercase tracking-widest mt-1 opacity-60">Dit lid is nog niet bekend in Microsoft Entra ID.</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-amber-500/5 p-4 rounded-xl mb-8 text-xs font-bold text-amber-700 dark:text-amber-300 leading-relaxed uppercase tracking-widest border border-amber-500/10">
                        Door een account aan te maken krijgt het lid een salvemundi.nl e-mailadres en toegang tot Office 365. 
                        Het tijdelijke wachtwoord wordt direct naar hun persoonlijke e-mailadres gestuurd.
                    </div>
                    <button
                        onClick={handleProvision}
                        disabled={provisioningLoading}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-amber-500 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-500/20 transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                    >
                        {provisioningLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Azure AD Account Aanmaken
                    </button>
                </div>
            )}

            {/* Azure Committee Management */}
            <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-black text-[var(--beheer-text)] leading-tight uppercase tracking-tight">Azure Groepsbeheer</h3>
                        <p className="text-xs text-[var(--beheer-text-muted)] font-black uppercase tracking-widest mt-1 opacity-60">Lidmaatschappen direct in Azure AD aanpassen</p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-[var(--beheer-accent)]/10 text-[var(--beheer-accent)] flex items-center justify-center shadow-sm">
                        <Shield className="h-6 w-6" />
                    </div>
                </div>

                <div className="space-y-6 mb-10">
                    <h4 className="text-[10px] font-black uppercase text-[var(--beheer-text-muted)] tracking-[0.2em] opacity-40">Huidige Lidmaatschappen</h4>
                    {optimisticMemberships.filter(m => m.committee_id.azure_group_id).length === 0 ? (
                        <p className="text-xs text-[var(--beheer-text-muted)] font-bold italic uppercase tracking-widest opacity-30">Geen Azure-gekoppelde commissies.</p>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {optimisticMemberships.filter(m => m.committee_id.azure_group_id).map(m => (
                                <div key={m.id} className="flex items-center justify-between p-4 rounded-2xl bg-[var(--beheer-card-soft)]/50 border border-[var(--beheer-border)] group">
                                    <div className="flex items-center gap-3">
                                        <Award className={`h-5 w-5 ${m.is_leader && m.committee_id.azure_group_id !== COMMITTEES.BESTUUR ? 'text-[var(--beheer-accent)]' : 'text-[var(--beheer-text-muted)] opacity-20'}`} />
                                        <span className="font-bold text-[var(--beheer-text)] text-sm uppercase tracking-tight">{cleanName(m.committee_id.name)}</span>
                                    </div>
                                    <button 
                                        onClick={() => onMembershipChange(m.committee_id.azure_group_id!, 'remove', m.committee_id.name)}
                                        disabled={isActionInProgress === `remove-${m.committee_id.azure_group_id}`}
                                        className="p-2 text-[var(--beheer-text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        {isActionInProgress === `remove-${m.committee_id.azure_group_id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase text-[var(--beheer-text-muted)] tracking-[0.2em] opacity-40">Toevoegen aan Azure Groep</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {availableCommittees.map(c => (
                            <button
                                key={c.id}
                                onClick={() => onMembershipChange(c.azure_group_id, 'add', c.name)}
                                disabled={isActionInProgress === `add-${c.azure_group_id}`}
                                className="flex items-center justify-between p-4 rounded-2xl bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] hover:border-[var(--beheer-accent)]/50 hover:bg-[var(--beheer-accent)]/5 transition-all text-left shadow-sm group"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="font-black text-[var(--beheer-text)] text-xs truncate uppercase tracking-tight">{cleanName(c.name)}</p>
                                    <p className="text-[9px] text-[var(--beheer-text-muted)] font-black uppercase tracking-wider opacity-60">Azure ID: {c.azure_group_id.substring(0, 8)}...</p>
                                </div>
                                <div className="p-2 bg-[var(--beheer-card-soft)] rounded-lg group-hover:bg-[var(--beheer-accent)] group-hover:text-white transition-all">
                                    {isActionInProgress === `add-${c.azure_group_id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Membership Renewal */}
            <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                    <div className="h-12 w-12 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center shadow-sm">
                        <CalendarPlus className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-[var(--beheer-text)] leading-tight uppercase tracking-tight">Lidmaatschap Verlengen</h3>
                        <p className="text-xs text-[var(--beheer-text-muted)] font-black uppercase tracking-widest mt-1 opacity-60">Handmatig verlengen (bv. bij contante betaling)</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <label className="text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest opacity-60">Verlengen met:</label>
                    <div className="flex gap-2">
                        {[1, 6, 12].map(m => (
                            <button key={m} onClick={() => setRenewMonths(m)} className={`px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${renewMonths === m ? 'bg-[var(--beheer-accent)] text-white shadow-md' : 'bg-[var(--beheer-card-soft)] text-[var(--beheer-text-muted)] hover:bg-[var(--beheer-border)]/50'}`}>
                                {m} maand{m > 1 ? 'en' : ''}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleRenew}
                        disabled={renewLoading}
                        className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-green-500/20"
                    >
                        {renewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
                        Verlengen
                    </button>
                    <AdminToast toast={toast} onClose={hideToast} />
                </div>
            </div>

            {/* Force Sync */}
            {member.entra_id && (
                <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] p-8 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                        <div>
                            <h3 className="text-lg font-black text-[var(--beheer-text)] leading-tight uppercase tracking-tight">Azure AD Synchronisatie</h3>
                            <p className="text-xs text-[var(--beheer-text-muted)] font-black uppercase tracking-widest mt-1 opacity-60">Forceer een directe sync van dit lid met Azure AD.</p>
                        </div>
                        <button
                            onClick={handleSync}
                            disabled={syncLoading}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[var(--beheer-card-soft)] text-[var(--beheer-text)] rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[var(--beheer-border)]/50 transition-all active:scale-95 border border-[var(--beheer-border)]/50"
                        >
                            <RefreshCw className={`h-4 w-4 ${syncLoading ? 'animate-spin' : ''}`} />
                            Synchroniseer
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
