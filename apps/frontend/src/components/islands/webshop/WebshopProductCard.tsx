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
    const isSoldOut = product.stock_quantity === 0;

    const showVideo = isHovering && video !== null;

    return (
        <Link
            href={`/merch/${product.slug}`}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            className="group relative z-0 w-full overflow-hidden rounded-[1.75rem] bg-(--bg-card) no-underline shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border dark:border-white/10"
        >
            <div className="relative aspect-square w-full overflow-hidden bg-(--bg-soft)">
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
                    <div className="flex size-full items-center justify-center">
                        <ShoppingBag className="size-12 text-(--theme-purple)/20" />
                    </div>
                )}
                <span className="absolute top-4 right-4 z-10 rounded-full bg-(--theme-purple) px-3 py-1 text-[10px] font-bold tracking-wider text-white uppercase shadow-lg backdrop-blur-md">
                    {product.type === 'clothing' ? 'Kleding' : 'Item'}
                </span>
                {isSoldOut && (
                    <span className="absolute top-4 left-4 z-10 rounded-full bg-black/70 px-3 py-1 text-[10px] font-bold tracking-wider text-white uppercase shadow-lg backdrop-blur-md">
                        Uitverkocht
                    </span>
                )}
            </div>

            <div className="space-y-2 p-5">
                <h3 className="line-clamp-2 text-lg leading-tight font-bold wrap-break-word text-(--theme-purple)/90 transition-colors group-hover:text-(--theme-purple)">
                    {product.name}
                </h3>
                <div className="flex items-center justify-between border-t border-(--border-color) pt-2">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-(--theme-purple)/50 uppercase">Prijs</span>
                        <span className="text-lg font-bold text-(--theme-purple)/80">€{price}</span>
                    </div>
                    <span className="text-xs font-bold tracking-wider text-(--theme-purple) uppercase">Bekijk &rarr;</span>
                </div>
            </div>
        </Link>
    );
}
