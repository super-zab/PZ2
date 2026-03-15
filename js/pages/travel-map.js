/**
 * travel-map.js — Interactive SVG world map
 *
 * HOW TO ADD A VISITED COUNTRY:
 *   Add the country's ISO 3166-1 alpha-2 code (lowercase) to VISITED_COUNTRIES.
 *   Make sure a corresponding page exists at /hobbies/voyage/countries/[code].html
 *
 * HOW TO ADD A COUNTRY PAGE:
 *   Copy /templates/_country-template.html → /hobbies/voyage/countries/[code].html
 */

(function () {
  'use strict';

  // ── CONFIGURATION ─────────────────────────────────────────────
  // Add ISO codes here as you travel. Example: 'jp', 'au', 'br'
  const VISITED_COUNTRIES = [
    'fr',   // France
    'es',   // Spain
    // Add more here
  ];

  const COUNTRY_PAGE_BASE = '/hobbies/voyage/countries/';
  const VISITED_CLASS     = 'map-country--visited';
  const HOVER_CLASS       = 'map-country--hover';
  // ──────────────────────────────────────────────────────────────

  function init() {
    const mapContainer = document.getElementById('travel-map');
    if (!mapContainer) return;

    // SVG paths have data-country="xx" attributes (set when SVG is embedded)
    const countries = mapContainer.querySelectorAll('[data-country]');

    countries.forEach(el => {
      const code = el.getAttribute('data-country');
      const isVisited = VISITED_COUNTRIES.includes(code);

      if (isVisited) {
        el.classList.add(VISITED_CLASS);
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
        el.setAttribute('aria-label', `View trip to ${code.toUpperCase()}`);

        el.addEventListener('click', () => navigateToCountry(code));
        el.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') navigateToCountry(code);
        });
      }

      el.addEventListener('mouseenter', () => el.classList.add(HOVER_CLASS));
      el.addEventListener('mouseleave', () => el.classList.remove(HOVER_CLASS));
    });
  }

  function navigateToCountry(code) {
    window.location.href = `${COUNTRY_PAGE_BASE}${code}.html`;
  }

  document.addEventListener('DOMContentLoaded', init);
})();
