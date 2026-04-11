'use client';

import React from 'react';
import { Settings2, Shield } from 'lucide-react';
import AdminStatsBar from '@/components/ui/admin/AdminStatsBar';

interface AuditHeaderProps {
    stats: any[];
    manualApproval: boolean;
    onToggleManualApproval: () => void;
}

export default function AuditHeader({ stats, manualApproval, onToggleManualApproval }: AuditHeaderProps) {
    return (
        <div className="space-y-6">
            <AdminStatsBar stats={stats} />

            {/* Settings Mode Card */}
            <div className="bg-[var(--beheer-card-bg)] p-8 rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl ${manualApproval ? 'bg-amber-500/10 text-amber-500' : 'bg-green-500/10 text-green-500'}`}>
                        <Settings2 className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)] mb-1">
                            Configuratie
                        </h3>
                        <p className="text-sm font-bold text-[var(--beheer-text)]">
                            {manualApproval 
                                ? "Handmatige goedkeuring is ACTIEF. Alle aanmeldingen moeten worden gecontroleerd."
                                : "Automatische goedkeuring is ACTIEF. Aanmeldingen worden direct verwerkt."}
                        </p>
                    </div>
                </div>
                <button 
                    onClick={onToggleManualApproval}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all focus:outline-none ring-2 ring-offset-2 ring-offset-[var(--beheer-card-bg)] ${manualApproval ? 'bg-amber-500 ring-amber-500/30' : 'bg-green-500 ring-green-500/30'}`}
                >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${manualApproval ? 'translate-x-[1.4rem]' : 'translate-x-1'}`} />
                </button>
            </div>
        </div>
    );
}
