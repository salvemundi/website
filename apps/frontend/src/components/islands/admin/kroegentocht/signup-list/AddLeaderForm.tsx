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
        <div className="p-3 bg-(--bg-main)/50 border border-(--border-color)/30 rounded-xl space-y-3">
            <div className="space-y-1">
                <label className="text-[9px] font-bold text-(--text-muted) uppercase tracking-wider">
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
                    <label className="text-[9px] font-bold text-(--text-muted) uppercase tracking-wider">
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
                    <label className="text-[9px] font-bold text-(--text-muted) uppercase tracking-wider">
                        Naam leider
                    </label>
                    <input
                        type="text"
                        placeholder="Vul naam in..."
                        value={leaderName}
                        onChange={(e) => setLeaderName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-(--bg-card) border border-(--border-color)/30 rounded-lg text-xs font-semibold text-(--text-main) focus:ring-2 focus:ring-(--theme-purple)/10 focus:border-(--theme-purple) focus:outline-none"
                    />
                </div>
            )}

            <div className="flex gap-2 justify-end pt-1">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-2.5 py-1.5 bg-(--bg-card) hover:bg-(--bg-main) border border-(--border-color)/30 rounded-lg text-[10px] font-bold text-(--text-muted) transition-all cursor-pointer"
                >
                    Annuleren
                </button>
                <button
                    type="button"
                    onClick={handleAdd}
                    disabled={leaderType === 'signup' ? !leaderSignupId : !leaderName.trim()}
                    className="px-3 py-1.5 bg-(--theme-purple) text-white hover:opacity-90 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                    Toevoegen
                </button>
            </div>
        </div>
    );
}
