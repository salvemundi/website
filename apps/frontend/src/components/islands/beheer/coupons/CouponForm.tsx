'use client';

import React from 'react';
import {
    Percent,
    Euro,
    Loader2,
    AlertCircle,
    Check,
    Save
} from 'lucide-react';
import { AdminDatepicker } from '@/components/ui/forms/AdminDatepicker';

const toISODateString = (date: Date | null): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

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
    const [validFrom, setValidFrom] = React.useState<Date | null>(null);
    const [validUntil, setValidUntil] = React.useState<Date | null>(null);

    const handleSubmit = (e: React.SyntheticEvent) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget as HTMLFormElement);
        onSave(fd, discountType);
    };

    return (
        <form onSubmit={handleSubmit} autoComplete="off" className="relative z-10 space-y-8">

            {error && (
                <div className="relative z-10 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-xs font-semibold text-red-500">
                    <AlertCircle className="size-4 shrink-0" />
                    {error}
                </div>
            )}

            <div className="relative z-10 grid grid-cols-1 gap-8 md:grid-cols-2">
                {/* Coupon Code */}
                <div className="space-y-3">
                    <label className="text-xs font-semibold text-(--beheer-text-muted)">Coupon Code *</label>
                    <input
                        type="text"
                        name="coupon_code"
                        required
                        placeholder="BV. KORTING2025"
                        className="beheer-input w-full rounded-xl border border-(--beheer-border) bg-(--beheer-card-soft) px-5 py-4 font-mono font-semibold text-(--beheer-text) transition-all outline-none focus:border-(--beheer-accent) focus:ring-4 focus:ring-(--beheer-accent)/10"
                        onChange={e => e.target.value = e.target.value.toUpperCase()}
                    />
                </div>

                {/* Discount Type */}
                <div className="space-y-3">
                    <label className="text-xs font-semibold text-(--beheer-text-muted)">Type Korting</label>
                    <div className="grid grid-cols-2 rounded-xl border border-(--beheer-border) bg-(--beheer-card-soft) p-1">
                        <button type="button" onClick={() => setDiscountType('fixed')}
                            className={`tab-button cursor-pointer rounded-lg px-4 py-3 text-xs font-semibold transition-all ${discountType === 'fixed' ? 'bg-(--beheer-accent) text-white shadow-lg' : 'text-(--beheer-text-muted) hover:text-(--beheer-text)'}`}>
                            <Euro className="mr-2 inline size-3.5" /> Vast Bedrag
                        </button>
                        <button type="button" onClick={() => setDiscountType('percentage')}
                            className={`tab-button cursor-pointer rounded-lg px-4 py-3 text-xs font-semibold transition-all ${discountType === 'percentage' ? 'bg-(--beheer-accent) text-white shadow-lg' : 'text-(--beheer-text-muted) hover:text-(--beheer-text)'}`}>
                            <Percent className="mr-2 inline size-3.5" /> Percentage
                        </button>
                    </div>
                </div>

                {/* Discount Value */}
                <div className="space-y-3">
                    <label className="text-xs font-semibold text-(--beheer-text-muted)">Waarde *</label>
                    <div className="relative">
                        <input
                            type="number"
                            name="discount_value"
                            required
                            min="0.01"
                            max={discountType === 'percentage' ? 100 : undefined}
                            step="0.01"
                            placeholder={discountType === 'fixed' ? '12.34' : '20'}
                            className="beheer-input w-full rounded-xl border border-(--beheer-border) bg-(--beheer-card-soft) px-5 py-4 font-semibold text-(--beheer-text) transition-all outline-none focus:border-(--beheer-accent) focus:ring-4 focus:ring-(--beheer-accent)/10"
                        />
                        <div className="absolute top-1/2 right-5 -translate-y-1/2 text-xs font-bold text-(--beheer-text-muted) opacity-40">
                            {discountType === 'fixed' ? 'EUR' : '%'}
                        </div>
                    </div>
                </div>

                {/* Usage Limit */}
                <div className="space-y-3">
                    <label className="text-xs font-semibold text-(--beheer-text-muted)">Gebruikslimiet</label>
                    <input type="number" name="usage_limit" min="1" placeholder="Onbeperkt" className="beheer-input w-full rounded-xl border border-(--beheer-border) bg-(--beheer-card-soft) px-5 py-4 font-semibold text-(--beheer-text) transition-all outline-none focus:border-(--beheer-accent) focus:ring-4 focus:ring-(--beheer-accent)/10" />
                </div>

                {/* Valid From */}
                <div className="space-y-3">
                    <label className="text-xs font-semibold text-(--beheer-text-muted)">Geldig Vanaf</label>
                    <input type="hidden" name="valid_from" value={validFrom ? toISODateString(validFrom) : ''} />
                    <AdminDatepicker
                        value={validFrom}
                        onChange={setValidFrom}
                    />
                </div>

                {/* Valid Until */}
                <div className="space-y-3">
                    <label className="text-xs font-semibold text-(--beheer-text-muted)">Geldig Tot</label>
                    <input type="hidden" name="valid_until" value={validUntil ? toISODateString(validUntil) : ''} />
                    <AdminDatepicker
                        value={validUntil}
                        onChange={setValidUntil}
                        minDate={validFrom || undefined}
                    />
                </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-4 p-2">
                <div className="relative flex items-center justify-center">
                    <input type="checkbox" id="is_active" name="is_active" defaultChecked className="peer sr-only" />
                    <div className="size-6 rounded-lg border-2 border-(--beheer-border) transition-all peer-checked:border-(--beheer-accent) peer-checked:bg-(--beheer-accent)"></div>
                    <Check className="absolute size-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
                </div>
                <label htmlFor="is_active" className="cursor-pointer text-xs font-semibold text-(--beheer-text-muted) transition-colors hover:text-(--beheer-text)">Direct actief stellen</label>
            </div>

            <div className="flex flex-col justify-end gap-4 border-t border-(--beheer-border) pt-8 sm:flex-row">
                <button
                    type="button"
                    onClick={onCancel}
                    className="beheer-button cursor-pointer rounded-xl border border-(--beheer-border) px-8 py-4 text-sm font-semibold text-(--beheer-text) transition-all hover:bg-(--beheer-card-soft)"
                >
                    Annuleren
                </button>
                <button
                    type="submit"
                    disabled={isPending}
                    className="beheer-button flex cursor-pointer items-center justify-center gap-3 rounded-xl bg-(--beheer-accent) px-10 py-4 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                >
                    {isPending ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
                    <span>{isPending ? 'Bezig...' : 'Coupon Aanmaken'}</span>
                </button>
            </div>
        </form>
    );
}
