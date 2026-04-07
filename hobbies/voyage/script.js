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

/** Lighten a hex color by mixing toward white. */
function lightenHex(hex, t = 0.3) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `#${[r, g, b].map(c => Math.round(c + (255 - c) * t).toString(16).padStart(2, '0')).join('')}`;
}

/** hex + alpha → rgba string */
function hexAlpha(hex, a) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a})`;
}

/** Animate a counter from 0 to target. */
function animateCount(el, target, ms = 1200) {
    const start = performance.now();
    (function step(now) {
        const p    = Math.min((now - start) / ms, 1);
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

    panelInner.querySelectorAll('.panel-animate').forEach((el, i) => {
        el.style.animationDelay = `${i * 0.04}s`;
    });

    panelInner.querySelectorAll('.thumb').forEach(thumb => {
        thumb.addEventListener('click', () => {
            openLightbox(allPhotos, parseInt(thumb.dataset.idx, 10));
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

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        if (document.getElementById('lightbox').classList.contains('open')) closeLightbox();
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
    const max   = 7;
    const shown = photos.slice(0, max);
    const extra = photos.length - max;

    return `<div class="photo-grid">
        ${shown.map((p, i) => {
            const isLast = i === shown.length - 1 && extra > 0;
            return `<div class="thumb" data-idx="${i}">
                <img src="data/photos/${p}" alt="" loading="lazy"
                     onerror="this.closest('.thumb').style.display='none'">
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
let lbPhotos = [], lbIndex = 0;

function openLightbox(photos, index) {
    lbPhotos = photos;
    lbIndex  = index;
    renderLightbox();
    lightbox.classList.add('open');
}

function closeLightbox() { lightbox.classList.remove('open'); }

function renderLightbox() {
    lbImg.style.opacity = '0';
    const src = `data/photos/${lbPhotos[lbIndex]}`;
    const tmp = new Image();
    tmp.onload  = () => { lbImg.src = src; lbImg.style.opacity = '1'; };
    tmp.onerror = () => { lbImg.src = ''; lbImg.style.opacity = '1'; };
    tmp.src = src;
    lbCounter.textContent = `${lbIndex + 1} / ${lbPhotos.length}`;
}

function lbPrev() { lbIndex = (lbIndex - 1 + lbPhotos.length) % lbPhotos.length; renderLightbox(); }
function lbNext() { lbIndex = (lbIndex + 1) % lbPhotos.length; renderLightbox(); }

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
// GLOBE INIT
// ============================================================
const container = document.getElementById('globe');

const globeEl = Globe()
    .globeImageUrl('//unpkg.com/three-globe/example/img/earth-dark.jpg')
    .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
    .atmosphereColor('rgba(60, 120, 255, 0.85)')
    .atmosphereAltitude(0.14)
    .onGlobeReady(() => {
        // Hide loading indicator once the globe textures are rendered
        const loading = document.getElementById('globe-loading');
        if (loading) loading.classList.add('hidden');
    })
    (container);

// Camera zoom limits (globe radius = 100 in Globe.gl units)
globeEl.controls().minDistance = 120;  // close zoom — can read country borders
globeEl.controls().maxDistance = 520;  // max zoom out — globe still fills view

// Slow auto-rotation — stops permanently on first user interaction
globeEl.controls().autoRotate      = true;
globeEl.controls().autoRotateSpeed = 0.4;
globeEl.controls().addEventListener('start', function stopRotate() {
    globeEl.controls().autoRotate = false;
    globeEl.controls().removeEventListener('start', stopRotate);

    // Fade the drag hint
    const hint = document.getElementById('globe-hint');
    if (hint) hint.classList.add('hidden');
}, { once: true });

// Start pointing at Europe / Africa
globeEl.pointOfView({ lat: 20, lng: 15, altitude: 2.4 }, 0);

// Keep canvas sized to the container on window resize
window.addEventListener('resize', () => {
    globeEl
        .width(container.offsetWidth)
        .height(container.offsetHeight);
});

// ============================================================
// DATA LOOKUPS  (populated after fetch)
// ============================================================
let isoCountry   = {};   // { "FRA": countryObj, ... }
let nameCountry  = {};   // { "france": countryObj, ... }
let stateCountry = {};   // { "CA": countryObj, ... }  for US states

/** Resolve a GeoJSON feature to a country object, or null. */
function getCountry(feat) {
    if (feat._isState) {
        const abbr = feat.id || feat.properties?.id;
        return stateCountry[abbr] || null;
    }
    const iso  = feat.id || feat.properties?.iso_a3;
    const name = (feat.properties?.name || '').toLowerCase();
    return isoCountry[iso] || nameCountry[name] || null;
}

// ============================================================
// POLYGON COLOUR HELPERS
// ============================================================
const UNVISITED_CAP  = 'rgba(15, 15, 38, 0.50)';
const UNVISITED_SIDE = 'rgba(0, 0, 0, 0.20)';
const UNVISITED_STROKE = 'rgba(255,255,255,0.04)';

let hoveredFeat = null;

function capColor(feat) {
    const c = getCountry(feat);
    if (!c) return UNVISITED_CAP;
    return feat === hoveredFeat
        ? hexAlpha(lightenHex(c.color, 0.30), 0.96)
        : hexAlpha(c.color, 0.84);
}

function sideColor(feat) {
    const c = getCountry(feat);
    if (!c) return UNVISITED_SIDE;
    return hexAlpha(c.color, 0.35);
}

function strokeColor(feat) {
    const c = getCountry(feat);
    return c ? 'rgba(255,255,255,0.12)' : UNVISITED_STROKE;
}

function polyAltitude(feat) {
    const c = getCountry(feat);
    if (!c) return 0.001;
    return feat === hoveredFeat ? 0.025 : 0.006;
}

// ============================================================
// LOAD DATA & RENDER
// ============================================================
Promise.all([
    fetch('data/countries.json').then(r => r.json()),
    fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json').then(r => r.json()),
    fetch('https://raw.githubusercontent.com/python-visualization/folium/master/tests/us-states.json').then(r => r.json())
]).then(([userData, worldGeo, usStatesGeo]) => {

    // ── Build lookup tables ──────────────────────────────
    userData.visited.forEach(c => {
        isoCountry[c.iso]                 = c;
        nameCountry[c.name.toLowerCase()] = c;
        if (c.iso?.startsWith('US-')) {
            stateCountry[c.iso.slice(3)] = c;  // "US-CA" → "CA"
        }
    });

    // ── Combine GeoJSON features ─────────────────────────
    // Skip USA polygon from world layer — covered by US states below
    const worldFeatures = worldGeo.features.filter(f => f.id !== 'USA');

    // Tag state features so getCountry() knows which lookup to use
    const stateFeatures = usStatesGeo.features.map(f => ({ ...f, _isState: true }));

    const allFeatures = [...worldFeatures, ...stateFeatures];

    // ── Configure globe polygons ─────────────────────────
    globeEl
        .polygonsData(allFeatures)
        .polygonCapColor(capColor)
        .polygonSideColor(sideColor)
        .polygonStrokeColor(strokeColor)
        .polygonAltitude(polyAltitude)
        // Hover tooltip — shown only for visited countries
        .polygonLabel(feat => {
            const c = getCountry(feat);
            if (!c) return '';
            return `<span style="font-weight:600">${c.name}</span>`;
        })
        // Hover: re-evaluate colours & altitude with a new function reference
        // so Globe.gl detects the change and re-renders
        .onPolygonHover(feat => {
            hoveredFeat = feat || null;
            const isVisited = feat && getCountry(feat);
            globeEl
                .polygonCapColor(f => capColor(f))
                .polygonSideColor(f => sideColor(f))
                .polygonAltitude(f => polyAltitude(f));
            container.style.cursor = isVisited ? 'pointer' : 'grab';
        })
        // Click: open side panel for visited countries only
        .onPolygonClick(feat => {
            const c = getCountry(feat);
            if (c) openPanel(c);
        });

    // ── Photo location markers ───────────────────────────
    const markers = [];
    userData.visited.forEach(c => {
        c.visits.forEach(v => {
            const [lat, lng] = v.coordinates || [0, 0];
            if (!v.photos?.length || (lat === 0 && lng === 0)) return;
            markers.push({ lat, lng, color: c.color, country: c });
        });
    });

    if (markers.length > 0) {
        globeEl
            .pointsData(markers)
            .pointColor(d => d.color)
            .pointAltitude(0.02)
            .pointRadius(0.35)
            .pointResolution(6)
            .onPointClick(d => openPanel(d.country))
            .onPointHover(d => {
                container.style.cursor = d ? 'pointer' : 'grab';
            });
    }

    // ── Animate stats counters ───────────────────────────
    const totalPhotos  = userData.visited.reduce((s, c) => s + c.visits.flatMap(v => v.photos).length, 0);
    const continentSet = new Set(userData.visited.map(c => c.continent).filter(Boolean));

    setTimeout(() => {
        animateCount(document.getElementById('stat-countries'),  userData.visited.length,  1000);
        animateCount(document.getElementById('stat-photos'),     totalPhotos,              1400);
        animateCount(document.getElementById('stat-continents'), continentSet.size,         700);
    }, 1200);

}).catch(err => {
    console.error('Erreur de chargement des données :', err);
    const loading = document.getElementById('globe-loading');
    if (loading) {
        loading.querySelector('span').textContent = 'Erreur de chargement';
        loading.querySelector('.globe-loading-dot').style.background = '#e05c5c';
    }
});
