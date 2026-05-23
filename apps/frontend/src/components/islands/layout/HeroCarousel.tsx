'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

interface HeroCarouselProps {
    slideUrls: string[];
}

export function HeroCarousel({ slideUrls }: HeroCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (slideUrls.length <= 1) return;

        const interval = setInterval(() => {
            if (scrollRef.current) {
                const nextIndex = (currentIndex + 1) % slideUrls.length;
                const scrollWidth = scrollRef.current.clientWidth;

                scrollRef.current.scrollTo({
                    left: nextIndex * scrollWidth,
                    behavior: 'smooth'
                });

                setCurrentIndex(nextIndex);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [currentIndex, slideUrls.length]);

    if (slideUrls.length === 0) return null;

    return (
        <div className="w-full h-full relative group bg-[var(--bg-main)]">

            <div className="block sm:hidden w-full aspect-[4/3] relative">
                <Image
                    src={slideUrls[0]}
                    alt="Salve Mundi"
                    fill
                    priority
                    fetchPriority="high"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 80vw, 50vw"
                    className="object-cover object-center"
                />
            </div>

            <div className="hidden sm:block h-full w-full relative">
                <div
                    ref={scrollRef}
                    className="flex w-full h-full overflow-x-hidden snap-x snap-mandatory"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {slideUrls.map((src, index) => (
                        <div key={index} className="w-full h-full flex-shrink-0 snap-center relative">
                            <Image
                                src={src}
                                alt={`Sfeerimpressie ${index + 1}`}
                                fill
                                priority={index === 0}
                                fetchPriority={index === 0 ? 'high' : undefined}
                                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 600px"
                                className="object-cover object-center"
                            />
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}