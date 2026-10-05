'use client';

import { X, Check } from 'lucide-react';
import { UserBasic } from '@salvemundi/validations';
import BeheerLedenSearch from '@/components/ui/beheer/BeheerLedenSearch';

interface MemberTabProps {
    selectedMember: UserBasic | null;
    onSelect: (user: UserBasic) => void;
    onClear: () => void;
}

export default function MemberTab({
    selectedMember,
    onSelect,
    onClear
}: MemberTabProps) {
    return (
        <div className="space-y-4">
            <label className="member-search-label">
                Zoek bestaand lid
            </label>
            {selectedMember ? (
                <div className="group member-selected-card">
                    <div className="member-selected-check-wrapper">
                        <div className="rounded-lg bg-(--beheer-accent)/10 p-1.5">
                            <Check className="size-3 text-(--beheer-accent)" />
                        </div>
                    </div>
                    <div className="flex items-center gap-5">
                        <div className="member-avatar-badge">
                            {selectedMember.first_name?.[0]}{selectedMember.last_name?.[0]}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold tracking-tight text-(--beheer-text)">
                                {selectedMember.first_name} {selectedMember.last_name}
                            </p>
                            <p className="member-email-text">{selectedMember.email}</p>
                        </div>
                        <button
                            type="button"
                            onClick={onClear}
                            className="btn-delete-badge"
                            title="Selectie wissen"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                </div>
            ) : (
                <BeheerLedenSearch 
                    onSelect={onSelect}
                    placeholder="TYP NAAM OM TE ZOEKEN..."
                    autoFocus
                />
            )}
        </div>
    );
}
