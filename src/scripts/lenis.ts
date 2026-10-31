import Lenis from 'lenis';

let lenisInstance: Lenis | null = null;
let rafId: number | null = null;

function isPointerFine(): boolean {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function initLenis() {
  // Mobile / touch devices or reduced motion -> strictly native scrolling (§6)
  if (!isPointerFine() || prefersReducedMotion()) {
    return;
  }

  destroyLenis();

  lenisInstance = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    smoothWheel: true,
    touchMultiplier: 1.5
  });

  function raf(time: number) {
    if (lenisInstance) {
      lenisInstance.raf(time);
      rafId = requestAnimationFrame(raf);
    }
  }

  rafId = requestAnimationFrame(raf);

  // Hook into Astro client router lifecycle
  document.addEventListener('astro:before-swap', destroyLenis, { once: true });
}

export function destroyLenis() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (lenisInstance) {
    lenisInstance.destroy();
    lenisInstance = null;
  }
}
