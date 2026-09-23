'use client';

import { useState, useMemo, useOptimistic, useTransition } from 'react';
import {
    User as UserIcon,
    History,
    Settings,
    Mail,
    CreditCard
} from 'lucide-react';
import { manageAzureMembershipAction, provisionAzureAccountAction } from '@/server/actions/admin/leden/admin-leden-azure.actions';
import { updateMemberProfileAction } from '@/server/actions/admin/leden/admin-leden-profile.actions';
import { renewMembershipAction } from '@/server/actions/admin/leden/admin-leden-membership.actions';
import { triggerUserSyncAction } from '@/server/actions/infrastructure/azure-sync/sync-tasks.actions';
import { getImageUrl } from '@/lib/utils/image-utils';
import MediaAsset from '@/components/ui/media/MediaAsset';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import { type AdminMember, type CommitteeMembership, type AdminSignup } from '@salvemundi/validations';
import { safeConsoleError } from '@/server/utils/logger';
import { isMembershipActive as checkIsMembershipActive } from '@/lib/leden/leden-utils';

export type Member = AdminMember;
export type Signup = AdminSignup;
export { type CommitteeMembership };

import MemberProfileTab from './MemberProfileTab';
import MemberActivitiesTab from './MemberActivitiesTab';
import MemberAdminTab from './MemberAdminTab';
import MemberTransactionsTab, { type MemberTransaction } from './MemberTransactionsTab';

interface Props {
    member?: AdminMember;
    initialMemberships?: CommitteeMembership[];
    signups?: AdminSignup[];
    transactions?: MemberTransaction[];
    allCommittees?: { id: string; name: string; is_visible: boolean; azure_group_id?: string | null | undefined }[];
    hasAccess?: boolean;
}

