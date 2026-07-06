'use client';

import React from 'react';
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
            <label className="block text-[10px] font-semibold text-(--beheer-text-muted)  tracking-widest mb-2 ml-1">
                Zoek bestaand lid
            </label>
            {selectedMember ? (
                <div className="group relative overflow-hidden p-5 bg-linear-to-br from-(--beheer-card-soft) to-transparent border border-(--beheer-border) rounded-2xl animate-in zoom-in-95 duration-300">
                    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-(--beheer-accent)/10 p-1.5 rounded-lg">
                            <Check className="h-3 w-3 text-(--beheer-accent)" />
                        </div>
                    </div>
                    <div className="flex items-center gap-5">
                        <div className="h-14 w-14 flex items-center justify-center bg-(--beheer-accent) text-white text-lg font-semibold rounded-2xl shadow-lg ring-4 ring-(--beheer-accent)/5">
                            {selectedMember.first_name?.[0]}{selectedMember.last_name?.[0]}
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-(--beheer-text) text-sm  tracking-tight">
                                {selectedMember.first_name} {selectedMember.last_name}
                            </p>
                            <p className="text-[10px] font-bold text-(--beheer-text-muted)  tracking-widest mt-1">{selectedMember.email}</p>
                        </div>
                        <button
                            type="button"
                            onClick={onClear}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-90 border border-red-500/20"
                            title="Selectie wissen"
                        >
                            <X className="h-4 w-4" />
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
