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

    const hasDrop = product.drop_window !== null;
    const isDropOpen = !product.drop_window || product.drop_window.status === 'open';
    const closesAt = product.drop_window?.closes_at ? new Date(product.drop_window.closes_at) : null;
    const price = Number(product.price).toFixed(2);
    const isSoldOut = product.stock_quantity === 0;

    const handleLogin = () => {
        const returnTo = window.location.pathname + window.location.search;
        localStorage.setItem('auth_return_to', returnTo);
        void login();
    };

    return (
        <div className="space-y-6">
            <div>
                <span className="mb-3 inline-block rounded-full bg-(--bg-soft) px-3 py-1 text-[10px] font-bold tracking-wider text-(--theme-purple) uppercase">
                    {product.type === 'clothing' ? 'Kleding' : 'Item'}
                </span>
                <h1 className="text-3xl font-bold text-(--theme-purple)/90">{product.name}</h1>
            </div>

            {product.description && (
                <SafeMarkdown content={product.description} className="text-(--text-muted)" />
            )}

            <div className="space-y-1 rounded-2xl border border-(--border-color) p-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-(--text-muted)">Prijs</span>
                    <span className="text-xl font-bold text-(--theme-purple)/90">€{price}</span>
                </div>
            </div>

            <div className="space-y-1 rounded-2xl bg-(--bg-soft) p-4 text-sm text-(--text-muted)">
                <p className="font-bold text-(--theme-purple)/80">{hasDrop ? 'Dit is een preorder drop' : 'Volledige betaling'}</p>
                <p>Je betaalt nu de volledige prijs. Er is geen bezorging &mdash; je haalt je bestelling op tijdens een afgesproken afhaalmoment.</p>
                {closesAt && (
                    <p>{isDropOpen ? `Bestellen kan tot ${formatDate(closesAt, 'd MMMM yyyy HH:mm')}.` : `Deze drop is gesloten sinds ${formatDate(closesAt, 'd MMMM yyyy HH:mm')}.`}</p>
                )}
            </div>

            {isSoldOut ? (
                <button type="button" disabled className="form-button flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-full bg-(--theme-purple)/10 py-3 font-bold text-(--theme-purple)/40">
                    <Lock className="size-4" />
                    Uitverkocht
                </button>
            ) : !isDropOpen ? (
                <button type="button" disabled className="form-button flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-full bg-(--theme-purple)/10 py-3 font-bold text-(--theme-purple)/40">
                    <Lock className="size-4" />
                    Drop gesloten
                </button>
            ) : !isLoggedIn ? (
                <button
                    type="button"
                    onClick={handleLogin}
                    className="hover:scale-1.02 form-button flex w-full items-center justify-center gap-2 rounded-full bg-(--theme-purple) py-3 font-bold text-white shadow-(--theme-purple)/20 shadow-lg transition-all"
                >
                    <LogIn className="size-4" />
                    Log in om te bestellen
                </button>
            ) : !isMember ? (
                <div className="flex w-full items-center justify-center gap-2 rounded-full bg-(--theme-warning)/10 px-4 py-3 text-center font-bold text-(--theme-warning)">
                    <ShieldAlert className="size-4 shrink-0" />
                    Bestellen is alleen voor leden van Salve Mundi.
                </div>
            ) : (
                <Link
                    href={`/merch/bestellen?product=${product.slug}`}
                    className="hover:scale-1.02 flex w-full items-center justify-center gap-2 rounded-full bg-(--theme-purple) py-3 font-bold text-white no-underline shadow-(--theme-purple)/20 shadow-lg transition-all"
                >
                    Bestel nu
                </Link>
            )}
        </div>
    );
}
