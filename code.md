# code.md — Documentation Technique du Projet

> **Destinataires :** développeurs humains ou agents IA rejoignant le projet.
> **Objectif :** comprendre l'état du code, les choix architecturaux et la roadmap en moins de 10 minutes.

---

## 1. Description du Projet

**Paul Zabotto Website** est un portfolio personnel multi-pages, statique, conçu pour présenter trois univers distincts :

- **Développeur** : vitrine de projets techniques et de papers de recherche, avec filtrage dynamique par tags technologiques.
- **Hobbies** : présentation de trois centres d'intérêt (Voyage, Pêche, Sport), chacun avec sa propre sous-page. Le Voyage inclut une carte mondiale interactive SVG permettant de colorer les pays visités et de naviguer vers des pages dédiées par pays.
- **Contact** : formulaire de prise de contact + liens directs (email, GitHub, LinkedIn).

**Caractéristiques clés :**
- Aucune dépendance externe JS ni framework CSS — zéro étape de build, déploiement direct.
- Système d'**animations au scroll** opérationnel dès le départ sur toutes les pages.
- **Transitions de pages** fluides (fade in/out) entre chaque navigation interne.
- Navigation fixe avec **effet frosted glass** au scroll.
- Architecture **extensible** : ajouter un projet = copier un template + remplir des champs. Idem pour les pays visités.
- **Design tokens** centralisés : un seul fichier à modifier pour changer tout le thème visuel.

---

## 2. Stack Technologique

| Catégorie | Technologie | Détail |
|---|---|---|
| **HTML** | HTML5 sémantique | `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>` |
| **CSS** | CSS3 natif | Custom Properties, Grid, Flexbox, `clamp()`, `backdrop-filter`, `IntersectionObserver`-driven classes |
| **JavaScript** | Vanilla JS ES5+ | IIFEs (`(function(){})()`) avec `'use strict'`, `IntersectionObserver` API, `DOMContentLoaded` |
| **Fonts** | Google Fonts | `Inter` (corps de texte) + `JetBrains Mono` (labels, tags, mono) — chargées via `<link>` avec `display=swap` |
| **Déploiement** | Static hosting | Compatible GitHub Pages, Netlify, tout hébergeur de fichiers statiques |
| **Versionning** | Git (non initialisé) | Pas encore de repo git sur ce répertoire |
| **Dev tooling** | Aucun | Pas de bundler, pas de transpileur, pas de gestionnaire de paquets |

> ⚠️ **Note :** Les paths de navigation utilisent des chemins relatifs (`../css/main.css`). Tester avec un serveur local (ex : **VS Code Live Server**) — l'ouverture directe via `file://` ne fonctionne pas pour les assets référencés en absolu.

---

## 3. Architecture et Arborescence

```
Paul Zabotto Website/
│
├── index.html                          # Homepage : hero + 3 section-cards de navigation
│
├── code.md                             # ← CE FICHIER — documentation technique du projet
│
├── developer/
│   ├── index.html                      # Grille de projets avec filtre par tags
│   └── projects/                       # (vide) — un .html par projet à créer
│
├── hobbies/
│   ├── index.html                      # 3 hobby-cards : Travel, Pêche, Sport
│   ├── voyage/
│   │   ├── index.html                  # (à créer) — carte SVG mondiale interactive
│   │   └── countries/                  # (vide) — un .html par pays visité
│   ├── peche/
│   │   └── index.html                  # (à créer) — sous-page Pêche
│   └── sport/
│       └── index.html                  # (à créer) — sous-page Sport
│
├── contact/
│   └── index.html                      # Layout 2 colonnes : liens directs + formulaire
│
├── assets/
│   ├── pdfs/                           # Papers de recherche téléchargeables (vide)
│   ├── images/
│   │   ├── projects/                   # Visuels des projets (vide)
│   │   ├── hobbies/                    # Photos pour hobby-cards (vide)
│   │   └── profile/                    # Photo de profil (vide)
│   └── fonts/                          # Fonts locales optionnelles (vide)
│
├── css/
│   ├── main.css                        # Point d'entrée unique — orchestre tous les @import
│   ├── base/
│   │   ├── variables.css               # ★ DESIGN TOKENS — couleurs, espacements, typo, z-index
│   │   ├── reset.css                   # Reset moderne opinionné + focus ring accessible
│   │   └── typography.css              # Classes utilitaires de typographie (.text-sm, .text-mono…)
│   ├── layout/
│   │   ├── nav.css                     # Nav fixe, frosted glass au scroll, underline active
│   │   └── grid.css                    # .container, .grid, .grid-2/3, utilitaires flex/gap
│   ├── components/
│   │   ├── buttons.css                 # .btn, .btn-primary (filled), .btn-ghost (outlined), .btn-sm
│   │   ├── cards.css                   # .project-card + .hobby-card (fond image + overlay gradient)
│   │   ├── map.css                     # (stub) — styles SVG carte mondiale
│   │   └── modal.css                   # (stub) — overlay modal
│   ├── pages/
│   │   ├── home.css                    # Hero (clamp title, eyebrow, CTA) + section-nav cards
│   │   ├── developer.css               # En-tête, filter-bar, projects-grid, empty-state, count
│   │   ├── hobbies.css                 # En-tête + grille responsive 3→2→1 colonnes
│   │   ├── travel.css                  # (stub) — styles carte voyage
│   │   └── contact.css                 # Layout 2 col, contact-link-items, form + feedback states
│   └── animations/
│       ├── scroll.css                  # .will-animate / .is-visible + variants (from-left, fade-only)
│       └── transitions.css             # @keyframes pageEnter / pageExit sur <main>
│
├── js/
│   ├── main.js                         # Point d'entrée — initialisation globale (actuellement vide)
│   ├── core/
│   │   ├── nav.js                      # Scroll → .is-scrolled, active link par pathname
│   │   └── animations.js              # IntersectionObserver → .is-visible (fire-once)
│   ├── components/
│   │   └── transitions.js             # .page-enter au load, .page-exit + navigate sur click interne
│   └── pages/
│       ├── developer.js                # Filtre par data-tags, count live, empty state
│       └── travel-map.js               # VISITED_COUNTRIES[], colorie SVG, routing vers country pages
│
└── templates/
    ├── _project-template.html          # ★ Copier dans /developer/projects/nom.html
    └── _country-template.html          # ★ Copier dans /hobbies/voyage/countries/xx.html
```

