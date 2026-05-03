'use client';

import React, { useState, useMemo, useOptimistic, useTransition, useCallback } from 'react';
import { 
    User as UserIcon, 
    History, 
    Settings, 
    Mail 
} from 'lucide-react';
import { 
    manageAzureMembershipAction, 
    updateMemberProfileAction, 
    renewMembershipAction,
    provisionAzureAccountAction 
} from '@/server/actions/leden.actions';
import { triggerUserSyncAction } from '@/server/actions/azure-sync/sync-tasks.actions';
import { getImageUrl } from '@/lib/utils/image-utils';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import { type AdminMember, type CommitteeMembership, type AdminSignup } from '@salvemundi/validations';
export type Member = AdminMember;
export type Signup = AdminSignup;
export { type CommitteeMembership };

import MemberProfileTab from './MemberProfileTab';
import MemberActivitiesTab from './MemberActivitiesTab';
import MemberAdminTab from './MemberAdminTab';

interface Props {
    member?: AdminMember;
    initialMemberships?: CommitteeMembership[];
    signups?: AdminSignup[];
    allCommittees?: { id: string; name: string; is_visible: boolean; azure_group_id?: string | null | undefined }[];
    isAdmin?: boolean;
}

export default function LedenDetailIsland({ 
    member = {} as AdminMember, 
    initialMemberships = [], 
    signups = [],
    allCommittees = [],
    isAdmin = false
}: Props) {
    const { toast, showToast, hideToast } = useAdminToast();
    const [activeTab, setActiveTab] = useState<'profiel' | 'activiteiten' | 'beheer'>('profiel');
    const [isPending, startTransition] = useTransition();
    const [isActionInProgress, setIsActionInProgress] = useState<string | null>(null);
    const [localMember, setLocalMember] = useState(member);
    // Optimistic memberships
    const [optimisticMemberships, setOptimisticMemberships] = useOptimistic(
        initialMemberships,
        (state: CommitteeMembership[], { action, membership }: { action: 'add' | 'remove' | 'toggle', membership: CommitteeMembership }) => {
            if (action === 'add') return [...state, membership];
            if (action === 'remove') return state.filter(m => m.id !== membership.id);
            if (action === 'toggle') return state.map(m => m.id === membership.id ? { ...m, is_leader: !m.is_leader } : m);
            return state;
        }
    );

    const { realCommittees, otherGroups } = useMemo(() => {
        const EXCLUDED_GROUPS = ['Alle gebruikers', 'Leden_Actief_Lidmaatschap', 'Leden_Verlopen_Lidmaatschap'];
        const real: CommitteeMembership[] = [];
        const groups: CommitteeMembership[] = [];

        optimisticMemberships.forEach(cm => {
            const rawName = cm.committee_id?.name || 'Onbekend';
            if (!rawName || EXCLUDED_GROUPS.includes(rawName)) return;

            if (cm.committee_id?.is_visible === true) {
                real.push(cm);
            } else {
                groups.push(cm);
            }
        });

        return { realCommittees: real, otherGroups: groups };
    }, [optimisticMemberships]);

    const isMembershipActive = useMemo(() => {
        if (!localMember.membership_expiry) return false;
        try {
            const expiryDate = new Date(localMember.membership_expiry);
            if (isNaN(expiryDate.getTime())) return false;
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const expiryComp = new Date(expiryDate);
            expiryComp.setHours(0, 0, 0, 0);
            
            return expiryComp >= today;
        } catch (e) {
            return false;
        }
    }, [localMember.membership_expiry]);

    const handleUpdateProfile = async (data: Partial<AdminMember>) => {
        const cleanData = { ...data };
        if (cleanData.first_name === null) delete cleanData.first_name;
        if (cleanData.last_name === null) delete cleanData.last_name;
        if (cleanData.phone_number === null) delete cleanData.phone_number;
        
        const res = await updateMemberProfileAction(localMember.id, cleanData as any);
        if (res.success) {
            setLocalMember(prev => ({ ...prev, ...data }));
            return true;
        }
        return false;
    };

    const handleMembershipChange = async (azureGroupId: string, action: 'add' | 'remove', committeeName: string) => {
        if (!localMember.entra_id) {
            showToast("Dit lid heeft geen gekoppeld Azure account!", "error");
            setActiveTab('beheer');
            return;
        }
        if (action === 'remove' && !confirm(`Weet je zeker dat je ${localMember.first_name} wilt verwijderen uit ${committeeName}?`)) return;

        setIsActionInProgress(`${action}-${azureGroupId}`);
        startTransition(async () => {
             const res = await manageAzureMembershipAction(localMember.entra_id!, azureGroupId, action, localMember.id);
             if (!res.success) showToast(res.error || "Fout bij het bijwerken van lidmaatschap", "error");
             else showToast(`Lidmaatschap succesvol ${action === 'add' ? 'toegevoegd' : 'verwijderd'}`, "success");
        });
        setIsActionInProgress(null);
    };

    const handleRenewMembership = async (months: number) => {
        if (!confirm(`Weet je zeker dat je het lidmaatschap met ${months} maand(en) wilt verlengen?`)) return null;
        const res = await renewMembershipAction(localMember.id, months);
        if (res.success) {
            setLocalMember(prev => ({ ...prev, membership_expiry: res.newExpiry ?? prev.membership_expiry }));
            return { success: true, message: `Verlengd tot ${res.newExpiry}` };
        }
        return { success: false, message: res.error || 'Fout bij verlengen' };
    };

    const handleForceSync = async () => {
        if (!localMember.entra_id) {
            return { success: false, message: 'Dit lid heeft geen gekoppeld Azure account.' };
        }
        const res = await triggerUserSyncAction(localMember.entra_id);
        return { success: res.success, message: res.success ? 'Synchronisatie gestart' : (res.error || 'Sync mislukt') };
    };

    const handleProvisionAzure = async () => {
        if (!confirm(`Weet je zeker dat je een Azure account wilt aanmaken?`)) return null;
        const res = await provisionAzureAccountAction(localMember.id);
        return { success: res.success, message: res.success ? 'Aanvraag ingediend!' : (res.error || 'Provisioning mislukt') };
    };

    const availableCommittees = useMemo(() => {
        const currentIds = new Set(optimisticMemberships.map(m => m.committee_id.id));
        return allCommittees.filter(c => !currentIds.has(c.id) && c.azure_group_id);
    }, [allCommittees, optimisticMemberships]);

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl overflow-x-hidden">
                <>
                    {/* Header info */}
                    <div className="flex flex-col md:flex-row md:items-center gap-8 mb-12">
                        <div className="relative group">
                            <div className="h-28 w-28 rounded-[2rem] bg-[var(--beheer-accent)]/10 flex items-center justify-center text-[var(--beheer-accent)] font-black text-4xl shadow-2xl border border-[var(--beheer-border)] transition-transform group-hover:scale-105 duration-500">
                                {localMember.avatar ? (
                                    <img src={getImageUrl(localMember.avatar, { width: 150, height: 150, fit: 'cover' }) || ''} alt="avatar" className="h-full w-full object-cover rounded-[2rem]" />
                                ) : (
                                    <>{localMember.first_name?.[0]}{localMember.last_name?.[0]}</>
                                )}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <h1 className="text-4xl font-black text-[var(--beheer-text)] leading-none uppercase tracking-tight">
                                {localMember.first_name} {localMember.last_name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4">
                                <span className="text-[var(--beheer-text-muted)] font-black flex items-center gap-2 text-xs uppercase tracking-widest opacity-70">
                                    <Mail className="h-4 w-4 text-[var(--beheer-accent)]" /> {localMember.email}
                                </span>
                                <div suppressHydrationWarning className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm border ${isMembershipActive
                                        ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                        : 'bg-red-500/10 text-red-500 border-red-500/20'
                                    }`}>
                                    {isMembershipActive ? 'Actief Lidmaatschap' : 'Lidmaatschap Verlopen'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs Navigation */}
                    <div className="flex flex-wrap gap-0 border-b border-[var(--beheer-border)] mb-10">
                        {[
                            { id: 'profiel', label: 'Profiel', icon: UserIcon },
                            { id: 'activiteiten', label: 'Activiteiten', icon: History },
                            { id: 'beheer', label: 'Beheer', icon: Settings, adminOnly: true }
                        ].map(tab => (
                            (!tab.adminOnly || isAdmin) && (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                    className={`flex items-center gap-3 px-8 py-5 font-black text-xs uppercase tracking-[0.2em] transition-all border-b-2 ${
                                        activeTab === tab.id 
                                            ? 'text-[var(--beheer-accent)] border-[var(--beheer-accent)]' 
                                            : 'text-[var(--beheer-text-muted)] border-transparent hover:text-[var(--beheer-text)]'
                                    }`}
                                >
                                    <tab.icon className="h-4 w-4" /> {tab.label}
                                </button>
                            )
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="min-h-[400px]">
                        {activeTab === 'profiel' && (
                            <MemberProfileTab 
                                member={localMember} 
                                memberships={optimisticMemberships}
                                realCommittees={realCommittees}
                                otherGroups={otherGroups}
                                isAdmin={isAdmin}
                                onUpdateProfile={handleUpdateProfile}
                            />
                        )}

                        {activeTab === 'activiteiten' && (
                            <MemberActivitiesTab signups={signups} />
                        )}

                        {activeTab === 'beheer' && isAdmin && (
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
                </>
            <AdminToast toast={toast} onClose={hideToast} />
        </div>
    );
}
