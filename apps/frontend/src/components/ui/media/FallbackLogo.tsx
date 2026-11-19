import Image from 'next/image';
import { BRAND_CONFIG } from '@/lib/config/brand';

interface FallbackLogoProps {
    alt?: string;
    className?: string;
    sizes?: string;
    priority?: boolean;
    width?: number;
    height?: number;
}

export function FallbackLogo({
    alt = 'Salve Mundi Logo',
    className = '',
    sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
    priority = false,
    width,
    height,
}: FallbackLogoProps) {
    const dimensionProps = width && height
        ? { width, height }
        : { fill: true as const, sizes };

    return (
        <>
            <Image
                src={BRAND_CONFIG.logoFallbackLight}
                alt={alt}
                {...dimensionProps}
                priority={priority}
                className={`dark:hidden ${className}`.trim()}
                unoptimized
            />
            <Image
                src={BRAND_CONFIG.logoFallbackDark}
                alt={alt}
                {...dimensionProps}
                priority={priority}
                className={`hidden dark:block ${className}`.trim()}
                unoptimized
            />
        </>
    );
}