### Règle de nommage des paths

| Niveau de profondeur | Prefix CSS/JS |
|---|---|
| Racine (`index.html`) | `css/main.css`, `js/core/nav.js` |
| 1 niveau (`developer/`, `hobbies/`, `contact/`) | `../css/main.css`, `../js/core/nav.js` |
| 2 niveaux (`developer/projects/`) | `../../css/main.css`, `../../js/core/nav.js` |
| 3 niveaux (`hobbies/voyage/countries/`) | `../../../css/main.css`, `../../../js/core/nav.js` |

---

## 4. Historique des Mises à Jour

### Session 1 — Fondations architecturales

**Objectif :** Poser toute l'infrastructure avant d'écrire la moindre page de contenu.

#### Décisions architecturales prises

- **Choix du stack vanilla** : HTML/CSS/JS sans framework ni build step. Décision délibérée pour un portfolio statique — zéro dépendance, zéro rot, déploiement trivial.
- **CSS en couches ordonnées** : Import unique via `main.css` dans l'ordre `tokens → reset → layout → components → pages → animations`. Cette stratégie garantit la cascade correcte et permet de remplacer le thème entier en ne modifiant que `variables.css`.
- **Design tokens avant tout** : `variables.css` créé en premier avec toutes les valeurs placeholder. Quand le template Dribbble arrivera, un seul fichier est à modifier.
- **Système d'animation opt-in** : décision de ne pas animer automatiquement — tout élément doit recevoir `.will-animate` explicitement. Cela évite les effets non désirés et donne un contrôle granulaire.
- **JS en IIFEs scopés** : chaque fichier JS est un module auto-exécuté avec `'use strict'`. Pas de pollution du scope global, pas d'ES modules (compatibilité maximale sans bundler).

#### Fichiers créés

