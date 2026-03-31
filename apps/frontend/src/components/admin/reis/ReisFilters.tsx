'use client';

import { Search, Download, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ReisFiltersProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    statusFilter: string;
    onStatusChange: (value: string) => void;
    roleFilter: string;
    onRoleChange: (value: string) => void;
    onDownloadExcel: () => void;
    hasResults: boolean;
}

export default function ReisFilters({
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusChange,
    roleFilter,
    onRoleChange,
    onDownloadExcel,
    hasResults
}: ReisFiltersProps) {
    const router = useRouter();

    return (
        <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-sm p-4 sm:p-6 mb-6 border border-[var(--beheer-border)]">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--beheer-text-muted)] h-5 w-5" />
                    <input
                        type="text"
                        placeholder="Zoek op naam of e-mailadres..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-[var(--beheer-border)] bg-[var(--beheer-card-bg)] text-[var(--beheer-text)] rounded-[var(--beheer-radius)] focus:ring-2 focus:ring-[var(--beheer-accent)] focus:border-transparent transition-all"
                    />
                </div>
                <div>
                    <select
                        value={statusFilter}
                        onChange={(e) => onStatusChange(e.target.value)}
                        className="w-full px-4 py-2 border border-[var(--beheer-border)] bg-[var(--beheer-card-bg)] text-[var(--beheer-text)] rounded-[var(--beheer-radius)] focus:ring-2 focus:ring-[var(--beheer-accent)] focus:border-transparent transition-all font-bold text-sm uppercase tracking-widest"
                    >
                        <option value="all">Alle statussen</option>
                        <option value="registered">Geregistreerd</option>
                        <option value="confirmed">Bevestigd</option>
                        <option value="waitlist">Wachtlijst</option>
                        <option value="cancelled">Geannuleerd</option>
                    </select>
                </div>
                <div>
                    <select
                        value={roleFilter}
                        onChange={(e) => onRoleChange(e.target.value)}
                        className="w-full px-4 py-2 border border-[var(--beheer-border)] bg-[var(--beheer-card-bg)] text-[var(--beheer-text)] rounded-[var(--beheer-radius)] focus:ring-2 focus:ring-[var(--beheer-accent)] focus:border-transparent transition-all font-bold text-sm uppercase tracking-widest"
                    >
                        <option value="all">Alle rollen</option>
                        <option value="participant">Deelnemer</option>
                        <option value="crew">Crew</option>
                    </select>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mt-6">
                <button
                    onClick={onDownloadExcel}
                    disabled={!hasResults}
                    className="flex items-center justify-center gap-2 px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] bg-[var(--beheer-active)] text-white rounded-[var(--beheer-radius)] font-black uppercase tracking-widest text-xs shadow-[var(--shadow-glow)] hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                    <Download className="h-4 w-4" />
                    Export naar Excel
                </button>
                <button
                    onClick={() => router.push('/beheer/reis/instellingen')}
                    className="flex items-center justify-center gap-2 px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] bg-[var(--beheer-accent)] text-white rounded-[var(--beheer-radius)] font-black uppercase tracking-widest text-xs shadow-[var(--shadow-glow)] hover:opacity-90 transition w-full sm:w-auto"
                >
                    <Edit className="h-4 w-4" />
                    Reis Instellingen
                </button>
            </div>
        </div>
    );
}
