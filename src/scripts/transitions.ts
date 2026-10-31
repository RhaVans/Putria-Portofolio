// Direction-aware routing and accessibility focus management (§6, §9)

const ROUTE_ORDER: Record<string, number> = {
  '/': 0,
  '/about': 1,
  '/work': 2,
  '/contact': 3
};

function getRouteIndex(pathname: string): number {
  const clean = pathname.replace(/\/$/, '') || '/';
  if (clean.startsWith('/work/')) return 2.5; // work details are deeper than /work
  return ROUTE_ORDER[clean] ?? 0;
}

export function initTransitions() {
  document.addEventListener('astro:before-preparation', (event: any) => {
    const fromIndex = getRouteIndex(window.location.pathname);
    const toIndex = getRouteIndex(new URL(event.to).pathname);

    if (toIndex > fromIndex) {
      document.documentElement.dataset.navDir = 'forward';
    } else if (toIndex < fromIndex) {
      document.documentElement.dataset.navDir = 'backward';
    } else {
      delete document.documentElement.dataset.navDir;
    }
  });

  document.addEventListener('astro:after-swap', () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });

    // Focus management for accessibility (§9)
    const mainHeading = document.querySelector('h1') || document.querySelector('main');
    if (mainHeading instanceof HTMLElement) {
      mainHeading.setAttribute('tabindex', '-1');
      mainHeading.focus({ preventScroll: true });
    }

    // Announce route in aria-live region
    const announcer = document.getElementById('route-announcer');
    if (announcer) {
      announcer.textContent = `Navigated to ${document.title}`;
    }
  });
}