- **Structure de dossiers complète** : 20+ répertoires créés d'un coup pour matérialiser l'architecture cible.
- `css/base/variables.css` — 73 tokens : 9 couleurs, 2 familles de fonts, 8 font-sizes, 10 espacements, 4 border-radius, 3 shadows, 4 transitions, 6 z-index.
- `css/base/reset.css` — Reset moderne : box-sizing border-box, scroll-behavior smooth, antialiasing, focus ring accessible via `:focus-visible`.
- `css/base/typography.css` — Classes utilitaires `.text-xs` à `.text-3xl`, `.text-muted`, `.text-accent`, `.text-mono`, `.uppercase`.
- `css/layout/nav.css` — Navigation fixe 70px, transparente par défaut, `backdrop-filter: blur(12px)` + `rgba(13,13,13,0.85)` au scroll, underline accent animée scaleX(0→1) sur hover/active.
- `css/layout/grid.css` — `.container` max-width 1200px, `.grid-2`, `.grid-3`, `.grid-auto-fill`, utilitaires flex.
- `css/animations/scroll.css` — `.will-animate` (opacity:0, translateY:32px) → `.is-visible` (opacity:1, translateY:0). Délais de stagger `data-delay="1"` à `"6"` (100ms par palier). Variants : `.from-left` (translateX), `.fade-only` (pas de translate).
- `css/animations/transitions.css` — `@keyframes pageEnter` (translateY:16px → 0, opacity:0→1, 600ms) et `pageExit` (inverse, 300ms).
- `css/components/buttons.css` — `.btn-primary` (filled accent), `.btn-ghost` (outlined), states hover avec `transform: translateY(-2px)` et glow sur primary.
- `css/main.css` — Fichier d'import orchestrateur, ordre fixé et commenté.
- `js/core/nav.js` — `scroll` listener passif → `.is-scrolled`. `setActiveLink()` compare `window.location.pathname` aux hrefs des liens.
- `js/core/animations.js` — `IntersectionObserver` avec `threshold: 0.12` et `rootMargin: '0px 0px -40px 0px'`. Fire-once : unobserve après déclenchement.
- `js/components/transitions.js` — Ajoute `.page-enter` à `<main>` au load. Intercepte tous les liens internes (pas `http`, `mailto`, `#`, `download`) pour jouer `.page-exit` puis naviguer après 300ms.
- `js/pages/travel-map.js` — Tableau `VISITED_COUNTRIES` configurable en tête de fichier. Lit les `[data-country]` sur les paths SVG, applique `.map-country--visited`, ajoute `role="button"` + `tabindex="0"` pour l'accessibilité clavier. Navigation vers `/hobbies/voyage/countries/[code].html`.
- `js/main.js` — Point d'entrée global (vide, prêt à recevoir de la logique cross-module).
- `index.html` — Page d'accueil complète : meta tags, Open Graph, Google Fonts preconnect, hero avec `.hero-eyebrow` + title `clamp()` + subtitle + 2 CTA, section de 3 `.section-card` animées avec stagger, footer avec année auto.

---

### Session 2 — Pages de section, composants et templates

**Objectif :** Construire les trois sections principales, le système de cards, et les templates réutilisables.

#### Décisions architecturales prises

