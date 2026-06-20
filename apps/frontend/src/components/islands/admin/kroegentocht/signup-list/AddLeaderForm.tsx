'use client';

import { useState } from 'react';

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

    return (
        <div className="p-3 bg-[var(--bg-main)]/50 border border-[var(--border-color)]/30 rounded-xl space-y-3">
            <div className="space-y-1">
                <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    Kies leider type
                </label>
                <select
                    value={leaderType}
                    onChange={(e) => {
                        setLeaderType(e.target.value as 'signup' | 'external');
                        setLeaderName('');
                        setLeaderSignupId('');
                    }}
                    className="beheer-select text-xs font-semibold"
                >
                    <option value="signup">Deelnemer uit groep</option>
                    <option value="external">Externe persoon (Handmatig typen)</option>
                </select>
            </div>

            {leaderType === 'signup' ? (
                <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                        Kies deelnemer
                    </label>
                    <select
                        value={leaderSignupId}
                        onChange={(e) => {
                            const val = e.target.value;
                            setLeaderSignupId(val);
                            const found = participantsList.find(p => p.signupId === Number(val));
                            if (found) {
                                setLeaderName(found.name);
                            }
                        }}
                        className="beheer-select text-xs font-semibold"
                    >
                        <option value="">Selecteer deelnemer...</option>
                        {participantsList.map((p, pIdx) => (
                            <option key={`${p.signupId}-${pIdx}`} value={p.signupId}>
                                {p.name} ({p.association})
                            </option>
                        ))}
                    </select>
                </div>
            ) : (
                <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                        Naam leider
                    </label>
                    <input
                        type="text"
                        placeholder="Vul naam in..."
                        value={leaderName}
                        onChange={(e) => setLeaderName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[var(--bg-card)] border border-[var(--border-color)]/30 rounded-lg text-xs font-semibold text-[var(--text-main)] focus:ring-2 focus:ring-[var(--theme-purple)]/10 focus:border-[var(--theme-purple)] focus:outline-none"
                    />
                </div>
            )}

            <div className="flex gap-2 justify-end pt-1">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-2.5 py-1.5 bg-[var(--bg-card)] hover:bg-[var(--bg-main)] border border-[var(--border-color)]/30 rounded-lg text-[10px] font-bold text-[var(--text-muted)] transition-all cursor-pointer"
                >
                    Annuleren
                </button>
                <button
                    type="button"
                    onClick={handleAdd}
                    disabled={leaderType === 'signup' ? !leaderSignupId : !leaderName.trim()}
                    className="px-3 py-1.5 bg-[var(--theme-purple)] text-white hover:opacity-90 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                    Toevoegen
                </button>
            </div>
        </div>
    );
}