export default function LedenDetailIsland({
    member = {} as AdminMember,
    initialMemberships = [],
    signups = [],
    transactions = [],
    allCommittees = [],
    hasAccess = false
}: Props) {
    const { toast, showToast, hideToast } = useAdminToast();
    const [activeTab, setActiveTab] = useState<'profiel' | 'activiteiten' | 'transacties' | 'beheer'>('profiel');

    // We negeren de isPending waarde door de komma vooraan te gebruiken
    const [, startTransition] = useTransition();
    const [isActionInProgress, setIsActionInProgress] = useState<string | null>(null);
    const [localMember, setLocalMember] = useState(member);

    // We negeren de dispatcher door deze niet te destructuren
    const [optimisticMemberships] = useOptimistic(
        initialMemberships,
        (state: CommitteeMembership[], { action, membership }: { action: 'add' | 'remove' | 'toggle', membership: CommitteeMembership }) => {
            if (action === 'add') return [...state, membership];
            if (action === 'remove') return state.filter(m => m.id !== membership.id);
            return state.map(m => m.id === membership.id ? { ...m, is_leader: !m.is_leader } : m);
        }
    );

    const { realCommittees, otherGroups } = useMemo(() => {
        const EXCLUDED_GROUPS = ['Alle gebruikers', 'Leden_Actief_Lidmaatschap', 'Leden_Verlopen_Lidmaatschap'];
        const real: CommitteeMembership[] = [];
        const groups: CommitteeMembership[] = [];

        optimisticMemberships.forEach(cm => {
            const rawName = cm.committee_id.name || 'Onbekend';
            if (!rawName || EXCLUDED_GROUPS.includes(rawName)) return;

            if (cm.committee_id.is_visible === true) {
                real.push(cm);
            } else {
                groups.push(cm);
            }
        });

        return { realCommittees: real, otherGroups: groups };
    }, [optimisticMemberships]);

    const isMembershipActive = useMemo(() => {
        return checkIsMembershipActive(localMember);
    }, [localMember]);

    const handleUpdateProfile = async (data: Partial<AdminMember>) => {
        const cleanData = { ...data };
        if (cleanData.first_name === null) delete cleanData.first_name;
        if (cleanData.last_name === null) delete cleanData.last_name;
        if (cleanData.phone_number === null) delete cleanData.phone_number;

        try {
            const res = await updateMemberProfileAction(localMember.id, cleanData as Parameters<typeof updateMemberProfileAction>[1]);
            if (res.success) {
                setLocalMember(prev => ({ ...prev, ...data }));
                return true;
            }
            return false;
        } catch (error) {
            safeConsoleError('[LedenDetailIsland.tsx][handleUpdateProfile] ', error);
            return false;
        }
    };

    const handleMembershipChange = async (azureGroupId: string, action: 'add' | 'remove', committeeName: string) => {
        if (!localMember.entra_id) {
            showToast("Dit lid heeft geen gekoppeld Azure account!", "error");
            setActiveTab('beheer');
            return;
        }
        const entraId = localMember.entra_id;
        if (action === 'remove' && !confirm(`Weet je zeker dat je ${localMember.first_name} wilt verwijderen uit ${committeeName}?`)) return;

        setIsActionInProgress(`${action}-${azureGroupId}`);
        startTransition(async () => {
            try {
                const res = await manageAzureMembershipAction(entraId, azureGroupId, action, localMember.id);
                if (!res.success) showToast(res.error || "Fout bij het bijwerken van lidmaatschap", "error");
                else showToast(`Lidmaatschap succesvol ${action === 'add' ? 'toegevoegd' : 'verwijderd'}`, "success");
            } catch (error) {
                safeConsoleError('[LedenDetailIsland.tsx][handleMembershipChange] ', error);
                showToast("Er is een onverwachte fout opgetreden", "error");
            } finally {
                setIsActionInProgress(null);
            }
        });
    };

    const handleRenewMembership = async (months: number) => {
        if (!confirm(`Weet je zeker dat je het lidmaatschap met ${months} maand(en) wilt verlengen?`)) return null;
        try {
            const res = await renewMembershipAction(localMember.id, months);
            if (res.success) {
                setLocalMember(prev => ({ ...prev, membership_expiry: res.newExpiry ?? prev.membership_expiry }));
                return { success: true, message: `Verlengd tot ${res.newExpiry}` };
            }
            return { success: false, message: res.error || 'Fout bij verlengen' };
        } catch (error) {
            safeConsoleError('[LedenDetailIsland.tsx][handleRenewMembership] ', error);
            return { success: false, message: 'Er is een onverwachte fout opgetreden' };
        }
    };

    const handleForceSync = async () => {
        if (!localMember.entra_id) {
            return { success: false, message: 'Dit lid heeft geen gekoppeld Azure account.' };
        }
        try {
            const res = await triggerUserSyncAction(localMember.entra_id);
            return { success: res.success, message: res.success ? 'Synchronisatie gestart' : (res.error || 'Sync mislukt') };
        } catch (error) {
            safeConsoleError('[LedenDetailIsland.tsx][handleForceSync] ', error);
            return { success: false, message: 'Er is een onverwachte fout opgetreden' };
        }
    };

    const handleProvisionAzure = async () => {
        if (!confirm(`Weet je zeker dat je een Azure account wilt aanmaken?`)) return null;
        try {
            const res = await provisionAzureAccountAction(localMember.id);
            return { success: res.success, message: res.success ? 'Aanvraag ingediend!' : (res.error || 'Provisioning mislukt') };
        } catch (error) {
            safeConsoleError('[LedenDetailIsland.tsx][handleProvisionAzure] ', error);
            return { success: false, message: 'Er is een onverwachte fout opgetreden' };
        }
    };

    const availableCommittees = useMemo(() => {
        const currentAzureIds = new Set(
            optimisticMemberships
                .map(m => m.committee_id.azure_group_id?.toLowerCase())
                .filter(Boolean)
        );
        return allCommittees.filter(c => {
            if (!c.azure_group_id) return false;
            return !currentAzureIds.has(c.azure_group_id.toLowerCase());
        });
    }, [allCommittees, optimisticMemberships]);

    return (
        <div className="w-full overflow-x-hidden">
            <div className="mb-12 flex flex-col gap-8 md:flex-row md:items-center">
                <div className="group relative">
                    <div className="flex size-28 items-center justify-center overflow-hidden rounded-4xl border border-(--beheer-border) bg-(--beheer-accent)/10 text-4xl font-semibold text-(--beheer-accent) shadow-2xl transition-transform duration-500 group-hover:scale-105">
                        {localMember.avatar ? (
                            <MediaAsset
                                asset={getImageUrl(localMember.avatar, { width: 150, height: 150, fit: 'cover' }) || ''}
                                alt="avatar"
                                width={112}
                                height={112}
                                className="size-full rounded-4xl object-cover"
                            />
                        ) : (
                            <>{localMember.first_name?.[0]}{localMember.last_name?.[0]}</>
                        )}
                    </div>
                </div>
                <div className="min-w-0 space-y-3">
                    <h1 className="text-2xl leading-tight font-semibold wrap-break-word text-(--beheer-text) sm:text-3xl md:text-4xl">
                        {localMember.first_name} {localMember.last_name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4">
                        <span className="flex items-center gap-2 text-xs font-semibold text-(--beheer-text-muted) opacity-70">
                            <Mail className="size-4 text-(--beheer-accent)" /> {localMember.email}
                        </span>
                        <div suppressHydrationWarning className={`rounded-full border px-4 py-1.5 text-[10px] font-semibold shadow-sm ${isMembershipActive
                            ? 'border-green-500/20 bg-green-500/10 text-green-500'
                            : 'border-red-500/20 bg-red-500/10 text-red-500'
                            }`}>
                            {isMembershipActive ? 'Actief Lidmaatschap' : 'Lidmaatschap Verlopen'}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-10 flex flex-wrap gap-0 border-b border-(--beheer-border)">
                {[
                    { id: 'profiel', label: 'Profiel', icon: UserIcon },
                    { id: 'activiteiten', label: 'Activiteiten', icon: History },
                    { id: 'transacties', label: 'Transacties', icon: CreditCard },
                    { id: 'beheer', label: 'Beheer', icon: Settings, adminOnly: true }
                ].map(tab => (
                    (!tab.adminOnly || hasAccess) && (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as typeof activeTab)}
                            className={`tab-button flex cursor-pointer items-center gap-3 border-b-2 px-8 py-5 text-xs font-semibold transition-all ${activeTab === tab.id
                                ? 'border-(--beheer-accent) text-(--beheer-accent)'
                                : 'border-transparent text-(--beheer-text-muted) hover:text-(--beheer-text)'
                                }`}
                        >
                            <tab.icon className="size-4" /> {tab.label}
                        </button>
                    )
                ))}
            </div>

            <div className="min-h-100">
                {activeTab === 'profiel' && (
                    <MemberProfileTab
                        member={localMember}
                        memberships={optimisticMemberships}
                        realCommittees={realCommittees}
                        otherGroups={otherGroups}
                        hasAccess={hasAccess}
                        onUpdateProfile={handleUpdateProfile}
                    />
                )}

                {activeTab === 'activiteiten' && (
                    <MemberActivitiesTab signups={signups} />
                )}

                {activeTab === 'transacties' && (
                    <MemberTransactionsTab transactions={transactions} />
                )}

                {activeTab === 'beheer' && hasAccess && (
                    <MemberAdminTab
                        member={localMember}
                        optimisticMemberships={optimisticMemberships}
                        availableCommittees={availableCommittees}
                        onProvision={handleProvisionAzure}
                        onMembershipChange={handleMembershipChange}
                        onRenew={handleRenewMembership}
                        onSync={handleForceSync}
                        isActionInProgress={isActionInProgress}
                    />
                )}
            </div>
            <AdminToast toast={toast} onClose={hideToast} />
        </div>
    );
}