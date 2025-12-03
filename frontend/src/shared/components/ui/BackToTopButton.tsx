'use client';

import { useState, useEffect, Fragment } from "react";
import { Transition } from "@headlessui/react";

export default function BackToTopButton() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener("scroll", toggleVisibility);
        return () => window.removeEventListener("scroll", toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    return (
        <Transition
            as={Fragment}
            show={isVisible}
            enter="transition-opacity duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
        >
            <button
                onClick={scrollToTop}
                className="fixed bottom-10 right-10 z-50 p-5 bg-gradient-to-r from-oranje to-paars text-white rounded-full shadow-lg shadow-oranje/30 transition-transform hover:-translate-y-0.5 hover:shadow-xl"
            >
                ↑ Top
            </button>
        </Transition>
    );
}
