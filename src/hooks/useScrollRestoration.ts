import { useEffect, useLayoutEffect } from "react";
import { useNavigationType } from "react-router-dom";

/**
 * Saves scroll position to sessionStorage on scroll,
 * and restores it when the user navigates back (POP).
 *
 * @param key - unique key per page/route
 */
export function useScrollRestoration(key: string) {
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    if (navigationType === "POP") {
      const saved = sessionStorage.getItem(`scroll:${key}`);
      if (saved) {
        const y = parseInt(saved, 10);
        // rAF ensures the DOM is fully committed before scrolling
        requestAnimationFrame(() => window.scrollTo(0, y));
      }
    } else {
      sessionStorage.removeItem(`scroll:${key}`);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const save = () =>
      sessionStorage.setItem(`scroll:${key}`, String(window.scrollY));
    window.addEventListener("scroll", save, { passive: true });
    return () => window.removeEventListener("scroll", save);
  }, [key]);
}
