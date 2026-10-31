// Motion polish and interactive card specular highlights (§6)

export function initMotion() {
  const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (isFinePointer && !prefersReduced) {
    initCardTilt();
  }

  initScrollReveals(prefersReduced);
}

function initCardTilt() {
  const cards = document.querySelectorAll<HTMLElement>('[data-card-tilt]');

  cards.forEach((card) => {
    if (card.dataset.tiltBound === 'true') return;
    card.dataset.tiltBound = 'true';

    let bounds: DOMRect | null = null;
    let isHovered = false;

    card.addEventListener('mouseenter', () => {
      bounds = card.getBoundingClientRect();
      isHovered = true;
    });

    card.addEventListener('mouseleave', () => {
      isHovered = false;
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
    });

    card.addEventListener('mousemove', (e) => {
      if (!isHovered || !bounds) return;

      requestAnimationFrame(() => {
        const mouseX = e.clientX - bounds!.left;
        const mouseY = e.clientY - bounds!.top;
        const xPct = (mouseX / bounds!.width) - 0.5;
        const yPct = (mouseY / bounds!.height) - 0.5;

        // Strict limit: tilt <= 4deg (§6)
        const tiltX = (yPct * -7).toFixed(2);
        const tiltY = (xPct * 7).toFixed(2);

        card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-3px)`;
      });
    });
  });
}

function initScrollReveals(prefersReduced: boolean) {
  if (prefersReduced) return;

  const revealGroups = document.querySelectorAll<HTMLElement>('.capabilities-grid, .process-flow, .statbar-container');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  revealGroups.forEach((el) => {
    if (el.dataset.revealBound === 'true') return;
    el.dataset.revealBound = 'true';
    el.classList.add('reveal-group');
    observer.observe(el);
  });
}
