'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { directusFetch } from '@/shared/lib/directus';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { Ticket, Save, Calendar, Euro, Percent, AlertCircle } from 'lucide-react';

export default function NewCouponPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        coupon_code: '',
        discount_type: 'fixed',
        discount_value: '',
        usage_limit: '',
        valid_from: '',
        valid_until: '',
        is_active: true
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // Validate required fields
            if (!formData.coupon_code || !formData.discount_value) {
                throw new Error('Vul alle verplichte velden in');
            }

            const discountValue = parseFloat(formData.discount_value.toString().replace(',', '.'));
            if (isNaN(discountValue)) {
                throw new Error('Ongeldige waarde voor korting');
            }

            // Create a clean payload with only valid values
            const payload: any = {
                coupon_code: formData.coupon_code,
                discount_type: formData.discount_type,
                discount_value: discountValue,
                is_active: formData.is_active,
                usage_count: 0
            };

            // Only add optional fields if they have a value
            if (formData.usage_limit) {
                payload.usage_limit = parseInt(formData.usage_limit);
            } else {
                payload.usage_limit = null;
            }

            if (formData.valid_from) {
                payload.valid_from = formData.valid_from;
            }

            if (formData.valid_until) {
                payload.valid_until = formData.valid_until;
            }

            console.log('[NewCoupon] Sending payload:', payload);

            await directusFetch('/items/coupons', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            router.push('/admin/coupons');
        } catch (err: any) {
            console.error('Failed to create coupon:', err);
            setError(err.message || 'Kon coupon niet aanmaken');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <PageHeader
                title="Nieuwe Coupon"
                description="Maak een nieuwe kortingscode aan"
                backLink="/admin/coupons"
            />

            <div className="container mx-auto px-4 py-8 max-w-2xl">
                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 md:p-8 space-y-6 border border-slate-100 dark:border-slate-800">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Code & Type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Coupon Code</label>
                            <div className="relative">
                                <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    placeholder="BV. KORTING2024"
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-theme-purple focus:border-transparent uppercase font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    value={formData.coupon_code}
                                    onChange={(e) => setFormData({ ...formData, coupon_code: e.target.value.toUpperCase() })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Type Korting</label>
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                <button
                                    type="button"
                                    className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${formData.discount_type === 'fixed'
                                        ? 'bg-white text-theme-purple shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                    onClick={() => setFormData({ ...formData, discount_type: 'fixed' })}
                                >
                                    Vast Bedrag (€)
                                </button>
                                <button
                                    type="button"
                                    className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${formData.discount_type === 'percentage'
                                        ? 'bg-white text-theme-purple shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                    onClick={() => setFormData({ ...formData, discount_type: 'percentage' })}
                                >
                                    Percentage (%)
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Value & Limit */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Waarde</label>
                            <div className="relative">
                                {formData.discount_type === 'fixed' ? (
                                    <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                ) : (
                                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                )}
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    placeholder={formData.discount_type === 'fixed' ? '10,00' : '20'}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-theme-purple focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    value={formData.discount_value}
                                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Gebruikslimiet (optioneel)</label>
                            <input
                                type="number"
                                min="1"
                                placeholder="Onbeperkt"
                                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-theme-purple focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                value={formData.usage_limit}
                                onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Validity Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Geldig Vanaf</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    type="date"
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-theme-purple focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    value={formData.valid_from}
                                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Geldig Tot</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    type="date"
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-theme-purple focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    value={formData.valid_until}
                                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 flex items-center justify-end gap-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-2 text-slate-600 dark:text-slate-400 font-medium hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                        >
                            Annuleren
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-theme-purple text-white px-6 py-2 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                'Bezig met opslaan...'
                            ) : (
                                <>
                                    <Save className="h-5 w-5" />
                                    Coupon Opslaan
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
