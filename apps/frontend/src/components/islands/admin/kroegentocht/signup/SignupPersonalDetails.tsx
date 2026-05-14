'use client';

import { User, Mail, Building2, Tag, ArrowLeft } from 'lucide-react';

interface SignupPersonalDetailsProps {
    formData: {
        name: string;
        email: string;
        association: string;
        payment_status: "paid" | "open" | "failed" | "canceled" | "expired";
        amount_tickets: number;
    };
    setFormData: React.Dispatch<React.SetStateAction<{
        name: string;
        email: string;
        association: string;
        payment_status: "paid" | "open" | "failed" | "canceled" | "expired";
        amount_tickets: number;
    }>>;
}

export default function SignupPersonalDetails({ formData, setFormData }: SignupPersonalDetailsProps) {
    return (
        <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-[var(--text-muted)] ml-1 flex items-center gap-2">
                        <User className="h-3 w-3" /> Naam
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-5 py-4 bg-[var(--bg-main)]/50 border-2 border-[var(--border-color)]/50 rounded-[var(--radius-xl)] focus:ring-4 focus:ring-[var(--theme-purple)]/10 focus:border-[var(--theme-purple)] transition-all font-semibold text-[var(--text-main)]"
                        required
                        autoComplete="off"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-[var(--text-muted)] ml-1 flex items-center gap-2">
                        <Mail className="h-3 w-3" /> E-mailadres
                    </label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-5 py-4 bg-[var(--bg-main)]/50 border-2 border-[var(--border-color)]/50 rounded-[var(--radius-xl)] focus:ring-4 focus:ring-[var(--theme-purple)]/10 focus:border-[var(--theme-purple)] transition-all font-semibold text-[var(--text-main)]"
                        required
                        autoComplete="off"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-[var(--text-muted)] ml-1 flex items-center gap-2">
                        <Building2 className="h-3 w-3" /> Vereniging
                    </label>
                    <input
                        type="text"
                        value={formData.association}
                        onChange={(e) => setFormData({ ...formData, association: e.target.value })}
                        className="w-full px-5 py-4 bg-[var(--bg-main)]/50 border-2 border-[var(--border-color)]/50 rounded-[var(--radius-xl)] focus:ring-4 focus:ring-[var(--theme-purple)]/10 focus:border-[var(--theme-purple)] transition-all font-semibold text-[var(--text-main)]"
                        autoComplete="off"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-[var(--text-muted)] ml-1 flex items-center gap-2">
                        <Tag className="h-3 w-3" /> Betaalstatus
                    </label>
                    <div className="relative group">
                        <select
                            value={formData.payment_status}
                            onChange={(e) => setFormData({ ...formData, payment_status: e.target.value as "paid" | "open" | "failed" | "canceled" | "expired" })}
                            className="w-full px-5 py-4 bg-[var(--bg-main)]/50 border-2 border-[var(--border-color)]/50 rounded-[var(--radius-xl)] focus:ring-4 focus:ring-[var(--theme-purple)]/10 focus:border-[var(--theme-purple)] transition-all font-semibold text-[var(--text-main)] appearance-none cursor-pointer hover:border-[var(--theme-purple)]/30"
                            autoComplete="off"
                        >
                            <option value="paid" className="bg-[var(--bg-card)] text-[var(--text-main)]">Paid</option>
                            <option value="open" className="bg-[var(--bg-card)] text-[var(--text-main)]">Open</option>
                            <option value="canceled" className="bg-[var(--bg-card)] text-[var(--text-main)]">Canceled</option>
                            <option value="failed" className="bg-[var(--bg-card)] text-[var(--text-main)]">Failed</option>
                            <option value="expired" className="bg-[var(--bg-card)] text-[var(--text-main)]">Expired</option>
                        </select>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)] group-hover:text-[var(--theme-purple)] transition-colors">
                            <ArrowLeft className="h-4 w-4 -rotate-90" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
