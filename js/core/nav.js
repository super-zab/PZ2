/**
 * nav.js — Navigation behaviour
 * - Adds .is-scrolled to <nav> on scroll
 * - Marks the active link based on current path
 */

(function () {
  'use strict';

  const nav = document.querySelector('.site-nav');
  const links = document.querySelectorAll('.nav-link');

  // Scroll: add frosted glass background once user scrolls past 10px
  function handleScroll() {
    if (window.scrollY > 10) {
      nav.classList.add('is-scrolled');
    } else {
      nav.classList.remove('is-scrolled');
    }
  }

  // Active link: compare href to current pathname
  function setActiveLink() {
    const path = window.location.pathname;

    links.forEach(link => {
      const href = link.getAttribute('href');
      // Root-level match or starts-with for sub-sections
      const isActive =
        (href === '/' && (path === '/' || path === '/index.html')) ||
        (href !== '/' && path.startsWith(href));

      link.classList.toggle('is-active', isActive);
      link.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  document.addEventListener('DOMContentLoaded', () => {
    handleScroll();
    setActiveLink();
  });
})();
