/**
 * transitions.js — Page transition effect
 * Adds .page-enter to <main> on load.
 * On internal link clicks, plays exit animation then navigates.
 */

(function () {
  'use strict';

  function init() {
    const main = document.querySelector('main');
    if (!main) return;

    // Enter animation on every page load
    main.classList.add('page-enter');

    // Intercept internal links for exit animation
    document.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      const isInternal =
        href &&
        !href.startsWith('http') &&
        !href.startsWith('mailto') &&
        !href.startsWith('#') &&
        !link.hasAttribute('download');

      if (!isInternal) return;

      link.addEventListener('click', (e) => {
        e.preventDefault();
        main.classList.remove('page-enter');
        main.classList.add('page-exit');

        // Navigate after animation duration
        setTimeout(() => {
          window.location.href = href;
        }, 300); // matches --transition-base
      });
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
