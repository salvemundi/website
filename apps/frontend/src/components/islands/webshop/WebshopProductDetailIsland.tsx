'use client';

import Link from 'next/link';
import { Lock, LogIn, ShieldAlert } from 'lucide-react';
import { useAuthActions } from '@/features/auth/providers/auth-provider';
import { SafeMarkdown } from '@/components/ui/security/SafeMarkdown';
import { formatDate } from '@/shared/lib/utils/date';
import { type WebshopCatalogProduct } from '@salvemundi/validations/schema/webshop.zod';

interface WebshopProductDetailIslandProps {
    product: WebshopCatalogProduct;
    isLoggedIn: boolean;
    isMember: boolean;
}

export default function WebshopProductDetailIsland({ product, isLoggedIn, isMember }: WebshopProductDetailIslandProps) {
    const { login } = useAuthActions();

    const isDropOpen = product.drop_window?.status === 'open';
    const closesAt = product.drop_window?.closes_at ? new Date(product.drop_window.closes_at) : null;
    const price = Number(product.price).toFixed(2);
    const deposit = Number(product.deposit_amount).toFixed(2);
    const remaining = (Number(product.price) - Number(product.deposit_amount)).toFixed(2);

    const handleLogin = () => {
        const returnTo = window.location.pathname + window.location.search;
        localStorage.setItem('auth_return_to', returnTo);
        void login();
    };

    return (
        <div className="space-y-6">
            <div>
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-(--theme-purple) bg-(--bg-soft) px-3 py-1 rounded-full mb-3">
                    {product.type === 'clothing' ? 'Kleding' : 'Item'}
                </span>
                <h1 className="text-3xl font-bold text-(--theme-purple)/90">{product.name}</h1>
            </div>

            {product.description && (
                <SafeMarkdown content={product.description} className="text-(--text-muted)" />
            )}

            <div className="rounded-2xl border border-(--border-color) p-4 space-y-1">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-(--text-muted)">Totaalprijs</span>
                    <span className="text-xl font-bold text-(--theme-purple)/90">€{price}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-(--text-muted)">
                    <span>Aanbetaling nu</span>
                    <span>€{deposit}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-(--text-muted)">
                    <span>Restbetaling later</span>
                    <span>€{remaining}</span>
                </div>
            </div>

            <div className="rounded-2xl bg-(--bg-soft) p-4 text-sm text-(--text-muted) space-y-1">
                <p className="font-bold text-(--theme-purple)/80">Dit is een preorder drop</p>
                <p>Je betaalt nu alleen de aanbetaling; de restbetaling volgt later. Er is geen bezorging &mdash; je haalt je bestelling op tijdens een afgesproken afhaalmoment.</p>
                {closesAt && (
                    <p>{isDropOpen ? `Bestellen kan tot ${formatDate(closesAt, 'd MMMM yyyy HH:mm')}.` : `Deze drop is gesloten sinds ${formatDate(closesAt, 'd MMMM yyyy HH:mm')}.`}</p>
                )}
            </div>

            {!isDropOpen ? (
                <button type="button" disabled className="form-button w-full py-3 rounded-full bg-(--theme-purple)/10 text-(--theme-purple)/40 font-bold cursor-not-allowed flex items-center justify-center gap-2">
                    <Lock className="h-4 w-4" />
                    Drop gesloten
                </button>
            ) : !isLoggedIn ? (
                <button
                    type="button"
                    onClick={handleLogin}
                    className="form-button w-full py-3 rounded-full bg-(--theme-purple) text-white font-bold shadow-lg shadow-(--theme-purple)/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                    <LogIn className="h-4 w-4" />
                    Log in om te bestellen
                </button>
            ) : !isMember ? (
                <div className="w-full py-3 rounded-full bg-(--theme-warning)/10 text-(--theme-warning) font-bold flex items-center justify-center gap-2 text-center px-4">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    Bestellen is alleen voor leden van Salve Mundi.
                </div>
            ) : (
                <Link
                    href={`/webshop/bestellen?product=${product.slug}`}
                    className="w-full py-3 rounded-full bg-(--theme-purple) text-white font-bold shadow-lg shadow-(--theme-purple)/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 no-underline"
                >
                    Bestel nu
                </Link>
            )}
        </div>
    );
}
