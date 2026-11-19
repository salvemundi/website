'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Box, Flex } from '@mantine/core';

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
        <Box
            pos="relative"
            w="100%"
            h="100%"
            bg="var(--mantine-color-default)"
            style={{ overflow: 'hidden' }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Sliding container wrapper */}
            <Flex
                w="100%"
                h="100%"
                style={{
                    transition: 'transform 500ms ease-in-out',
                    transform: `translate3d(-${currentIndex * 100}%, 0, 0)`,
                }}
            >
                {slideUrls.map((src, index) => {
                    return (
                        <Box
                            key={index}
                            pos="relative"
                            w="100%"
                            h="100%"
                            style={{ flexShrink: 0 }}
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
                        </Box>
                    );
                })}
            </Flex>
        </Box>
    );
}