'use client';

import { useState } from 'react';
import { 
    Shield, 
    ShieldAlert, 
    Plus, 
    Loader2, 
    Award, 
    Trash, 
    CalendarPlus, 
    RefreshCw 
} from 'lucide-react';
import { cleanName } from './LedenSharedComponents';
import { COMMITTEES } from '@/shared/lib/permissions-config';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';

interface Member {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
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
    azure_group_id?: string | null | undefined;
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
        <div className="space-y-6">
            {/* Azure Provisioning */}
            {!member.entra_id && (
                <div className="rounded-(--beheer-radius) border border-l-8 border-(--beheer-border) border-l-amber-500 bg-(--beheer-card-bg) p-8 shadow-sm">
                    <div className="mb-8 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                                <ShieldAlert className="size-6" />
                            </div>
                            <div>
                                <h3 className="text-xl leading-tight font-semibold text-(--beheer-text)">Azure Account Ontbreekt</h3>
                                <p className="mt-1 text-xs font-semibold text-(--beheer-text-muted) opacity-60">Dit lid is nog niet bekend in Microsoft Entra ID.</p>
                            </div>
                        </div>
                    </div>
                    <div className="mb-8 rounded-xl border border-amber-500/10 bg-amber-500/5 p-4 text-xs leading-relaxed font-semibold text-amber-700 dark:text-amber-300">
                        Door een account aan te maken krijgt het lid een salvemundi.nl e-mailadres en toegang tot Office 365. 
                        Het tijdelijke wachtwoord wordt direct naar hun persoonlijke e-mailadres gestuurd.
                    </div>
                    <button
                        onClick={() => { void handleProvision(); }}
                        disabled={provisioningLoading}
                        className="beheer-button flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-500 px-8 py-4 text-xs font-semibold text-white shadow-lg shadow-amber-500/20 transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 sm:w-auto"
                    >
                        {provisioningLoading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                        Azure AD Account Aanmaken
                    </button>
                </div>
            )}

            {/* Azure Committee Management */}
            <div className="rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) p-8 shadow-sm">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl leading-tight font-semibold text-(--beheer-text)">Azure Groepsbeheer</h3>
                        <p className="mt-1 text-xs font-semibold text-(--beheer-text-muted) opacity-60">Lidmaatschappen direct in Azure AD aanpassen</p>
                    </div>
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-(--beheer-accent)/10 text-(--beheer-accent) shadow-sm">
                        <Shield className="size-6" />
                    </div>
                </div>

                <div className="mb-10 space-y-6">
                    <h4 className="text-xs font-semibold text-(--beheer-text-muted) opacity-40">Huidige Lidmaatschappen</h4>
                    {optimisticMemberships.filter(m => m.committee_id.azure_group_id).length === 0 ? (
                        <p className="text-xs font-medium text-(--beheer-text-muted) italic opacity-30">Geen Azure-gekoppelde commissies.</p>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {optimisticMemberships.filter(m => m.committee_id.azure_group_id).map(m => {
                                const groupId = m.committee_id.azure_group_id;
                                if (!groupId) return null;
                                return (
                                    <div key={m.id} className="group flex items-center justify-between rounded-2xl border border-(--beheer-border) bg-(--beheer-card-soft)/50 p-4">
                                        <div className="flex items-center gap-3">
                                            <Award className={`size-5 ${m.is_leader && m.committee_id.azure_group_id !== COMMITTEES.BESTUUR ? 'text-(--beheer-accent)' : 'text-(--beheer-text-muted) opacity-20'}`} />
                                            <span className="text-sm font-semibold text-(--beheer-text)">{cleanName(m.committee_id.name)}</span>
                                        </div>
                                        <button 
                                            onClick={() => { void onMembershipChange(groupId, 'remove', m.committee_id.name); }}
                                            disabled={isActionInProgress === `remove-${m.committee_id.azure_group_id}`}
                                            className="icon-button cursor-pointer rounded-xl p-2 text-(--beheer-text-muted) transition-all hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
                                        >
                                            {isActionInProgress === `remove-${m.committee_id.azure_group_id}` ? <Loader2 className="size-4 animate-spin" /> : <Trash className="size-4" />}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <h4 className="text-xs font-semibold text-(--beheer-text-muted) opacity-40">Toevoegen aan Azure Groep</h4>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {availableCommittees.map(c => (
                            <button
                                key={c.id}
                                onClick={() => {
                                    if (c.azure_group_id) {
                                        void onMembershipChange(c.azure_group_id, 'add', c.name);
                                    }
                                }}
                                disabled={isActionInProgress === `add-${c.azure_group_id}`}
                                className="group beheer-button flex items-center justify-between rounded-2xl border border-(--beheer-border) bg-(--beheer-card-bg) p-4 text-left shadow-sm transition-all hover:border-(--beheer-accent)/50 hover:bg-(--beheer-accent)/5"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-semibold text-(--beheer-text)">{cleanName(c.name)}</p>
                                    <p className="text-[9px] font-medium text-(--beheer-text-muted) opacity-60">Azure ID: {c.azure_group_id?.substring(0, 8)}...</p>
                                </div>
                                <div className="rounded-lg bg-(--beheer-card-soft) p-2 transition-all group-hover:bg-(--beheer-accent) group-hover:text-white">
                                    {isActionInProgress === `add-${c.azure_group_id}` ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Membership Renewal */}
            <div className="rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) p-8 shadow-sm">
                <div className="mb-8 flex items-center gap-4">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-green-500/10 text-green-500 shadow-sm">
                        <CalendarPlus className="size-6" />
                    </div>
                    <div>
                        <h3 className="text-xl leading-tight font-semibold text-(--beheer-text)">Lidmaatschap Verlengen</h3>
                        <p className="mt-1 text-xs font-semibold text-(--beheer-text-muted) opacity-60">Handmatig verlengen (bv. bij contante betaling)</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <label className="text-xs font-semibold text-(--beheer-text-muted) opacity-60">Verlengen met:</label>
                    <div className="flex gap-2">
                        {[1, 6, 12].map(m => (
                            <button key={m} onClick={() => setRenewMonths(m)} className={`beheer-button cursor-pointer rounded-xl px-4 py-3 text-xs font-semibold transition-all ${renewMonths === m ? 'bg-(--beheer-accent) text-white shadow-md' : 'bg-(--beheer-card-soft) text-(--beheer-text-muted) hover:bg-(--beheer-border)/50'}`}>
                                {m} maand{m > 1 ? 'en' : ''}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => { void handleRenew(); }}
                        disabled={renewLoading}
                        className="beheer-button flex cursor-pointer items-center gap-2 rounded-xl bg-green-500 px-6 py-3 text-xs font-semibold text-white shadow-lg shadow-green-500/20 transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                    >
                        {renewLoading ? <Loader2 className="size-4 animate-spin" /> : <CalendarPlus className="size-4" />}
                        Verlengen
                    </button>
                    <AdminToast toast={toast} onClose={hideToast} />
                </div>
            </div>

            {/* Force Sync */}
            {member.entra_id && (
                <div className="rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) p-8 shadow-sm">
                    <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
                        <div>
                            <h3 className="text-lg leading-tight font-semibold text-(--beheer-text)">Azure AD Synchronisatie</h3>
                            <p className="mt-1 text-xs font-semibold text-(--beheer-text-muted) opacity-60">Forceer een directe sync van dit lid met Azure AD.</p>
                        </div>
                        <button
                            onClick={() => { void handleSync(); }}
                            disabled={syncLoading}
                            className="beheer-button flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-(--beheer-border)/50 bg-(--beheer-card-soft) px-6 py-3 text-xs font-semibold text-(--beheer-text) transition-all hover:bg-(--beheer-border)/50 active:scale-95 sm:w-auto"
                        >
                            <RefreshCw className={`size-4 ${syncLoading ? 'animate-spin' : ''}`} />
                            Synchroniseer
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
