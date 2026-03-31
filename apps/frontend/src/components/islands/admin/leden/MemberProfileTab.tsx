'use client';

import React, { useState } from 'react';
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
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { InfoRow, CommitteeCard, GroupCard, EmptyState, cleanName } from './LedenSharedComponents';

interface Member {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    date_of_birth: string | null;
    membership_expiry: string | null;
    phone_number: string | null;
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
    onUpdateProfile: (data: any) => Promise<boolean>;
}

export default function MemberProfileTab({ 
    member, 
    realCommittees, 
    otherGroups, 
    isAdmin, 
    onUpdateProfile 
}: Props) {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        first_name: member.first_name,
        last_name: member.last_name,
        phone_number: member.phone_number || '',
        date_of_birth: member.date_of_birth || '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        const success = await onUpdateProfile(editData);
        if (success) setIsEditing(false);
        else setError('Opslaan mislukt');
        setSaving(false);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Onbekend';
        try {
            return format(new Date(dateString), 'd MMMM yyyy', { locale: nl });
        } catch (e) {
            return 'Onbekend';
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
            {/* Left Column: Info Card */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--beheer-text-muted)]">Gegevens</h3>
                        {isAdmin && !isEditing && (
                            <button onClick={() => setIsEditing(true)} className="p-2 text-[var(--beheer-text-muted)] hover:text-[var(--beheer-accent)] hover:bg-[var(--beheer-accent)]/10 rounded-xl transition-all">
                                <Edit className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {isEditing ? (
                        <div className="space-y-5">
                            {error && <p className="text-xs text-red-500 bg-red-500/10 px-3 py-3 rounded-xl border border-red-500/20">{error}</p>}
                            {[
                                { key: 'first_name', label: 'Voornaam', type: 'text' },
                                { key: 'last_name', label: 'Achternaam', type: 'text' },
                                { key: 'phone_number', label: 'Telefoon', type: 'tel' },
                                { key: 'date_of_birth', label: 'Geboortedatum', type: 'date' },
                            ].map(field => (
                                <div key={field.key} className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)]">{field.label}</label>
                                    <input
                                        type={field.type}
                                        value={(editData as any)[field.key]}
                                        onChange={e => setEditData(prev => ({ ...prev, [field.key]: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl bg-[var(--beheer-card-soft)] border border-[var(--beheer-border)] text-sm font-bold focus:ring-2 focus:ring-[var(--beheer-accent)] outline-none transition-all"
                                    />
                                </div>
                            ))}
                            <div className="flex gap-3 pt-4">
                                <button onClick={handleSave} disabled={saving} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[var(--beheer-accent)] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-[var(--shadow-glow)] hover:opacity-90 transition-all disabled:opacity-50">
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Opslaan
                                </button>
                                <button onClick={() => setIsEditing(false)} className="flex-1 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-[var(--beheer-text-muted)] hover:bg-[var(--beheer-card-soft)] transition-all border border-transparent hover:border-[var(--beheer-border)]">
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

            {/* Right Column: Committees/Groups */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] p-8 shadow-sm">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-12 w-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center shadow-sm">
                            <Award className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-[var(--beheer-text)] leading-tight uppercase tracking-tight">Commissies</h3>
                            <p className="text-xs text-[var(--beheer-text-muted)] font-black uppercase tracking-widest mt-1 opacity-60">Actieve rollen binnen Salve Mundi</p>
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

                <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] p-8 shadow-sm">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shadow-sm">
                            <Layers className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-[var(--beheer-text)] leading-tight uppercase tracking-tight">Teams & Groepen</h3>
                            <p className="text-xs text-[var(--beheer-text-muted)] font-black uppercase tracking-widest mt-1 opacity-60">Systeemgroepen en secundaire teams</p>
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
        </div>
    );
}
