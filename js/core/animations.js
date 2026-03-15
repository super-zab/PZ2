/**
 * animations.js — Scroll-triggered entrance animations
 * Observes all .will-animate elements and adds .is-visible when they enter the viewport.
 */

(function () {
  'use strict';

  const SELECTOR = '.will-animate';
  const ACTIVE_CLASS = 'is-visible';

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add(ACTIVE_CLASS);
          // Unobserve after triggering — animation plays once
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,      // 12% visible before triggering
      rootMargin: '0px 0px -40px 0px'  // slight offset from bottom
    }
  );

  function init() {
    document.querySelectorAll(SELECTOR).forEach(el => observer.observe(el));
  }

  document.addEventListener('DOMContentLoaded', init);
})();
