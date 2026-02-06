'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/providers/auth-provider';
import { directusFetch } from '@/shared/lib/directus';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { Ticket, Plus, Percent, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { isUserAuthorized, getMergedTokens, normalizeCommitteeName } from '@/shared/lib/committee-utils';
import { siteSettingsApi } from '@/shared/lib/api/salvemundi';
import NoAccessPage from '../no-access/page';
import { getComputedCouponStatus, type Coupon } from '@/shared/lib/coupon-utils';

export default function AdminCouponsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        checkAccess();
        loadCoupons();
    }, []);

    const checkAccess = async () => {
        if (!user) {
            setIsAuthorized(false);
            return;
        }

        try {
            const setting = await siteSettingsApi.get('admin_coupons', true);
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

    const loadCoupons = async () => {
        setIsLoading(true);
        try {
            const data = await directusFetch<Coupon[]>('/items/coupons?sort=-id&fields=*');
            setCoupons(data);
        } catch (error) {
            console.error('Failed to load coupons:', error);
            // alert('Kon coupons niet laden');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Weet je zeker dat je deze coupon wilt verwijderen?')) return;
        try {
            await directusFetch(`/items/coupons/${id}`, { method: 'DELETE' });
            loadCoupons();
        } catch (e: any) {
            console.error(e);
            const message = e.errors?.[0]?.message || e.message || 'Onbekende fout';
            alert(`Kon coupon niet verwijderen: ${message}`);
        }
    };

    const formatCurrency = (val: number | string) => {
        let num = typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
        if (num === null || num === undefined || isNaN(num)) return '€ 0,00';
        return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(num);
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
                title="Coupons Beheer"
                description="Beheer kortingscodes en acties"
                backLink="/admin"
            />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="flex justify-end mb-6">
                    <button
                        onClick={() => router.push('/admin/coupons/nieuw')}
                        className="bg-theme-purple text-white px-4 py-2 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                    >
                        <Plus className="h-5 w-5" />
                        Nieuwe Coupon
                    </button>
                </div>

                <div className="bg-admin-card rounded-2xl shadow-lg overflow-hidden border border-admin">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-admin-card-soft border-b border-admin">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-admin-muted uppercase tracking-wider">Code</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-admin-muted uppercase tracking-wider">Korting</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-admin-muted uppercase tracking-wider">Gebruik</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-admin-muted uppercase tracking-wider">Geldigheid</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-admin-muted uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-admin-muted uppercase tracking-wider">Acties</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-admin bg-admin-card">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-admin-muted">
                                            Laden...
                                        </td>
                                    </tr>
                                ) : coupons.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-admin-muted">
                                            Geen coupons gevonden.
                                        </td>
                                    </tr>
                                ) : (
                                    coupons.map((coupon) => (
                                        <tr key={coupon.id} className="hover:bg-admin-hover transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-admin-card-soft rounded-lg text-theme-purple">
                                                        <Ticket className="h-5 w-5" />
                                                    </div>
                                                    <span className="font-bold text-admin font-mono tracking-wide">{coupon.coupon_code}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-admin font-medium">
                                                    {coupon.discount_type === 'percentage' ? (
                                                        <><Percent className="h-4 w-4 text-admin-muted" /> {coupon.discount_value}%</>
                                                    ) : (
                                                        formatCurrency(coupon.discount_value)
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm">
                                                    <span className="font-bold text-admin">{coupon.usage_count}</span>
                                                    <span className="text-admin-muted"> / </span>
                                                    <span className="text-admin-muted">{coupon.usage_limit ?? '∞'}</span>
                                                </div>
                                                {coupon.usage_limit && coupon.usage_count >= coupon.usage_limit && (
                                                    <span className="text-xs text-red-500 font-medium">Vol</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col text-sm">
                                                    {coupon.valid_from && <span className="text-admin-muted">Van: {new Date(coupon.valid_from).toLocaleDateString('nl-NL')}</span>}
                                                    {coupon.valid_until ? (
                                                        <span className={`${new Date(coupon.valid_until) < new Date() ? 'text-red-500' : 'text-admin-muted'}`}>
                                                            Tot: {new Date(coupon.valid_until).toLocaleDateString('nl-NL')}
                                                        </span>
                                                    ) : (
                                                        <span className="text-admin-muted">Geen einddatum</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {(() => {
                                                    const status = getComputedCouponStatus(coupon);
                                                    return (
                                                        <span
                                                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                                                            title={status.description}
                                                        >
                                                            {status.type === 'active' ? (
                                                                <CheckCircle className="h-3 w-3" />
                                                            ) : (
                                                                <XCircle className="h-3 w-3" />
                                                            )}
                                                            {status.label}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <button
                                                    onClick={() => handleDelete(coupon.id)}
                                                    className="text-admin-muted hover:text-red-500 transition-colors p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                                    title="Verwijderen"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}
