'use client';

import { useState } from 'react';
import AdminSelect from '@/components/ui/admin/AdminSelect';

interface Participant {
    name: string;
    association: string;
    signupId: number;
}

interface AddLeaderFormProps {
    participantsList: Participant[];
    onAdd: (name: string, signupId: number | null) => void;
    onCancel: () => void;
}

const leaderTypeOptions = [
    { value: 'signup', label: 'Deelnemer uit groep' },
    { value: 'external', label: 'Externe persoon (Handmatig typen)' }
];

export default function AddLeaderForm({
    participantsList,
    onAdd,
    onCancel
}: AddLeaderFormProps) {
    const [leaderType, setLeaderType] = useState<'signup' | 'external'>('signup');
    const [leaderName, setLeaderName] = useState('');
    const [leaderSignupId, setLeaderSignupId] = useState('');

    const handleAdd = () => {
        if (leaderType === 'signup') {
            const signupIdNum = Number(leaderSignupId);
            if (!signupIdNum) return;
            onAdd(leaderName, signupIdNum);
        } else {
            if (!leaderName.trim()) return;
            onAdd(leaderName.trim(), null);
        }
    };

    const participantOptions = [
        { value: '', label: 'Selecteer deelnemer...' },
        ...participantsList.map(p => ({
            value: String(p.signupId),
            label: `${p.name} (${p.association})`
        }))
    ];

    return (
        <div className="space-y-3 rounded-xl border border-(--border-color)/30 bg-(--bg-main)/50 p-3">
            <div className="space-y-1">
                <label className="text-[9px] font-bold tracking-wider text-(--text-muted) uppercase">
                    Kies leider type
                </label>
                <AdminSelect
                    value={leaderType}
                    onChange={(val) => {
                        setLeaderType(val as 'signup' | 'external');
                        setLeaderName('');
                        setLeaderSignupId('');
                    }}
                    options={leaderTypeOptions}
                    size="sm"
                />
            </div>

            {leaderType === 'signup' ? (
                <div className="space-y-1">
                    <label className="text-[9px] font-bold tracking-wider text-(--text-muted) uppercase">
                        Kies deelnemer
                    </label>
                    <AdminSelect
                        value={leaderSignupId}
                        onChange={(val) => {
                            setLeaderSignupId(val);
                            const found = participantsList.find(p => p.signupId === Number(val));
                            if (found) {
                                setLeaderName(found.name);
                            }
                        }}
                        options={participantOptions}
                        size="sm"
                    />
                </div>
            ) : (
                <div className="space-y-1">
                    <label className="text-[9px] font-bold tracking-wider text-(--text-muted) uppercase">
                        Naam leider
                    </label>
                    <input
                        type="text"
                        placeholder="Vul naam in..."
                        value={leaderName}
                        onChange={(e) => setLeaderName(e.target.value)}
                        className="beheer-input w-full rounded-lg border border-(--border-color)/30 bg-(--bg-card) px-2.5 py-1.5 text-xs font-semibold text-(--text-main) focus:border-(--theme-purple) focus:ring-2 focus:ring-(--theme-purple)/10 focus:outline-none"
                    />
                </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
                <button
                    type="button"
                    onClick={onCancel}
                    className="beheer-button cursor-pointer rounded-lg border border-(--border-color)/30 bg-(--bg-card) px-2.5 py-1.5 text-[10px] font-bold text-(--text-muted) transition-all hover:bg-(--bg-main)"
                >
                    Annuleren
                </button>
                <button
                    type="button"
                    onClick={handleAdd}
                    disabled={leaderType === 'signup' ? !leaderSignupId : !leaderName.trim()}
                    className="beheer-button cursor-pointer rounded-lg bg-(--theme-purple) px-3 py-1.5 text-[10px] font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                >
                    Toevoegen
                </button>
            </div>
        </div>
    );
}
