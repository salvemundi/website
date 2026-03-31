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
import { triggerUserSyncAction } from '@/server/actions/azure-sync.actions';
import { getImageUrl } from '@/lib/image-utils';

import MemberProfileTab from './MemberProfileTab';
import MemberActivitiesTab from './MemberActivitiesTab';
import MemberAdminTab from './MemberAdminTab';

interface Member {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    date_of_birth: string | null;
    membership_expiry: string | null;
    status: string;
    phone_number: string | null;
    avatar: string | null;
    entra_id?: string | null;
}

interface CommitteeMembership {
    id: string;
    is_leader: boolean;
    committee_id: {
        id: string;
        name: string;
        is_visible: boolean;
        azure_group_id?: string | null;
    };
}

interface Signup {
    id: number;
    payment_status?: string;
    created_at: string;
    event_id: {
        id: string;
        name: string;
        event_date: string;
    };
}

interface Props {
    member: Member;
    initialMemberships: CommitteeMembership[];
    signups: Signup[];
    allCommittees: any[];
    isAdmin: boolean;
}

export default function LedenDetailIsland({ 
    member, 
    initialMemberships, 
    signups,
    allCommittees,
    isAdmin 
}: Props) {
    const [activeTab, setActiveTab] = useState<'profiel' | 'activiteiten' | 'beheer'>('profiel');
    const [isPending, startTransition] = useTransition();
    const [isActionInProgress, setIsActionInProgress] = useState<string | null>(null);
    const [localMember, setLocalMember] = useState(member);

    // Optimistic memberships
    const [optimisticMemberships, setOptimisticMemberships] = useOptimistic(
        initialMemberships,
        (state: CommitteeMembership[], { action, membership }: { action: 'add' | 'remove' | 'toggle', membership: any }) => {
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
        const todayStr = new Date().toISOString().substring(0, 10);
        return localMember.membership_expiry.substring(0, 10) >= todayStr;
    }, [localMember.membership_expiry]);

    const handleUpdateProfile = async (data: any) => {
        const res = await updateMemberProfileAction(localMember.id, data);
        if (res.success) {
            setLocalMember(prev => ({ ...prev, ...data }));
            return true;
        }
        return false;
    };

    const handleMembershipChange = async (azureGroupId: string, action: 'add' | 'remove', committeeName: string) => {
        if (!localMember.entra_id) {
            alert("Dit lid heeft geen gekoppeld Azure account!");
            setActiveTab('beheer');
            return;
        }
        if (action === 'remove' && !confirm(`Weet je zeker dat je ${localMember.first_name} wilt verwijderen uit ${committeeName}?`)) return;

        setIsActionInProgress(`${action}-${azureGroupId}`);
        startTransition(async () => {
             const res = await manageAzureMembershipAction(localMember.entra_id!, azureGroupId, action, localMember.id);
             if (!res.success) alert(res.error || "Fout bij het bijwerken van lidmaatschap");
        });
        setIsActionInProgress(null);
    };

    const handleRenewMembership = async (months: number) => {
        if (!confirm(`Weet je zeker dat je het lidmaatschap met ${months} maand(en) wilt verlengen?`)) return null;
        const res = await renewMembershipAction(localMember.id, months);
        if (res.success) {
            setLocalMember(prev => ({ ...prev, membership_expiry: res.newExpiry ?? prev.membership_expiry }));
            return `✓ Verlengd tot ${res.newExpiry}`;
        }
        return `✗ ${res.error}`;
    };

    const handleForceSync = async () => {
        const res = await triggerUserSyncAction(localMember.id);
        return res.success ? '✓ Synchronisatie gestart' : `✗ ${res.error}`;
    };

    const handleProvisionAzure = async () => {
        if (!confirm(`Weet je zeker dat je een Azure account wilt aanmaken?`)) return null;
        const res = await provisionAzureAccountAction(localMember.id);
        return res.success ? '✓ Aanvraag ingediend!' : `✗ ${res.error}`;
    };

    const availableCommittees = useMemo(() => {
        const currentIds = new Set(optimisticMemberships.map(m => m.committee_id.id));
        return allCommittees.filter(c => !currentIds.has(c.id) && c.azure_group_id);
    }, [allCommittees, optimisticMemberships]);

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
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
                            onClick={() => setActiveTab(tab.id as any)}
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
        </div>
    );
}
