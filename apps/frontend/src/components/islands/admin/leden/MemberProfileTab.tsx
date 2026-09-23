'use client';

import { useState } from 'react';
import {
    Calendar,
    Phone,
    Clock,
    Hash,
    Shield,
    Edit,
    Loader2,
    Save,
    Award,
    User as UserIcon,
    Layers
} from 'lucide-react';
import { InfoRow, CommitteeCard, GroupCard, EmptyState, cleanName } from './LedenSharedComponents';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import { safeConsoleError } from '@/server/utils/logger';
import { PhoneInput } from '@/shared/ui/PhoneInput';

interface Member {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    email: string;
    date_of_birth?: string | null;
    membership_expiry?: string | null;
    phone_number?: string | null;
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

interface Props {
    member: Member;
    memberships: CommitteeMembership[];
    realCommittees: CommitteeMembership[];
    otherGroups: CommitteeMembership[];
    hasAccess: boolean;
    onUpdateProfile: (data: Partial<Member>) => Promise<boolean>;
}

export default function MemberProfileTab({
    member,
    realCommittees,
    otherGroups,
    hasAccess,
    onUpdateProfile
}: Props) {
    const { toast, showToast, hideToast } = useAdminToast();
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<Member>>({
        first_name: member.first_name || '',
        last_name: member.last_name || '',
        phone_number: member.phone_number || '',
        date_of_birth: member.date_of_birth || ''
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        const success = await onUpdateProfile(editData);
        if (success) {
            setIsEditing(false);
            showToast('Profiel succesvol bijgewerkt', 'success');
        } else {
            showToast('Opslaan mislukt', 'error');
        }
        setSaving(false);
    };

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return 'Onbekend';
        try {
            const d = new Date(dateString);
            if (isNaN(d.getTime())) throw new Error('Invalid date');
            return new Intl.DateTimeFormat('nl-NL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }).format(d);
        } catch (error) {
            safeConsoleError('[MemberProfileTab.tsx][MemberProfileTab] ', error);
            return 'Onbekend';
        }
    };

    const editFields: { key: keyof Member; label: string; type: string }[] = [
        { key: 'first_name', label: 'Voornaam', type: 'text' },
        { key: 'last_name', label: 'Achternaam', type: 'text' },
        { key: 'phone_number', label: 'Telefoon', type: 'tel' },
        { key: 'date_of_birth', label: 'Geboortedatum', type: 'date' },
    ];

    return (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-1">
                <div className="rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) p-8 shadow-sm">
                    <div className="mb-8 flex items-center justify-between">
                        <h3 className="text-xs font-semibold text-(--beheer-text-muted)">Gegevens</h3>
                        {hasAccess && !isEditing && (
                            <button onClick={() => setIsEditing(true)} className="icon-button cursor-pointer rounded-xl p-2 text-(--beheer-text-muted) transition-all hover:bg-(--beheer-accent)/10 hover:text-(--beheer-accent)">
                                <Edit className="size-4" />
                            </button>
                        )}
                    </div>

                    {isEditing ? (
                        <div className="space-y-5">
                            {editFields.map(field => (
                                <div key={field.key} className="space-y-2">
                                    <label className="text-xs font-semibold text-(--beheer-text-muted)">{field.label}</label>
                                    {field.key === 'phone_number' ? (
                                        <PhoneInput
                                            value={(editData.phone_number) || ''}
                                            onChange={e => setEditData(prev => ({ ...prev, phone_number: e.target.value }))}
                                            className="w-full rounded-xl border border-(--beheer-border) bg-(--beheer-card-soft) px-4 py-3 text-sm font-semibold transition-all outline-none focus:ring-2 focus:ring-(--beheer-accent)"
                                        />
                                    ) : (
                                        <input
                                            type={field.type}
                                            value={(editData[field.key] as string) || ''}
                                            onChange={e => setEditData(prev => ({ ...prev, [field.key]: e.target.value }))}
                                            className="beheer-input w-full rounded-xl border border-(--beheer-border) bg-(--beheer-card-soft) px-4 py-3 text-sm font-semibold transition-all outline-none focus:ring-2 focus:ring-(--beheer-accent)"
                                        />
                                    )}
                                </div>
                            ))}
                            <div className="flex gap-3 pt-4">
                                <button onClick={() => { void handleSave(); }} disabled={saving} className="beheer-button flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-(--beheer-accent) px-4 py-3 text-xs font-semibold text-white shadow-(--shadow-glow) transition-all hover:opacity-90 disabled:opacity-50">
                                    {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Opslaan
                                </button>
                                <button onClick={() => setIsEditing(false)} className="beheer-button flex-1 cursor-pointer rounded-xl border border-transparent px-4 py-3 text-xs font-semibold text-(--beheer-text-muted) transition-all hover:border-(--beheer-border) hover:bg-(--beheer-card-soft)">
                                    X
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <InfoRow icon={Calendar} label="Geboortedatum" value={formatDate(member.date_of_birth)} />
                            <InfoRow icon={Phone} label="Telefoonnummer" value={member.phone_number || 'Geen'} />
                            <InfoRow icon={Clock} label="Verloopdatum" value={formatDate(member.membership_expiry)} />
                            <InfoRow icon={Hash} label="Persoons ID" value={member.id.substring(0, 8) + '...'} />
                            {member.entra_id && <InfoRow icon={Shield} label="Entra ID" value={member.entra_id.substring(0, 8) + '...'} />}
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-6 lg:col-span-2">
                <div className="rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) p-8 shadow-sm">
                    <div className="mb-8 flex items-center gap-4">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500 shadow-sm">
                            <Award className="size-6" />
                        </div>
                        <div>
                            <h3 className="text-xl leading-tight font-semibold text-(--beheer-text)">Commissies</h3>
                            <p className="mt-1 text-xs font-semibold text-(--beheer-text-muted) opacity-60">Actieve rollen binnen Salve Mundi</p>
                        </div>
                    </div>

                    {realCommittees.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {realCommittees.map((membership) => (
                                <CommitteeCard key={membership.id} membership={membership} cleanName={cleanName} />
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon={UserIcon} message="Geen actieve commissie-lidmaatschappen" />
                    )}
                </div>

                <div className="rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) p-8 shadow-sm">
                    <div className="mb-8 flex items-center gap-4">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 shadow-sm">
                            <Layers className="size-6" />
                        </div>
                        <div>
                            <h3 className="text-xl leading-tight font-semibold text-(--beheer-text)">Teams & Groepen</h3>
                            <p className="mt-1 text-xs font-semibold text-(--beheer-text-muted) opacity-60">Systeemgroepen en secundaire teams</p>
                        </div>
                    </div>

                    {otherGroups.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {otherGroups.map((membership) => (
                                <GroupCard key={membership.id} membership={membership} cleanName={cleanName} />
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon={Layers} message="Geen overige groepen gevonden" />
                    )}
                </div>
            </div>
            <AdminToast toast={toast} onClose={hideToast} />
        </div>
    );
}