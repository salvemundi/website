'use client';

import React from 'react';
import { 
    Plus, 
    Percent, 
    Euro, 
    Calendar, 
    Loader2, 
    X, 
    AlertCircle, 
    Save 
} from 'lucide-react';

interface Props {
    onSave: (formData: FormData, discountType: 'fixed' | 'percentage') => void;
    onCancel: () => void;
    isPending: boolean;
    error: string | null;
}

export default function CouponForm({
    onSave,
    onCancel,
    isPending,
    error
}: Props) {
    const [discountType, setDiscountType] = React.useState<'fixed' | 'percentage'>('fixed');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        onSave(fd, discountType);
    };

    return (
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-8 relative z-10">

            {error && (
                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-500 px-5 py-4 rounded-2xl text-xs font-semibold relative z-10">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                {/* Coupon Code */}
                <div className="space-y-3">
                    <label className="text-xs font-semibold text-[var(--beheer-text-muted)]">Coupon Code *</label>
                    <input
                        type="text"
                        name="coupon_code"
                        required
                        placeholder="BV. KORTING2025"
                        className="w-full px-5 py-4 rounded-xl border border-[var(--beheer-border)] bg-[var(--beheer-card-soft)] text-[var(--beheer-text)] font-mono focus:ring-4 focus:ring-[var(--beheer-accent)]/10 focus:border-[var(--beheer-accent)] outline-none transition-all font-semibold"
                        onChange={e => e.target.value = e.target.value.toUpperCase()}
                    />
                </div>

                {/* Discount Type */}
                <div className="space-y-3">
                    <label className="text-xs font-semibold text-[var(--beheer-text-muted)]">Type Korting</label>
                    <div className="grid grid-cols-2 bg-[var(--beheer-card-soft)] p-1 rounded-xl border border-[var(--beheer-border)]">
                        <button type="button" onClick={() => setDiscountType('fixed')}
                            className={`py-3 px-4 rounded-lg text-xs font-semibold transition-all cursor-pointer ${discountType === 'fixed' ? 'bg-[var(--beheer-accent)] text-white shadow-lg' : 'text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)]'}`}>
                            <Euro className="inline h-3.5 w-3.5 mr-2" /> Vast Bedrag
                        </button>
                        <button type="button" onClick={() => setDiscountType('percentage')}
                            className={`py-3 px-4 rounded-lg text-xs font-semibold transition-all cursor-pointer ${discountType === 'percentage' ? 'bg-[var(--beheer-accent)] text-white shadow-lg' : 'text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)]'}`}>
                            <Percent className="inline h-3.5 w-3.5 mr-2" /> Percentage
                        </button>
                    </div>
                </div>

                {/* Discount Value */}
                <div className="space-y-3">
                    <label className="text-xs font-semibold text-[var(--beheer-text-muted)]">Waarde *</label>
                    <div className="relative">
                        <input
                            type="number"
                            name="discount_value"
                            required
                            min="0.01"
                            max={discountType === 'percentage' ? 100 : undefined}
                            step="0.01"
                            placeholder={discountType === 'fixed' ? '12.34' : '20'}
                            className="w-full px-5 py-4 rounded-xl border border-[var(--beheer-border)] bg-[var(--beheer-card-soft)] text-[var(--beheer-text)] focus:ring-4 focus:ring-[var(--beheer-accent)]/10 focus:border-[var(--beheer-accent)] outline-none transition-all font-semibold"
                        />
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[var(--beheer-text-muted)] font-bold text-xs opacity-40">
                            {discountType === 'fixed' ? 'EUR' : '%'}
                        </div>
                    </div>
                </div>

                {/* Usage Limit */}
                <div className="space-y-3">
                    <label className="text-xs font-semibold text-[var(--beheer-text-muted)]">Gebruikslimiet (optioneel)</label>
                    <input type="number" name="usage_limit" min="1" placeholder="Onbeperkt" className="w-full px-5 py-4 rounded-xl border border-[var(--beheer-border)] bg-[var(--beheer-card-soft)] text-[var(--beheer-text)] focus:ring-4 focus:ring-[var(--beheer-accent)]/10 focus:border-[var(--beheer-accent)] outline-none transition-all font-semibold" />
                </div>

                {/* Valid From */}
                <div className="space-y-3">
                    <label className="text-xs font-semibold text-[var(--beheer-text-muted)]">Geldig Vanaf</label>
                    <input type="date" name="valid_from" className="w-full px-5 py-4 rounded-xl border border-[var(--beheer-border)] bg-[var(--beheer-card-soft)] text-[var(--beheer-text)] font-semibold text-sm focus:ring-4 focus:ring-[var(--beheer-accent)]/10 focus:border-[var(--beheer-accent)] outline-none transition-all" />
                </div>

                {/* Valid Until */}
                <div className="space-y-3">
                    <label className="text-xs font-semibold text-[var(--beheer-text-muted)]">Geldig Tot</label>
                    <input type="date" name="valid_until" className="w-full px-5 py-4 rounded-xl border border-[var(--beheer-border)] bg-[var(--beheer-card-soft)] text-[var(--beheer-text)] font-semibold text-sm focus:ring-4 focus:ring-[var(--beheer-accent)]/10 focus:border-[var(--beheer-accent)] outline-none transition-all" />
                </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-4 relative z-10 p-2">
                <div className="relative flex items-center justify-center">
                    <input type="checkbox" id="is_active" name="is_active" defaultChecked className="peer sr-only" />
                    <div className="w-6 h-6 border-2 border-[var(--beheer-border)] rounded-lg peer-checked:border-[var(--beheer-accent)] peer-checked:bg-[var(--beheer-accent)] transition-all"></div>
                    <Save className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
                <label htmlFor="is_active" className="text-xs font-semibold text-[var(--beheer-text-muted)] cursor-pointer hover:text-[var(--beheer-text)] transition-colors">Direct actief stellen</label>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-8 border-t border-[var(--beheer-border)] relative z-10">
                <button 
                    type="button" 
                    onClick={onCancel} 
                    className="px-8 py-4 rounded-xl font-semibold text-sm border border-[var(--beheer-border)] text-[var(--beheer-text)] hover:bg-[var(--beheer-card-soft)] transition-all cursor-pointer"
                >
                    Annuleren
                </button>
                <button 
                    type="submit" 
                    disabled={isPending} 
                    className="flex items-center justify-center gap-3 px-10 py-4 bg-[var(--beheer-accent)] text-white font-semibold text-sm rounded-xl shadow-lg hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                    {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    <span>{isPending ? 'Bezig...' : 'Coupon Aanmaken'}</span>
                </button>
            </div>
        </form>
    );
}
