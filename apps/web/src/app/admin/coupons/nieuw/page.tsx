'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCouponAction } from '@/shared/api/coupon-actions';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { Ticket, Save, Calendar, Euro, Percent, AlertCircle } from 'lucide-react';
import { useAuth } from '@/features/auth/providers/auth-provider';
import { isUserAuthorized, getMergedTokens, normalizeCommitteeName } from '@/shared/lib/committee-utils';
import { siteSettingsApi } from '@/shared/lib/api/site-settings';
import NoAccessPage from '../../no-access/page';
import { useEffect } from 'react';

export default function NewCouponPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        checkAccess();
    }, [user]);

    const checkAccess = async () => {
        if (!user) {
            setIsAuthorized(false);
            return;
        }

        try {
            const setting = await siteSettingsApi.getSingle('admin_coupons', true);
            const tokens = getMergedTokens(setting?.authorized_tokens, ['ictcommissie', 'bestuur', 'kascommissie', 'kandidaatbestuur']);
            setIsAuthorized(isUserAuthorized(user, tokens));
        } catch (error) {
            // Fallback for static check
            const committees: any[] = (user as any).committees || [];
            const names = committees.map((c: any) => normalizeCommitteeName(typeof c === 'string' ? c : c.name || c.committee_id?.name || ''));
            const hasAccess = names.some(n => n.includes('ict') || n.includes('bestuur') || n.includes('kas') || n.includes('kandi'));
            setIsAuthorized(hasAccess);
        }
    };

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
                coupon_code: formData.coupon_code.toUpperCase().trim(),
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

            const result = await createCouponAction(payload);

            if (!result.success) {
                throw new Error(result.error);
            }

            router.push('/admin/coupons');
        } catch (err: any) {
            console.error('Failed to create coupon:', err);
            setError(err.message || 'Kon coupon niet aanmaken');
        } finally {
            setIsLoading(false);
        }
    };

    if (isAuthorized === false) {
        return <NoAccessPage />;
    }

    if (isAuthorized === null) {
        return null;
    }

    return (
        <>
            <PageHeader
                title="Nieuwe Coupon"
                description="Maak een nieuwe kortingscode aan"
                backLink="/admin/coupons"
            />

            <div className="container mx-auto px-4 py-8 max-w-2xl">
                <form onSubmit={handleSubmit} className="bg-admin-card rounded-2xl shadow-lg p-6 md:p-8 space-y-6 border border-admin">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
                            <AlertCircle className="h-5 w-5 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Code & Type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-admin-muted">Coupon Code</label>
                            <div className="relative">
                                <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-admin-muted" />
                                <input
                                    type="text"
                                    required
                                    placeholder="BV. KORTING2024"
                                    className="w-full pl-10 pr-4 py-2 border border-admin rounded-lg focus:ring-2 focus:ring-theme-purple focus:border-transparent uppercase font-mono bg-admin-card text-admin"
                                    value={formData.coupon_code}
                                    onChange={(e) => setFormData({ ...formData, coupon_code: e.target.value.toUpperCase() })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-admin-muted">Type Korting</label>
                            <div className="flex bg-admin-card-soft p-1 rounded-lg">
                                <button
                                    type="button"
                                    className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${formData.discount_type === 'fixed'
                                        ? 'bg-admin-card text-theme-purple shadow-sm'
                                        : 'text-admin-muted hover:text-admin'
                                        }`}
                                    onClick={() => setFormData({ ...formData, discount_type: 'fixed' })}
                                >
                                    Vast Bedrag (€)
                                </button>
                                <button
                                    type="button"
                                    className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${formData.discount_type === 'percentage'
                                        ? 'bg-admin-card text-theme-purple shadow-sm'
                                        : 'text-admin-muted hover:text-admin'
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
                            <label className="text-sm font-semibold text-admin-muted">Waarde</label>
                            <div className="relative">
                                {formData.discount_type === 'fixed' ? (
                                    <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-admin-muted" />
                                ) : (
                                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-admin-muted" />
                                )}
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    placeholder={formData.discount_type === 'fixed' ? '10,00' : '20'}
                                    className="w-full pl-10 pr-4 py-2 border border-admin rounded-lg focus:ring-2 focus:ring-theme-purple focus:border-transparent bg-admin-card text-admin"
                                    value={formData.discount_value}
                                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-admin-muted">Gebruikslimiet (optioneel)</label>
                            <input
                                type="number"
                                min="1"
                                placeholder="Onbeperkt"
                                className="w-full px-4 py-2 border border-admin rounded-lg focus:ring-2 focus:ring-theme-purple focus:border-transparent bg-admin-card text-admin"
                                value={formData.usage_limit}
                                onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Validity Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-admin-muted">Geldig Vanaf</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-admin-muted" />
                                <input
                                    type="date"
                                    className="w-full pl-10 pr-4 py-2 border border-admin rounded-lg focus:ring-2 focus:ring-theme-purple focus:border-transparent bg-admin-card text-admin"
                                    value={formData.valid_from}
                                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-admin-muted">Geldig Tot</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-admin-muted" />
                                <input
                                    type="date"
                                    className="w-full pl-10 pr-4 py-2 border border-admin rounded-lg focus:ring-2 focus:ring-theme-purple focus:border-transparent bg-admin-card text-admin"
                                    value={formData.valid_until}
                                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 flex items-center justify-end gap-4 border-t border-admin mt-6">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-2 text-admin-muted font-medium hover:text-admin transition-colors"
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
