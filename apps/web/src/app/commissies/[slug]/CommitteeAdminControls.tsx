'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit, Users2, ArrowLeft, Trash2 } from 'lucide-react';
import { getImageUrl } from '@/shared/lib/api/image';
import { deleteCommitteeMemberAction, updateCommitteeMemberAction } from '@/shared/api/data-actions';
import SmartImage from '@/shared/ui/SmartImage';
import { getMemberFullName, resolveMemberAvatar, getMemberEmail } from '@/entities/committee/lib/member-helpers';

interface CommitteeAdminControlsProps {
    committeeId: number;
    cleanName: string;
    members: any[];
}

export default function CommitteeAdminControls({ committeeId, cleanName, members }: CommitteeAdminControlsProps) {
    const router = useRouter();
    const [membersModalOpen, setMembersModalOpen] = useState(false);


    const removeMember = async (memberRowId: number) => {
        try {
            if (!confirm('Weet je zeker dat je dit lid wilt verwijderen uit de commissie?')) return;
            const res = await deleteCommitteeMemberAction(memberRowId);
            if (res.success) window.location.reload();
            else alert(res.error || 'Fout bij verwijderen van lid');
        } catch (error) {
            console.error('Failed to remove member:', error);
            alert('Fout bij verwijderen van lid');
        }
    };

    const toggleLeader = async (memberRowId: number, makeLeader: boolean) => {
        try {
            const res = await updateCommitteeMemberAction(memberRowId, { is_leader: makeLeader });
            if (res.success) window.location.reload();
            else alert(res.error || 'Fout bij bijwerken rol');
        } catch (error) {
            console.error('Failed to toggle leader:', error);
            alert('Fout bij bijwerken rol');
        }
    };

    return (
        <>
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.push(`/admin/commissies/${committeeId}`)}
                    className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-md px-4 py-2 text-sm font-semibold text-white hover:bg-white/30 transition-all border border-white/10"
                >
                    <Edit className="h-4 w-4" />
                    Bewerken
                </button>
                <button
                    onClick={() => setMembersModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 transition-all border border-white/10"
                >
                    <Users2 className="h-4 w-4" />
                    Leden Beheren
                </button>
            </div>

            {membersModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMembersModalOpen(false)} />
                    <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl bg-[var(--bg-card)] shadow-2xl dark:border dark:border-white/10">
                        <div className="flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-main)] px-8 py-5">
                            <div>
                                <h3 className="text-xl font-bold text-theme-purple">Ledenbeheer</h3>
                                <p className="text-sm text-[var(--text-muted)]">{cleanName}</p>
                            </div>
                            <button
                                onClick={() => setMembersModalOpen(false)}
                                className="rounded-full bg-[var(--bg-card)] p-2 text-[var(--text-muted)] hover:text-red-500 transition-colors border border-[var(--border-color)]"
                            >
                                <ArrowLeft className="h-5 w-5 rotate-90" />
                            </button>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2 scrollbar-thin">
                            {members.map((member: any) => (
                                <div key={member.id} className="flex items-center justify-between gap-4 rounded-2xl bg-[var(--bg-main)] p-4 transition-colors hover:bg-[var(--bg-card)] border border-transparent hover:border-[var(--border-color)]">
                                    <div className="flex items-center gap-4">
                                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-theme-purple/20">
                                            {resolveMemberAvatar(member) ? (
                                                <SmartImage
                                                    src={getImageUrl(resolveMemberAvatar(member), { width: 200, height: 200 })}
                                                    alt={getMemberFullName(member)}
                                                    className="h-full w-full object-cover transform-gpu transition-transform duration-500"
                                                    fill
                                                    sizes="48px"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-theme-purple/10 text-lg font-black text-theme-purple">
                                                    {getMemberFullName(member).charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate font-bold text-[var(--text-main)]">{getMemberFullName(member)}</p>
                                            <p className="truncate text-xs text-[var(--text-muted)]">{getMemberEmail(member)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => toggleLeader(member.id, !member.is_leader)}
                                            className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${member.is_leader
                                                ? 'bg-theme-purple text-white'
                                                : 'bg-theme-purple/10 text-theme-purple hover:bg-theme-purple/20'
                                                }`}
                                        >
                                            {member.is_leader ? 'Voorzitter' : 'Maak voorzitter'}
                                        </button>
                                        <button
                                            onClick={() => removeMember(member.id)}
                                            className="rounded-full bg-red-500/10 p-2 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                            title="Verwijder"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
