'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface HeroCarouselProps {
    slideUrls: string[];
}

export function HeroCarousel({ slideUrls }: HeroCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStartX, setTouchStartX] = useState<number | null>(null);
    const [touchEndX, setTouchEndX] = useState<number | null>(null);

    useEffect(() => {
        if (slideUrls.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % slideUrls.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [slideUrls.length, currentIndex]);

    if (slideUrls.length === 0) return null;

    const handleTouchStart = (e: React.TouchEvent) => {
        if (slideUrls.length <= 1) return;
        setTouchStartX(e.targetTouches[0].clientX);
        setTouchEndX(null);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (slideUrls.length <= 1) return;
        setTouchEndX(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (slideUrls.length <= 1 || touchStartX === null || touchEndX === null) return;

        const diffX = touchStartX - touchEndX;
        const minSwipeDistance = 50; // minimum swipe distance in pixels

        if (Math.abs(diffX) > minSwipeDistance) {
            if (diffX > 0) {
                // Swiped left -> Next slide
                setCurrentIndex((prev) => (prev + 1) % slideUrls.length);
            } else {
                // Swiped right -> Previous slide
                setCurrentIndex((prev) => (prev - 1 + slideUrls.length) % slideUrls.length);
            }
        }

        setTouchStartX(null);
        setTouchEndX(null);
    };

    return (
        <div 
            className="w-full h-full relative group bg-(--bg-main) overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Sliding container wrapper */}
            <div 
                className="w-full h-full flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translate3d(-${currentIndex * 100}%, 0, 0)` }}
            >
                {slideUrls.map((src, index) => {
                    return (
                        <div
                            key={index}
                            className="w-full h-full shrink-0 relative"
                        >
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
                    );
                })}
            </div>
        </div>
    );
}