'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { USE_MODERN_UI } from '../config/ui-config';
import ModernHero from './modern/ModernHero';

export interface HeroBannerProps {
  title: string;
  subtitle?: string;
  image?: {
    src: string;
    alt: string;
    priority?: boolean;
  };
  cta?: {
    label: string;
    href: string;
    variant?: 'primary' | 'secondary';
  };
  gradient?: boolean;
}

export default function HeroBanner(props: HeroBannerProps) {
  // Global Switch for Modern UI
  if (USE_MODERN_UI) {
    return <ModernHero {...props} />;
  }

  const {
    title,
    subtitle,
    image,
    cta,
    gradient = true,
  } = props;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl lg:rounded-3xl shadow-2xl mb-8 lg:mb-12">
      {/* Background Image or Gradient */}
      {image ? (
        <div className="relative w-full h-64 sm:h-80 lg:h-96">
          <Image
            src={image.src}
            alt={image.alt}
            fill
            priority={image.priority}
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
          />
          {gradient && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          )}
        </div>
      ) : (
        <div className="relative w-full h-64 sm:h-80 lg:h-96 bg-gradient-theme" />
      )}

      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 lg:p-12">
        <div className="max-w-4xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-3 lg:mb-4 drop-shadow-lg">
            {title}
          </h1>
          {subtitle && (
            <p className="text-base sm:text-lg lg:text-xl text-white/90 mb-4 lg:mb-6 max-w-2xl drop-shadow-md">
              {subtitle}
            </p>
          )}
          {cta && (
            <Link
              href={cta.href}
              className={`inline-flex items-center gap-2 px-6 py-3 lg:px-8 lg:py-4 text-sm lg:text-base font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 ${cta.variant === 'secondary'
                ? 'bg-white text-theme-purple hover:bg-gray-100'
                : 'bg-gradient-theme text-white hover:brightness-110'
                }`}
            >
              {cta.label}
              <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
