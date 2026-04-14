'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
import { cn } from '@/lib/utils/cn';

interface HeroCarouselProps {
    slideUrls: string[];
}

export function HeroCarousel({ slideUrls }: HeroCarouselProps) {
    const [mounted, setMounted] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setMounted(true);
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <div className="w-full h-full relative group">
            {/* 
                STABILITY: Always render the first slide's image as a base layer.
                This ensures that before and during hydration, there is zero shift.
                Once Swiper (JS) initializes, it sits on top.
            */}
            <div className={cn(
                "absolute inset-0 z-0 transition-opacity duration-500",
                mounted && !isMobile ? "opacity-0" : "opacity-100"
            )}>
                <Image 
                    src={slideUrls[0]} 
                    alt="Salve Mundi" 
                    fill 
                    priority 
                    unoptimized 
                    className="object-cover object-center" 
                />
            </div>

            {mounted && (
                <div className="absolute inset-0 z-10">
                    {isMobile ? (
                        <div className="sm:hidden w-full h-full relative">
                            <Image src={slideUrls[0]} alt="Salve Mundi" fill priority unoptimized className="object-cover object-center" />
                        </div>
                    ) : (
                        <div className="hidden sm:block h-full w-full">
                            <Swiper 
                                modules={[Autoplay]} 
                                autoplay={{ delay: 5000, disableOnInteraction: false }} 
                                loop={slideUrls.length > 1} 
                                className="h-full w-full"
                            >
                                {slideUrls.map((src, index) => (
                                    <SwiperSlide key={index}>
                                        <div className="w-full h-full relative">
                                            <Image 
                                                src={src} 
                                                alt="Sfeerimpressie" 
                                                fill 
                                                priority={index === 0} 
                                                unoptimized 
                                                className="object-cover object-center" 
                                            />
                                        </div>
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
