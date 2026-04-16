'use client';

import React from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';

interface HeroCarouselProps {
    slideUrls: string[];
}

export function HeroCarousel({ slideUrls }: HeroCarouselProps) {
    if (!slideUrls || slideUrls.length === 0) return null;

    return (
        <div className="w-full h-full relative group bg-[var(--bg-main)]">

            {/* MOBILE VIEW: Static Image 
                Visible by default, hidden on screens 'sm' and larger.
                Rendered immediately by the server.
                - h-full is vervangen door aspect-[4/3] zodat de foto op mobiel 
                  beter in verhouding blijft en minder wordt afgesneden.
            */}
            <div className="block sm:hidden w-full aspect-[4/3] relative">
                <Image
                    src={slideUrls[0]}
                    alt="Salve Mundi"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover object-center"
                />
            </div>

            {/* DESKTOP VIEW: Swiper Carousel 
                Hidden by default, visible on screens 'sm' and larger.
                Rendered immediately by the server.
            */}
            <div className="hidden sm:block h-full w-full relative">
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
                                    alt={`Sfeerimpressie ${index + 1}`}
                                    fill
                                    priority={index === 0} // Only preload the FIRST slide
                                    sizes="100vw"
                                    className="object-cover object-center"
                                />
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>

        </div>
    );
}