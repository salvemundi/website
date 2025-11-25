import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const observerOptions: IntersectionObserverInit = {
  threshold: 0.16,
  rootMargin: "0px 0px -8% 0px",
};

const ScrollAnimator = () => {
  const location = useLocation();

  useEffect(() => {
    const observedElements = new Set<Element>();

    const handleEntries: IntersectionObserverCallback = (entries, observer) => {
      entries.forEach((entry) => {
        const target = entry.target as HTMLElement;
        if (entry.isIntersecting) {
          target.classList.add("is-visible");
          if (target.dataset.animateRepeat !== "true") {
            observer.unobserve(target);
            observedElements.delete(target);
          }
        } else if (target.dataset.animateRepeat === "true") {
          target.classList.remove("is-visible");
        }
      });
    };

    const observer = new IntersectionObserver(handleEntries, observerOptions);

    const prepareElement = (el: HTMLElement) => {
      if (observedElements.has(el)) return;
      observedElements.add(el);

      const delay = el.dataset.animateDelay;
      if (delay && !Number.isNaN(Number(delay))) {
        el.style.setProperty("--animate-delay", `${Number(delay)}ms`);
      } else {
        el.style.removeProperty("--animate-delay");
      }

      if (!el.dataset.animate) {
        el.dataset.animate = "fade-up";
      }

      observer.observe(el);
    };

    const scanForAnimatableElements = (root: ParentNode | Document = document) => {
      const elements = Array.from(root.querySelectorAll<HTMLElement>("[data-animate]"));
      elements.forEach(prepareElement);
    };

    scanForAnimatableElements();

    const mutationObserver = new MutationObserver((mutations) => {
      let needsScan = false;

      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.dataset.animate) {
            prepareElement(node);
            return;
          }

          if (node.querySelector?.("[data-animate]")) {
            needsScan = true;
          }
        });
      });

      if (needsScan) {
        scanForAnimatableElements();
      }
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      observedElements.clear();
    };
  }, [location.pathname]);

  return null;
};

export default ScrollAnimator;
