// ============================================================
// MAP INIT
// ============================================================
const map = L.map('map', {
    zoomControl: false,
    fadeAnimation: true,
    zoomAnimation: true,
    markerZoomAnimation: true
}).setView([20, 0], 2);

L.tileLayer.provider('CartoDB.DarkMatter').addTo(map);
L.control.zoom({ position: 'bottomright' }).addTo(map);

// ============================================================
// CONSTANTS
// ============================================================
const CONTINENT_COLORS = {
    'Europe':        '#FF6B6B',
    'Asia':          '#4ECDC4',
    'Africa':        '#FFA07A',
    'North America': '#9B59B6',
    'South America': '#2ECC71',
    'Oceania':       '#3498DB',
    'USA States':    '#E74C3C'
};

// ============================================================
// HELPERS
// ============================================================

/** Lighten a hex color by mixing it toward white. */
function lightenHex(hex, t = 0.3) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const lr = Math.round(r + (255 - r) * t);
    const lg = Math.round(g + (255 - g) * t);
    const lb = Math.round(b + (255 - b) * t);
    return `#${lr.toString(16).padStart(2,'0')}${lg.toString(16).padStart(2,'0')}${lb.toString(16).padStart(2,'0')}`;
}

/** hex + alpha → rgba string */
function hexAlpha(hex, a) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a})`;
}

/** Animate a numeric counter from 0 to target. */
function animateCount(el, target, ms = 1200) {
    const start = performance.now();
    (function step(now) {
        const p = Math.min((now - start) / ms, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * ease);
        if (p < 1) requestAnimationFrame(step);
    })(start);
}

// ============================================================
// SIDE PANEL
// ============================================================
const panel      = document.getElementById('side-panel');
const panelInner = document.getElementById('panel-inner');
const backdrop   = document.getElementById('panel-backdrop');

function openPanel(country) {
    const continent = country.continent || 'Europe';
    const contColor = CONTINENT_COLORS[continent] || '#6366f1';
    const allPhotos = country.visits.flatMap(v => v.photos);

    panelInner.innerHTML = buildPanelHTML(country, allPhotos, country.color || '#6366f1', contColor, continent);

    // Stagger animation
    panelInner.querySelectorAll('.panel-animate').forEach((el, i) => {
        el.style.animationDelay = `${i * 0.04}s`;
    });

    // Photo click handlers
    panelInner.querySelectorAll('.thumb').forEach((thumb) => {
        thumb.addEventListener('click', () => {
            const idx = parseInt(thumb.dataset.idx, 10);
            openLightbox(allPhotos, idx);
        });
    });

    panel.classList.add('open');
    backdrop.classList.add('active');
}

function closePanel() {
    panel.classList.remove('open');
    backdrop.classList.remove('active');
}

document.getElementById('panel-close').addEventListener('click', closePanel);
backdrop.addEventListener('click', closePanel);

// Close on Escape
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        if (lightbox.classList.contains('open')) closeLightbox();
        else closePanel();
    }
});

function buildPanelHTML(country, allPhotos, color, contColor, continent) {
    const visitCount = country.visits.length;
    const photoCount = allPhotos.length;

    const photosHTML = photoCount > 0
        ? buildPhotoGrid(allPhotos)
        : `<div class="no-photos">
               <div class="no-photos-icon">&#128247;</div>
               <div>Photos bient&#244;t disponibles</div>
           </div>`;

    const visitsHTML = country.visits.map(v => `
        <div class="visit-card panel-animate">
            <div class="visit-year">${v.year && v.year !== 2023 ? v.year : 'Récent'}</div>
            <div class="visit-comment">${v.comment}</div>
        </div>
    `).join('');

    return `
        <div class="panel-header panel-animate">
            <div class="panel-header-glow" style="background:${contColor}"></div>
            <div class="panel-badge" style="
                color: ${contColor};
                border-color: ${hexAlpha(contColor, 0.35)};
                background: ${hexAlpha(contColor, 0.10)};
            ">${continent}</div>
            <h1 class="panel-title">${country.name}</h1>
            <div class="panel-meta">
                <span class="panel-meta-item">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                    </svg>
                    ${visitCount}&nbsp;visite${visitCount > 1 ? 's' : ''}
                </span>
                ${photoCount > 0 ? `
                <span class="panel-meta-item">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    ${photoCount}&nbsp;photo${photoCount > 1 ? 's' : ''}
                </span>` : ''}
            </div>
        </div>

        <div class="panel-divider"></div>

        ${photoCount > 0 ? `
        <div class="panel-section panel-animate">
            <div class="panel-section-label">Photos</div>
            ${photosHTML}
        </div>
        <div class="panel-divider"></div>` : `
        <div class="panel-section panel-animate">${photosHTML}</div>
        <div class="panel-divider"></div>`}

        <div class="panel-section panel-animate">
            <div class="panel-section-label">Visites</div>
            ${visitsHTML}
        </div>
    `;
}

function buildPhotoGrid(photos) {
    const max = 7; // 1 big + 6 thumbs
    const shown = photos.slice(0, max);
    const extra = photos.length - max;

    return `<div class="photo-grid">
        ${shown.map((p, i) => {
            const isLast = i === shown.length - 1 && extra > 0;
            return `<div class="thumb" data-idx="${i}">
                <img
                    src="data/photos/${p}"
                    alt=""
                    loading="lazy"
                    onerror="this.closest('.thumb').style.display='none'"
                >
                <div class="thumb-overlay"></div>
                ${isLast ? `<div class="thumb-more">+${extra + 1}</div>` : ''}
            </div>`;
        }).join('')}
    </div>`;
}

// ============================================================
// LIGHTBOX
// ============================================================
const lightbox  = document.getElementById('lightbox');
const lbImg     = document.getElementById('lb-img');
const lbCounter = document.getElementById('lb-counter');

let lbPhotos = [];
let lbIndex  = 0;

function openLightbox(photos, index) {
    lbPhotos = photos;
    lbIndex  = index;
    renderLightbox();
    lightbox.classList.add('open');
}

function closeLightbox() {
    lightbox.classList.remove('open');
}

function renderLightbox() {
    lbImg.style.opacity = '0';
    const src = `data/photos/${lbPhotos[lbIndex]}`;
    const tmp = new Image();
    tmp.onload = () => {
        lbImg.src = src;
        lbImg.style.opacity = '1';
    };
    tmp.onerror = () => {
        lbImg.src = '';
        lbImg.style.opacity = '1';
    };
    tmp.src = src;
    lbCounter.textContent = `${lbIndex + 1} / ${lbPhotos.length}`;
}

function lbPrev() {
    lbIndex = (lbIndex - 1 + lbPhotos.length) % lbPhotos.length;
    renderLightbox();
}
function lbNext() {
    lbIndex = (lbIndex + 1) % lbPhotos.length;
    renderLightbox();
}

document.getElementById('lightbox-overlay').addEventListener('click', closeLightbox);
document.getElementById('lb-close').addEventListener('click', closeLightbox);
document.getElementById('lb-prev').addEventListener('click', lbPrev);
document.getElementById('lb-next').addEventListener('click', lbNext);

document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'ArrowLeft')  lbPrev();
    if (e.key === 'ArrowRight') lbNext();
});

// ============================================================
// LOAD DATA & RENDER MAP
// ============================================================

/** Shared hover/click behaviour — applied to both country and state layers. */
function bindLayerEvents(layer, country) {
    const base  = country.color;
    const hover = lightenHex(base, 0.28);

    layer.on('mouseover', () => {
        layer.setStyle({ fillColor: hover, fillOpacity: 1, weight: 1, color: 'rgba(255,255,255,0.5)' });
        layer.bringToFront();
    });
    layer.on('mouseout', () => {
        layer.setStyle({ fillColor: base, fillOpacity: 0.82, weight: 0.5, color: 'rgba(255,255,255,0.14)' });
    });
    layer.on('click', () => openPanel(country));
}

/** Add photo markers for a country entry. */
function addMarkers(country) {
    country.visits.forEach(visit => {
        const [lat, lng] = visit.coordinates || [0, 0];
        if (!visit.photos?.length || (lat === 0 && lng === 0)) return;
        L.marker([lat, lng], { icon: createMarkerIcon(country.color) })
            .addTo(map)
            .on('click', () => openPanel(country));
    });
}

Promise.all([
    fetch('data/countries.json').then(r => r.json()),
    fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json').then(r => r.json()),
    // US states GeoJSON — features have id: "CA", "NY", etc.
    fetch('https://raw.githubusercontent.com/python-visualization/folium/master/tests/us-states.json').then(r => r.json())
]).then(([userData, geoData, usStatesData]) => {

    // Build lookup maps
    const isoCountry  = {};
    const nameCountry = {};

    // Also track which ISO codes are US states (US-CA, US-NV …)
    const stateCountry = {}; // "CA" -> country

    userData.visited.forEach(country => {
        isoCountry[country.iso]                  = country;
        nameCountry[country.name.toLowerCase()]  = country;
        if (country.iso && country.iso.startsWith('US-')) {
            stateCountry[country.iso.slice(3)] = country; // "US-CA" → "CA"
        }
    });

    // --- World countries layer ---
    // USA polygon is intentionally left uncolored here; states layer covers it.
    L.geoJSON(geoData, {
        style: feature => {
            const iso  = feature.id || feature.properties.iso_a3;
            const name = (feature.properties.name || '').toLowerCase();
            // Skip USA — handled by states layer below
            if (iso === 'USA') return { fillColor: '#111128', fillOpacity: 0.35, color: 'rgba(255,255,255,0.04)', weight: 0.5 };
            const country = isoCountry[iso] || nameCountry[name];
            const color   = country?.color;
            return {
                fillColor:   color || '#111128',
                fillOpacity: color ? 0.82 : 0.35,
                color:       color ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.04)',
                weight:      0.5,
                opacity:     1
            };
        },
        onEachFeature: (feature, layer) => {
            const iso     = feature.id || feature.properties.iso_a3;
            if (iso === 'USA') return;
            const name    = feature.properties.name;
            const country = isoCountry[iso] || nameCountry[(name || '').toLowerCase()];
            if (!country) return;
            bindLayerEvents(layer, country);
            addMarkers(country);
        }
    }).addTo(map);

    // --- US states layer ---
    L.geoJSON(usStatesData, {
        style: feature => {
            // feature.id is the 2-letter abbreviation, e.g. "CA"
            const abbr    = feature.id || feature.properties.id;
            const country = stateCountry[abbr];
            const color   = country?.color;
            return {
                fillColor:   color || '#111128',
                fillOpacity: color ? 0.82 : 0.30,
                color:       color ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.05)',
                weight:      color ? 0.8 : 0.4,
                opacity:     1
            };
        },
        onEachFeature: (feature, layer) => {
            const abbr    = feature.id || feature.properties.id;
            const country = stateCountry[abbr];
            if (!country) return;
            bindLayerEvents(layer, country);
            addMarkers(country);
        }
    }).addTo(map);

    // Stats counters
    const totalPhotos = userData.visited.reduce(
        (sum, c) => sum + c.visits.flatMap(v => v.photos).length, 0
    );
    const continentSet = new Set(
        userData.visited.map(c => c.continent).filter(Boolean)
    );

    setTimeout(() => {
        animateCount(document.getElementById('stat-countries'),  userData.visited.length, 1000);
        animateCount(document.getElementById('stat-photos'),     totalPhotos, 1400);
        animateCount(document.getElementById('stat-continents'), continentSet.size, 700);
    }, 1100);

}).catch(err => {
    console.error('Erreur de chargement des données :', err);
});

// ============================================================
// MARKER ICON
// ============================================================
function createMarkerIcon(color) {
    return L.divIcon({
        html: `<div class="marker-wrap">
            <div class="marker-dot"  style="background:${color}"></div>
            <div class="marker-ring" style="border-color:${color}"></div>
        </div>`,
        className: 'custom-marker',
        iconSize:   [12, 12],
        iconAnchor: [6, 6]
    });
}
