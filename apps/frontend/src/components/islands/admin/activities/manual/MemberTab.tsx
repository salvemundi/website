'use client';

import { X, Check } from 'lucide-react';
import { UserBasic } from '@salvemundi/validations';
import AdminLedenSearch from '@/components/ui/admin/AdminLedenSearch';

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
            <label className="mb-2 ml-1 block text-[10px]  font-semibold tracking-widest text-(--beheer-text-muted)">
                Zoek bestaand lid
            </label>
            {selectedMember ? (
                <div className="group animate-in zoom-in-95 relative overflow-hidden rounded-2xl border border-(--beheer-border) bg-linear-to-br from-(--beheer-card-soft) to-transparent p-5 duration-300">
                    <div className="absolute top-0 right-0 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <div className="rounded-lg bg-(--beheer-accent)/10 p-1.5">
                            <Check className="size-3 text-(--beheer-accent)" />
                        </div>
                    </div>
                    <div className="flex items-center gap-5">
                        <div className="flex size-14 items-center justify-center rounded-2xl bg-(--beheer-accent) text-lg font-semibold text-white shadow-lg ring-4 ring-(--beheer-accent)/5">
                            {selectedMember.first_name?.[0]}{selectedMember.last_name?.[0]}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold tracking-tight  text-(--beheer-text)">
                                {selectedMember.first_name} {selectedMember.last_name}
                            </p>
                            <p className="mt-1 text-[10px] font-bold  tracking-widest text-(--beheer-text-muted)">{selectedMember.email}</p>
                        </div>
                        <button
                            type="button"
                            onClick={onClear}
                            className="icon-button flex size-10 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 transition-all hover:bg-red-500 hover:text-white active:scale-90"
                            title="Selectie wissen"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                </div>
            ) : (
                <AdminLedenSearch 
                    onSelect={onSelect}
                    placeholder="TYP NAAM OM TE ZOEKEN..."
                    autoFocus
                />
            )}
        </div>
    );
}
