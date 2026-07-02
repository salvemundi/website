'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import MediaAsset from '@/components/ui/media/MediaAsset';
import { type WebshopCatalogProduct } from '@salvemundi/validations/schema/webshop.zod';

interface WebshopProductCardProps {
    product: WebshopCatalogProduct;
}

export default function WebshopProductCard({ product }: WebshopProductCardProps) {
    const [isHovering, setIsHovering] = useState(false);
    const cover = product.media.length > 0 ? product.media[0] : null;
    const video = product.media.find(m => m.asset_type?.startsWith('video/')) ?? null;
    const price = Number(product.price).toFixed(2);
    const deposit = Number(product.deposit_amount).toFixed(2);

    const showVideo = isHovering && video !== null;

    return (
        <Link
            href={`/webshop/${product.slug}`}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            className="group relative z-0 overflow-hidden w-full rounded-[1.75rem] bg-(--bg-card) dark:border dark:border-white/10 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 no-underline"
        >
            <div className="relative w-full aspect-square overflow-hidden bg-(--bg-soft)">
                {showVideo ? (
                    <MediaAsset
                        asset={{ id: video.asset, type: video.asset_type }}
                        alt={`${product.name} - video preview`}
                        fill
                        objectFit="cover"
                    />
                ) : cover ? (
                    <MediaAsset
                        asset={{ id: cover.asset, type: cover.asset_type }}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
                        objectFit="cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="h-12 w-12 text-(--theme-purple)/20" />
                    </div>
                )}
                <span className="absolute top-4 right-4 z-10 bg-(--theme-purple) text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg uppercase tracking-wider backdrop-blur-md">
                    {product.type === 'clothing' ? 'Kleding' : 'Item'}
                </span>
            </div>

            <div className="p-5 space-y-2">
                <h3 className="text-lg font-bold text-(--theme-purple)/90 leading-tight group-hover:text-(--theme-purple) transition-colors line-clamp-2 break-words">
                    {product.name}
                </h3>
                <div className="flex items-center justify-between pt-2 border-t border-(--border-color)">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-(--theme-purple)/50">Prijs &middot; aanbetaling €{deposit} nu</span>
                        <span className="text-lg font-bold text-(--theme-purple)/80">€{price}</span>
                    </div>
                    <span className="text-xs font-bold text-(--theme-purple) uppercase tracking-wider">Bekijk &rarr;</span>
                </div>
            </div>
        </Link>
    );
}
