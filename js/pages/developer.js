/**
 * developer.js — Project grid filter
 *
 * HOW IT WORKS:
 *   - Each .project-card has data-tags="tag1,tag2,tag3"
 *   - Each .filter-btn has data-filter="tag" (or "all")
 *   - Clicking a filter hides cards that don't include that tag
 *   - The count label updates live
 *
 * HOW TO ADD A NEW FILTER BUTTON:
 *   Add a <button class="filter-btn" data-filter="your-tag"> in the HTML filter bar.
 *   Then add data-tags="...,your-tag,..." to the relevant project cards.
 */

(function () {
  'use strict';

  function init() {
    const filterBtns  = document.querySelectorAll('.filter-btn');
    const cards       = document.querySelectorAll('.project-card');
    const emptyState  = document.querySelector('.projects-empty');
    const countLabel  = document.querySelector('.projects-count');

    if (!filterBtns.length) return;

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter');

        // Update active button
        filterBtns.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');

        // Filter cards
        let visible = 0;
        cards.forEach(card => {
          const tags = (card.getAttribute('data-tags') || '').split(',').map(t => t.trim());
          const show = filter === 'all' || tags.includes(filter);
          card.classList.toggle('is-hidden', !show);
          if (show) visible++;
        });

        // Empty state
        if (emptyState) {
          emptyState.classList.toggle('is-visible', visible === 0);
        }

        // Count label
        if (countLabel) {
          countLabel.textContent = `${visible} project${visible !== 1 ? 's' : ''}`;
        }
      });
    });

    // Set initial count
    if (countLabel) {
      countLabel.textContent = `${cards.length} project${cards.length !== 1 ? 's' : ''}`;
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
