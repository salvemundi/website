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
    isAdmin: boolean;
    onUpdateProfile: (data: Partial<Member>) => Promise<boolean>;
}

export default function MemberProfileTab({
    member,
    realCommittees,
    otherGroups,
    isAdmin,
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
            safeConsoleError('[MemberProfileTab][formatDate]', error);
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-(--beheer-card-bg) rounded-(--beheer-radius) border border-(--beheer-border) p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xs font-semibold text-(--beheer-text-muted)">Gegevens</h3>
                        {isAdmin && !isEditing && (
                            <button onClick={() => setIsEditing(true)} className="p-2 text-(--beheer-text-muted) hover:text-(--beheer-accent) hover:bg-(--beheer-accent)/10 rounded-xl transition-all cursor-pointer">
                                <Edit className="h-4 w-4" />
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
                                            className="w-full px-4 py-3 rounded-xl bg-(--beheer-card-soft) border border-(--beheer-border) text-sm font-semibold focus:ring-2 focus:ring-(--beheer-accent) outline-none transition-all"
                                        />
                                    ) : (
                                        <input
                                            type={field.type}
                                            value={(editData[field.key] as string) || ''}
                                            onChange={e => setEditData(prev => ({ ...prev, [field.key]: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-xl bg-(--beheer-card-soft) border border-(--beheer-border) text-sm font-semibold focus:ring-2 focus:ring-(--beheer-accent) outline-none transition-all"
                                        />
                                    )}
                                </div>
                            ))}
                            <div className="flex gap-3 pt-4">
                                <button onClick={() => { void handleSave(); }} disabled={saving} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-(--beheer-accent) text-white rounded-xl text-xs font-semibold shadow-(--shadow-glow) hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer">
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Opslaan
                                </button>
                                <button onClick={() => setIsEditing(false)} className="flex-1 px-4 py-3 rounded-xl text-xs font-semibold text-(--beheer-text-muted) hover:bg-(--beheer-card-soft) transition-all border border-transparent hover:border-(--beheer-border) cursor-pointer">
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

            <div className="lg:col-span-2 space-y-6">
                <div className="bg-(--beheer-card-bg) rounded-(--beheer-radius) border border-(--beheer-border) p-8 shadow-sm">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-12 w-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center shadow-sm">
                            <Award className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-(--beheer-text) leading-tight">Commissies</h3>
                            <p className="text-xs text-(--beheer-text-muted) font-semibold mt-1 opacity-60">Actieve rollen binnen Salve Mundi</p>
                        </div>
                    </div>

                    {realCommittees.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {realCommittees.map((membership) => (
                                <CommitteeCard key={membership.id} membership={membership} cleanName={cleanName} />
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon={UserIcon} message="Geen actieve commissie-lidmaatschappen" />
                    )}
                </div>

                <div className="bg-(--beheer-card-bg) rounded-(--beheer-radius) border border-(--beheer-border) p-8 shadow-sm">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shadow-sm">
                            <Layers className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-(--beheer-text) leading-tight">Teams & Groepen</h3>
                            <p className="text-xs text-(--beheer-text-muted) font-semibold mt-1 opacity-60">Systeemgroepen en secundaire teams</p>
                        </div>
                    </div>

                    {otherGroups.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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