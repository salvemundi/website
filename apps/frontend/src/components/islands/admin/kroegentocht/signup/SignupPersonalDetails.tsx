'use client';

import { useState, useEffect, useRef } from 'react';
import { User, Mail, Building2, Tag, ChevronDown, Users } from 'lucide-react';

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
    { value: 'paid', label: 'Betaald', color: 'bg-green-500', textClass: 'text-green-500' },
    { value: 'open', label: 'Open', color: 'bg-amber-500', textClass: 'text-amber-500' },
    { value: 'canceled', label: 'Geannuleerd', color: 'bg-gray-400', textClass: 'text-gray-400' },
    { value: 'failed', label: 'Mislukt', color: 'bg-red-500', textClass: 'text-red-500' },
    { value: 'expired', label: 'Verlopen', color: 'bg-orange-500', textClass: 'text-orange-500' }
] as const;

export default function SignupPersonalDetails({ formData, setFormData, eventGroups = [] }: SignupPersonalDetailsProps) {
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isGroupOpen, setIsGroupOpen] = useState(false);
    
    const paymentRef = useRef<HTMLDivElement>(null);
    const groupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (paymentRef.current && !paymentRef.current.contains(event.target as Node)) {
                setIsPaymentOpen(false);
            }
            if (groupRef.current && !groupRef.current.contains(event.target as Node)) {
                setIsGroupOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedPayment = PAYMENT_STATUS_OPTIONS.find(opt => opt.value === formData.payment_status) || PAYMENT_STATUS_OPTIONS[1];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-(--text-muted) ml-1 flex items-center gap-2">
                        <User className="h-3 w-3" /> Naam
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-5 py-4 bg-(--bg-main)/50 border-2 border-(--border-color)/50 rounded-xl focus:ring-4 focus:ring-(--theme-purple)/10 focus:border-(--theme-purple) transition-all font-semibold text-(--text-main)"
                        required
                        autoComplete="off"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-(--text-muted) ml-1 flex items-center gap-2">
                        <Mail className="h-3 w-3" /> E-mailadres
                    </label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-5 py-4 bg-(--bg-main)/50 border-2 border-(--border-color)/50 rounded-xl focus:ring-4 focus:ring-(--theme-purple)/10 focus:border-(--theme-purple) transition-all font-semibold text-(--text-main)"
                        required
                        autoComplete="off"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-(--text-muted) ml-1 flex items-center gap-2">
                        <Building2 className="h-3 w-3" /> Vereniging
                    </label>
                    <input
                        type="text"
                        value={formData.association}
                        onChange={(e) => setFormData({ ...formData, association: e.target.value })}
                        className="w-full px-5 py-4 bg-(--bg-main)/50 border-2 border-(--border-color)/50 rounded-xl focus:ring-4 focus:ring-(--theme-purple)/10 focus:border-(--theme-purple) transition-all font-semibold text-(--text-main)"
                        autoComplete="off"
                    />
                </div>

                <div className="space-y-2" ref={paymentRef}>
                    <label className="text-[10px] font-semibold text-(--text-muted) ml-1 flex items-center gap-2">
                        <Tag className="h-3 w-3" /> Betaalstatus
                    </label>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setIsPaymentOpen(!isPaymentOpen)}
                            className="w-full px-5 py-4 bg-(--bg-main)/50 border-2 border-(--border-color)/50 rounded-xl focus:ring-4 focus:ring-(--theme-purple)/10 focus:border-(--theme-purple) transition-all font-semibold text-(--text-main) flex items-center justify-between hover:border-(--theme-purple)/30 text-left"
                        >
                            <span className="flex items-center gap-2">
                                <span className={`h-2.5 w-2.5 rounded-full ${selectedPayment.color}`} />
                                {selectedPayment.label}
                            </span>
                            <ChevronDown className={`h-4 w-4 text-(--text-muted) transition-transform duration-200 ${isPaymentOpen ? 'rotate-180 text-(--theme-purple)' : ''}`} />
                        </button>
                        
                        {isPaymentOpen && (
                            <div className="absolute left-0 right-0 z-50 mt-2 rounded-xl border border-(--border-color)/30 bg-(--bg-card) p-1.5 shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-1 duration-100">
                                <div className="space-y-0.5">
                                    {PAYMENT_STATUS_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => {
                                                setFormData({ ...formData, payment_status: opt.value });
                                                setIsPaymentOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2.5 ${
                                                formData.payment_status === opt.value
                                                    ? 'bg-(--theme-purple) text-white'
                                                    : 'text-(--text-main) hover:bg-(--bg-main)'
                                            }`}
                                        >
                                            <span className={`h-2 w-2 rounded-full ${formData.payment_status === opt.value ? 'bg-white' : opt.color}`} />
                                            <span className={formData.payment_status === opt.value ? 'text-white' : ''}>
                                                {opt.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2" ref={groupRef}>
                    <label className="text-[10px] font-semibold text-(--text-muted) ml-1 flex items-center gap-2">
                        <Users className="h-3 w-3" /> Groepsindeling
                    </label>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setIsGroupOpen(!isGroupOpen)}
                            className="w-full px-5 py-4 bg-(--bg-main)/50 border-2 border-(--border-color)/50 rounded-xl focus:ring-4 focus:ring-(--theme-purple)/10 focus:border-(--theme-purple) transition-all font-semibold text-(--text-main) flex items-center justify-between hover:border-(--theme-purple)/30 text-left"
                        >
                            <span className="truncate">
                                {formData.group_name || 'Geen groep (nog niet ingedeeld)'}
                            </span>
                            <ChevronDown className={`h-4 w-4 text-(--text-muted) transition-transform duration-200 ${isGroupOpen ? 'rotate-180 text-(--theme-purple)' : ''}`} />
                        </button>
                        
                        {isGroupOpen && (
                            <div className="absolute left-0 right-0 z-50 mt-2 rounded-xl border border-(--border-color)/30 bg-(--bg-card) p-1.5 shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-1 duration-100">
                                <div className="max-h-60 overflow-y-auto space-y-0.5">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData({ ...formData, group_name: null });
                                            setIsGroupOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
                                            !formData.group_name
                                                ? 'bg-(--theme-purple) text-white'
                                                : 'text-(--text-muted) hover:bg-(--bg-main) hover:text-(--text-main)'
                                        }`}
                                    >
                                        Geen groep (nog niet ingedeeld)
                                    </button>
                                    {eventGroups.map((g) => (
                                        <button
                                            key={g}
                                            type="button"
                                            onClick={() => {
                                                setFormData({ ...formData, group_name: g });
                                                setIsGroupOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
                                                formData.group_name === g
                                                    ? 'bg-(--theme-purple) text-white'
                                                    : 'text-(--text-main) hover:bg-(--bg-main)'
                                            }`}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
