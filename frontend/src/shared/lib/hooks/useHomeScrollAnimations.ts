import { type RefObject, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let scrollTriggerRegistered = false;

const registerScrollTrigger = () => {
    if (scrollTriggerRegistered) return;
    gsap.registerPlugin(ScrollTrigger);
    scrollTriggerRegistered = true;
};

const prefersReducedMotion = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const useHomeScrollAnimations = (scopeRef: RefObject<HTMLElement | null>) => {
    useLayoutEffect(() => {
        if (typeof window === "undefined" || prefersReducedMotion()) {
            return;
        }

        registerScrollTrigger();

        const ctx = gsap.context(() => {
            const baseDistance = window.innerWidth < 768 ? 26 : 48;

            const parallaxItems = gsap.utils.toArray<HTMLElement>("[data-scroll-speed]");
            parallaxItems.forEach((item) => {
                const speed = Number(item.dataset.scrollSpeed ?? 1);
                const direction = item.dataset.scrollDirection === "down" ? 1 : -1;
                const travel = baseDistance * speed * direction;

                gsap.fromTo(
                    item,
                    { y: 0 },
                    {
                        y: travel,
                        ease: "none",
                        scrollTrigger: {
                            trigger: item,
                            start: "top bottom",
                            end: "bottom top",
                            scrub: true,
                        },
                    }
                );
            });

            const fadeItems = gsap.utils.toArray<HTMLElement>("[data-scroll-fade]");
            fadeItems.forEach((item) => {
                const delayMs = Number(item.dataset.scrollDelay ?? 0);

                gsap.fromTo(
                    item,
                    { autoAlpha: 0, y: 18, scale: 0.985 },
                    {
                        autoAlpha: 1,
                        y: 0,
                        scale: 1,
                        duration: 0.9,
                        ease: "power2.out",
                        delay: delayMs / 1000,
                        scrollTrigger: {
                            trigger: item,
                            // Trigger earlier so items reveal sooner on scroll
                            start: "top 60%",
                        },
                    }
                );
            });
        }, scopeRef);

        return () => ctx.revert();
    }, [scopeRef]);
};

export default useHomeScrollAnimations;
