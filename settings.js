/* =====================================================================
 *  ANIMATIONS & EFFECTS — edit here, no need to touch app.js
 *
 *  Every boolean can be flipped to true/false. Every number/duration
 *  can be changed. The easing strings are any valid CSS timing function
 *  ("ease", "linear", "cubic-bezier(.2,.8,.2,1)", "cubic-bezier(...)")
 *  and the distances are in pixels, distances "up" are how far modules
 *  travel in as they scroll into view.
 * ===================================================================== */

const SETTINGS = {

  /* ---- scroll-in reveal for each module (Behance-style fade + rise) ---- */
  reveal: {
    enabled: true,
    distance: 48,          // px the module rises from
    duration: 900,         // ms
    easing: 'cubic-bezier(.16,.84,.34,1)',
    stagger: 70,           // ms extra delay per item inside a collection
    threshold: 0.12,       // how much of the module must be visible
    once: true,            // true = only animate the first time it appears
  },

  /* ---- Ken Burns drift applied to full-bleed images while on screen ---- */
  drift: {
    enabled: true,         // very slow scale on big images as you scroll
    amount: 0.06,          // max extra scale (0.06 = 6%)
    duration: 1400,        // ms for the transform to settle
  },

  /* ---- lazy loading ---- */
  lazy: {
    enabled: true,
    rootMargin: '600px 0px',   // start fetching this far ahead of the viewport
    placeholder: '#202222',    // colour shown until the image decodes
  },

  /* ---- animated GIFs pause while scrolled out of view (saves CPU) ---- */
  gif: {
    pauseWhenHidden: true,
  },

  /* ---- the six-tile video grid (module 8, "LOGOS & MARKS") ----
     Tiles are silent and still until you point at one. Every flag
     below is a switch: flip `enabled` off and the module falls back
     to static thumbnails that never load a video at all.            */
  videoGrid: {
    enabled: true,            // false = posters only, no video elements wired up
    rewindOnLeave: true,      // pause + jump back to 0 when the cursor leaves
    loop: true,               // keep playing from the start while hovered
    fadeDuration: 420,        // ms for the poster to cross-fade to the video
    preloadMargin: '600px 0px', // fetch video metadata this far before it scrolls in
    soundBadge: true,         // show "sound off - click to enable" when autoplay is blocked
    pauseOnScrollAway: true,  // pause if the tile scrolls out of the viewport
  },

  /* ---- image lightbox ---- */
  lightbox: {
    enabled: true,             // click any project image to zoom in
    keyboard: true,            // arrow keys + Esc
    zoomDuration: 420,
  },

  /* ---- misc page chrome ---- */
  chrome: {
    backToTop: true,
    toTopAfter: 600,           // px scrolled before the button appears
    smoothScroll: true,
  },

  /* ---- where images come from ---- */
  media: {
    preferLocal: false,        // srcs in content.js are already local files
    localDir: 'assets/pics&gifs',
    fadeIn: true,              // cross-fade each image in as it decodes
    fadeInDuration: 600,
    clickable: true,           // adds the hover zoom-cursor affordance
  },
};
