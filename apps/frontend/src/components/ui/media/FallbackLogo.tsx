import Image from 'next/image';
import { BRAND_CONFIG } from '@/lib/config/brand';

interface FallbackLogoProps {
    className?: string;
    sizes?: string;
}

export function FallbackLogo({
    className = "",
    sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
}: FallbackLogoProps) {
    return (
        <>
            <Image
                src={BRAND_CONFIG.logoFallbackLight}
                alt="Salve Mundi Light Logo"
                fill
                sizes={sizes}
                className={`dark:hidden ${className}`.trim()}
                unoptimized
            />
            <Image
                src={BRAND_CONFIG.logoFallbackDark}
                alt="Salve Mundi Dark Logo"
                fill
                sizes={sizes}
                className={`hidden dark:block ${className}`.trim()}
                unoptimized
            />
        </>
    );
}