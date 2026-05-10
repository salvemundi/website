'use client';

import { Users, Beer, AlertCircle, Building2 } from 'lucide-react';

interface KroegStatsProps {
    signups: any[];
}

export default function KroegStats({ signups }: KroegStatsProps) {
    const paidSignups = signups.filter(s => s.payment_status === 'paid');
    
    const stats = {
        totalPaidSignups: paidSignups.length,
        totalTickets: paidSignups.reduce((sum, s) => sum + (s.amount_tickets || 0), 0),
        totalAssociations: [...new Set(paidSignups.map(s => s.association).filter(Boolean))].length,
        failedCount: signups.filter(s => s.payment_status !== 'paid').length };

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-[var(--theme-purple)] to-[var(--theme-purple-dark)] rounded-[var(--radius-2xl)] shadow-lg p-6 text-white overflow-hidden relative group">
                <Users className="absolute -right-4 -bottom-4 h-24 w-24 text-white/10 group-hover:scale-110 transition-transform" />
                <p className="text-white/70 text-xs font-semibold mb-1">Aanmeldingen</p>
                <p className="text-4xl font-semibold">{stats.totalPaidSignups}</p>
                <p className="text-[10px] text-white/50 font-semibold mt-2">Betaalde groepen</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-[var(--radius-2xl)] shadow-lg p-6 text-white overflow-hidden relative group">
                <Beer className="absolute -right-4 -bottom-4 h-24 w-24 text-white/10 group-hover:scale-110 transition-transform" />
                <p className="text-white/70 text-xs font-semibold mb-1">Tickets</p>
                <p className="text-4xl font-semibold">{stats.totalTickets}</p>
                <p className="text-[10px] text-white/50 font-semibold mt-2">Gegenereerde QR-codes</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-[var(--radius-2xl)] shadow-lg p-6 text-white overflow-hidden relative group">
                <Building2 className="absolute -right-4 -bottom-4 h-24 w-24 text-white/10 group-hover:scale-110 transition-transform" />
                <p className="text-white/70 text-xs font-semibold mb-1">Verenigingen</p>
                <p className="text-4xl font-semibold">{stats.totalAssociations}</p>
                <p className="text-[10px] text-white/50 font-semibold mt-2">Unieke partners</p>
            </div>

            <div className="bg-[var(--bg-card)]/40 border-2 border-dashed border-[var(--border-color)]/30 rounded-[var(--radius-2xl)] p-6 text-[var(--text-muted)] overflow-hidden relative group">
                <AlertCircle className="absolute -right-4 -bottom-4 h-24 w-24 text-[var(--text-muted)]/5 group-hover:scale-110 transition-transform" />
                <p className="text-[var(--text-muted)] text-xs font-semibold mb-1">Onbetaald</p>
                <p className="text-4xl font-semibold">{stats.failedCount}</p>
                <p className="text-[10px] text-[var(--text-light)] font-semibold mt-2 italic">Open of geannuleerd</p>
            </div>
        </div>
    );
}
