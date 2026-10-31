// Motion v2 (§8): Apple-grade tactile interactions, no generic card tilts

export function initMotion() {
  const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (isFinePointer && !prefersReduced) {
    initGlassSpecular();
  }

  initHeroSessionState();
}

function initHeroSessionState() {
  if (sessionStorage.getItem('putria_hero_entered')) {
    document.documentElement.dataset.heroEntered = 'true';
  } else {
    sessionStorage.setItem('putria_hero_entered', 'true');
  }
}

function initGlassSpecular() {
  const glassControls = document.querySelectorAll<HTMLElement>('.desktop-nav, .mobile-tabbar, .btn-glass');

  glassControls.forEach((el) => {
    if (el.dataset.specularBound === 'true') return;
    el.dataset.specularBound = 'true';

    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      el.style.setProperty('--cursor-x', `${x}px`);
      el.style.setProperty('--cursor-y', `${y}px`);
    });
  });
}
