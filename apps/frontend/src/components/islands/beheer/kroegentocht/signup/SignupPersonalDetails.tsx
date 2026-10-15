'use client';

import { User, Mail, Building2, Tag, Users } from 'lucide-react';
import BeheerSelect from '@/components/ui/beheer/BeheerSelect';

interface SignupPersonalDetailsProps {
    formData: {
        name: string;
        email: string;
        association: string;
        payment_status: "paid" | "open" | "failed" | "canceled" | "expired";
        amount_tickets: number;
        group_name: string | null;
    };
    setFormData: React.Dispatch<React.SetStateAction<{
        name: string;
        email: string;
        association: string;
        payment_status: "paid" | "open" | "failed" | "canceled" | "expired";
        amount_tickets: number;
        group_name: string | null;
    }>>;
    eventGroups?: string[];
}

const PAYMENT_STATUS_OPTIONS = [
    { value: 'paid', label: 'Betaald' },
    { value: 'open', label: 'Open' },
    { value: 'canceled', label: 'Geannuleerd' },
    { value: 'failed', label: 'Mislukt' },
    { value: 'expired', label: 'Verlopen' }
] as const;

const getGroupOptions = (groups: string[]) => [
    { value: '', label: 'Geen groep (nog niet ingedeeld)' },
    ...groups.map((g) => ({ value: g, label: g }))
];

export default function SignupPersonalDetails({ formData, setFormData, eventGroups = [] }: SignupPersonalDetailsProps) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <label className="ml-1 flex items-center gap-2 text-[10px] font-semibold text-(--text-muted)">
                        <User className="size-3" /> Naam
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="beheer-input w-full rounded-xl border-2 border-(--border-color)/50 bg-(--bg-main)/50 px-5 py-4 font-semibold text-(--text-main) transition-all focus:border-(--theme-purple) focus:ring-4 focus:ring-(--theme-purple)/10"
                        required
                        autoComplete="off"
                    />
                </div>

                <div className="space-y-2">
                    <label className="ml-1 flex items-center gap-2 text-[10px] font-semibold text-(--text-muted)">
                        <Mail className="size-3" /> E-mailadres
                    </label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="beheer-input w-full rounded-xl border-2 border-(--border-color)/50 bg-(--bg-main)/50 px-5 py-4 font-semibold text-(--text-main) transition-all focus:border-(--theme-purple) focus:ring-4 focus:ring-(--theme-purple)/10"
                        required
                        autoComplete="off"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <label className="ml-1 flex items-center gap-2 text-[10px] font-semibold text-(--text-muted)">
                        <Building2 className="size-3" /> Vereniging
                    </label>
                    <input
                        type="text"
                        value={formData.association}
                        onChange={(e) => setFormData({ ...formData, association: e.target.value })}
                        className="beheer-input w-full rounded-xl border-2 border-(--border-color)/50 bg-(--bg-main)/50 px-5 py-4 font-semibold text-(--text-main) transition-all focus:border-(--theme-purple) focus:ring-4 focus:ring-(--theme-purple)/10"
                        autoComplete="off"
                    />
                </div>

                <div className="space-y-2">
                    <label className="ml-1 flex items-center gap-2 text-[10px] font-semibold text-(--text-muted)">
                        <Tag className="size-3" /> Betaalstatus
                    </label>
                    <BeheerSelect
                        value={formData.payment_status}
                        onChange={(val) => setFormData({ ...formData, payment_status: val as typeof formData.payment_status })}
                        options={PAYMENT_STATUS_OPTIONS}
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <label className="ml-1 flex items-center gap-2 text-[10px] font-semibold text-(--text-muted)">
                        <Users className="size-3" /> Groepsindeling
                    </label>
                    <BeheerSelect
                        value={formData.group_name ?? undefined}
                        onChange={(val) => setFormData({ ...formData, group_name: val ? String(val) : null })}
                        options={getGroupOptions(eventGroups)}
                        placeholder="Selecteer groep..."
                    />
                </div>
            </div>
        </div>
    );
}