- **Deux types de cards distincts** : `.project-card` (flat, border animée, footer avec actions) vs `.hobby-card` (fond image avec parallax scale, overlay gradient CSS pur via `::after`, contenu z-indexed au-dessus). Cette distinction est dans un seul fichier `cards.css`.
- **Tag system** : `.tag` / `.tags` centralisés dans `cards.css` — utilisés à la fois dans les project cards et dans les project pages (sidebar métadonnées). Font mono, border-radius full, hover accent.
- **Filtre par data attributes** : le filtre de la section Developer ne dépend d'aucune logique HTML — `data-filter` sur les boutons, `data-tags` sur les cards. Ajouter un filtre = 1 ligne HTML + attribut sur les cards. Aucune modification JS requise.
- **Formulaire de contact** : `action="mailto:"` comme fallback immédiat. Prévu pour Formspree (remplacer `action` par l'URL Formspree). States `.is-success` / `.is-error` déjà stylisés, prêts à être branchés.
- **Templates annotés** : chaque template contient des commentaires `TODO` explicites + la logique des paths relatifs précalculée selon la profondeur de fichier.

#### Fichiers créés / modifiés

- `css/components/cards.css` — **(remplacé stub)** : `.tag`, `.tags`, `.project-card` (header flex, year mono, desc flex:1, footer bordered), `.hobby-card` (position relative, `.hobby-card-bg` absolute avec Ken Burns au hover, `::after` gradient, `.hobby-card-body` z-index:100), `.btn-sm`.
- `css/pages/developer.css` — `.dev-header`, `.filter-bar` (scrollable horizontal, flex-wrap), `.filter-btn` états (default/hover/`.is-active` filled accent), `.projects-grid` (auto-fill minmax 320px), `.project-card.is-hidden` (display:none), `.projects-empty` (affiché par JS via `.is-visible`), `.projects-count` (mono xs muted), responsive 1 colonne à 640px.
- `css/pages/hobbies.css` — `.hobbies-header`, `.hobbies-grid` (3 colonnes → 2 à 900px → 1 à 600px).
- `css/pages/contact.css` — `.contact-header`, `.contact-layout` (2 colonnes égales, gap 4rem, → 1 colonne à 768px), `.contact-link-item` (translateX au hover), `.form-group`, `.form-input/.form-textarea` (focus border accent + glow rgba), `.form-feedback` (`.is-success` vert / `.is-error` rouge).
- `js/pages/developer.js` — **(nouveau)** : IIFE, `querySelectorAll` sur `.filter-btn` et `.project-card`, toggle `.is-hidden` selon `data-tags.split(',')`, mise à jour du `.projects-count` aria-live, toggle `.projects-empty.is-visible`.
- `developer/index.html` — En-tête animée, filter-bar avec 5 boutons (All, Machine Learning, Web, Data, Research), `.projects-meta` + count aria-live, `.projects-grid` avec 1 projet exemple commenté, empty state intégré, scripts relatifs `../js/`.
- `hobbies/index.html` — 3 `.hobby-card` (Travel/Pêche/Sport) avec emplacements images commentés (`background-image: url(...)` à décommenter), stagger `data-delay="1/2/3"`, liens vers sous-pages.
- `contact/index.html` — Layout 2 colonnes, 3 `.contact-link-item` (email/GitHub/LinkedIn) avec `TODO` à remplacer, formulaire avec `novalidate` + champs `name/email/message` + `#form-feedback`, scripts relatifs.
- `templates/_project-template.html` — Layout 2 colonnes (article + aside sidebar). Sidebar : année, stack tags, PDF download (commenté), lien GitHub (commenté). Sections dans l'article : Overview / Approach / Results. Paths préconfigurés pour `../../`.
- `templates/_country-template.html` — Back link vers la carte, flag emoji placeholder, titre pays, date/durée de visite, cover photo (commentée), sections "About the trip" + "Highlights" + "Photos" (commentée). Paths préconfigurés pour `../../../`.

---

## 5. État Actuel & Roadmap

### Complété ✅

| Élément | Statut |
|---|---|
| Structure de dossiers complète | ✅ |
| Système CSS (tokens, reset, layout, animations) | ✅ |
| Système JS (nav, animations, transitions, map stub) | ✅ |
| `index.html` (homepage) | ✅ |
| `developer/index.html` (grille + filtre) | ✅ |
| `hobbies/index.html` (3 hobby cards) | ✅ |
| `contact/index.html` (formulaire + liens) | ✅ |
| `templates/_project-template.html` | ✅ |
| `templates/_country-template.html` | ✅ |

### À faire (dans l'ordre recommandé)

1. **Pages de projets individuels** — Paul fournit les contenus progressivement. Pour chaque projet : copier `templates/_project-template.html` → `developer/projects/nom.html`, remplir les `TODO`, ajouter la card correspondante dans `developer/index.html`.

2. **`hobbies/voyage/index.html`** — Page principale voyage avec carte SVG. Nécessite de sourcer un fichier SVG du monde avec `data-country="xx"` sur chaque path. Brancher `js/pages/travel-map.js` + remplir `css/components/map.css`.

3. **`hobbies/peche/index.html`** + **`hobbies/sport/index.html`** — Sous-pages hobbies (contenu à définir).

4. **Intégration design Dribbble** — Quand le template arrive : mettre à jour `css/base/variables.css` uniquement. Le reste du site s'adapte automatiquement via les custom properties.

5. **Formulaire de contact** — Remplacer `action="mailto:..."` par une URL Formspree (`https://formspree.io/f/YOUR_ID`) + brancher JS pour afficher `.form-feedback.is-success` / `.is-error`.

6. **SEO & meta** — Ajouter `og:image` (décommenter dans chaque `<head>`), sitemap.xml, favicon.

---

## 6. Conventions à Respecter

### HTML
- Chaque page commence par `<header><nav class="site-nav">` avec le lien actif marqué `class="nav-link is-active" aria-current="page"`.
- Tout élément devant animer au scroll reçoit `class="will-animate"` + optionnellement `data-delay="1"` à `"6"`.
- Scripts chargés avec `defer` dans cet ordre : `nav.js` → `animations.js` → `transitions.js` → `[page-specific].js` → `main.js`.

### CSS
- **Jamais de valeurs hardcodées** en dehors de `variables.css`. Toujours `var(--token)`.
- Les styles d'une page vont dans `css/pages/[page].css`, pas en inline sauf dans les templates (cas exceptionnel commenté).
- Les `@media` queries vivent dans le fichier CSS de leur composant/page, pas dans un fichier séparé.

### JavaScript
- Chaque fichier JS est un **IIFE** autonome avec `'use strict'`.
- Toute logique de page va dans `js/pages/[page].js`, chargé uniquement sur la page concernée.
- Pas de `console.log` en production, pas de `var`, préférer `const` / `let`.

### Fichiers & paths
- Nommer les pages projets en **kebab-case** : `mon-projet.html`.
- Nommer les pages pays en **ISO 3166-1 alpha-2 lowercase** : `jp.html`, `br.html`.
- Mettre à jour `VISITED_COUNTRIES` dans `travel-map.js` **en même temps** que la création du fichier pays.
