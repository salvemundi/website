'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { directusFetch } from '@/shared/lib/directus';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { Ticket, Plus, Percent, DollarSign, CheckCircle, XCircle } from 'lucide-react';

interface Coupon {
    id: number;
    coupon_code: string;
    discount_type: 'fixed' | 'percentage';
    discount_value: number;
    usage_limit: number | null;
    usage_count: number;
    valid_from: string | null;
    valid_until: string | null;
    is_active: boolean;
}

export default function AdminCouponsPage() {
    const router = useRouter();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadCoupons();
    }, []);

    const loadCoupons = async () => {
        setIsLoading(true);
        try {
            const data = await directusFetch<Coupon[]>('/items/coupons?sort=-id');
            setCoupons(data);
        } catch (error) {
            console.error('Failed to load coupons:', error);
            // alert('Kon coupons niet laden');
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(val);

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
                        onClick={() => router.push('/admin/coupons/nieuw')} // Future impl
                        className="bg-theme-purple text-white px-4 py-2 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 opacity-50 cursor-not-allowed"
                        title="Nog niet geïmplementeerd"
                    >
                        <Plus className="h-5 w-5" />
                        Nieuwe Coupon
                    </button>
                </div>

                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Code</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Korting</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Gebruik</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Geldigheid</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                            Laden...
                                        </td>
                                    </tr>
                                ) : coupons.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                            Geen coupons gevonden.
                                        </td>
                                    </tr>
                                ) : (
                                    coupons.map((coupon) => (
                                        <tr key={coupon.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-purple-50 rounded-lg text-theme-purple">
                                                        <Ticket className="h-5 w-5" />
                                                    </div>
                                                    <span className="font-bold text-slate-800 font-mono tracking-wide">{coupon.coupon_code}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-slate-700 font-medium">
                                                    {coupon.discount_type === 'percentage' ? (
                                                        <><Percent className="h-4 w-4 text-slate-400" /> {coupon.discount_value}%</>
                                                    ) : (
                                                        <><DollarSign className="h-4 w-4 text-slate-400" /> {formatCurrency(coupon.discount_value)}</>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm">
                                                    <span className="font-bold text-slate-800">{coupon.usage_count}</span>
                                                    <span className="text-slate-400"> / </span>
                                                    <span className="text-slate-600">{coupon.usage_limit ?? '∞'}</span>
                                                </div>
                                                {coupon.usage_limit && coupon.usage_count >= coupon.usage_limit && (
                                                    <span className="text-xs text-red-500 font-medium">Vol</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col text-sm">
                                                    {coupon.valid_from && <span className="text-slate-600">Van: {new Date(coupon.valid_from).toLocaleDateString()}</span>}
                                                    {coupon.valid_until ? (
                                                        <span className={`${new Date(coupon.valid_until) < new Date() ? 'text-red-500' : 'text-slate-600'}`}>
                                                            Tot: {new Date(coupon.valid_until).toLocaleDateString()}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400">Geen einddatum</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {coupon.is_active ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        <CheckCircle className="h-3 w-3" /> Actief
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        <XCircle className="h-3 w-3" /> Inactief
                                                    </span>
                                                )}
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
