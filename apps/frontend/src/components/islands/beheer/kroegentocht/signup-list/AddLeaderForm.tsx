'use client';

import { useState } from 'react';
import BeheerSelect from '@/components/ui/beheer/BeheerSelect';

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
                <BeheerSelect
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
                    <BeheerSelect
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
                        className="beheer-input"
                    />
                </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
                <button
                    type="button"
                    onClick={onCancel}
                    className="beheer-button-secondary px-2.5"
                >
                    Annuleren
                </button>
                <button
                    type="button"
                    onClick={handleAdd}
                    disabled={leaderType === 'signup' ? !leaderSignupId : !leaderName.trim()}
                    className="beheer-button"
                >
                    Toevoegen
                </button>
            </div>
        </div>
    );
}
