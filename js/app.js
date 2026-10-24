/* =====================================================================
 *  Behaviour: renders CONTENT into the page and wires up every effect
 *  declared in settings.js. Nothing here needs editing to use the site —
 *  change content.js (what you see) or settings.js (how it moves).
 *
 *  The page is the module stream only: no nav, no project header, no
 *  footer. The only chrome left is the image lightbox and the
 *  back-to-top button.
 * ===================================================================== */
(function () {
  'use strict';

  var S = (typeof SETTINGS !== 'undefined') ? SETTINGS : {};
  var C = (typeof CONTENT !== 'undefined') ? CONTENT : null;
  if (!C) { console.error('content.js is missing or failed to load.'); return; }

  var $ = function (id) { return document.getElementById(id); };
  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------- *
   * Media resolution: `assets/…` paths are checked lazily by the
   * image probe below (settings.media.preferLocal).
   * ---------------------------------------------------------------- */
  function localPath(url) {
    var dir = (S.media && S.media.localDir) || 'assets';
    var file = url.split('/').pop();
    return dir + '/' + file;
  }

  /* Is this src one of the motion pages (they ship as MP4 rather than GIF)? */
  function isMotion(src) {
    return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(src || '');
  }

  /* Build a <div class="shot"> wrapper around an <img> (still page) or a
     <video> (motion page).
     `priority` is 'high' for the first (above-the-fold) asset, 'low' for
     everything else, so the browser's limited connection slots go to what
     the user is actually looking at first. Returns { box, media }. */
  function shot(src, w, h, alt, priority) {
    var box = document.createElement('div');
    box.className = 'shot';

    var motion = isMotion(src);
    var media;

    if (motion) {
      /* MP4 instead of GIF: the frames decode on a background thread rather
         than the main one, which is what removes the scroll jank. The
         playback contract is kept identical to the GIF it replaces —
         muted, looping, inline, moving while on screen — and unlike a GIF
         it can genuinely be paused when scrolled away (see initMotionPlay).
         Only the hero is fetched up front; every other page starts at
         preload="none" so an off-screen module costs zero bytes. */
      media = document.createElement('video');
      media.muted = true;
      media.defaultMuted = true;          // Safari reads this before play()
      media.loop = true;
      media.playsInline = true;
      media.setAttribute('playsinline', '');
      media.setAttribute('muted', '');
      media.setAttribute('aria-label', alt || '');
      // prefers-reduced-motion holds the first frame instead of playing it,
      // so those pages still need the bytes needed to decode a frame —
      // "none" would leave them sitting on the placeholder colour forever.
      media.preload = priority === 'high' || reduceMotion ? 'auto' : 'none';
      if (priority === 'high' && !reduceMotion) media.autoplay = true;
    } else {
      media = document.createElement('img');
      media.alt = alt || '';
      media.loading = (S.lazy && S.lazy.enabled) ? 'lazy' : 'eager';
      media.decoding = 'async';
    }
    // fetchpriority is a hint, so it is set as an attribute on both kinds.
    if (priority) media.setAttribute('fetchpriority', priority);

    // Reserve the box so the dark background shows instead of a jump.
    if (w && h) {
      box.style.paddingBottom = (h / w * 100) + '%';
      box.style.height = '0';
      media.style.position = 'absolute';
      media.style.inset = '0';
      media.style.height = '100%';
      media.style.objectFit = 'cover';
    }
    if (S.lazy && S.lazy.placeholder) box.style.setProperty('--ph', S.lazy.placeholder);

    media.dataset.cdn = src;
    // Only the hero carries a src attribute: the rest hold the path in
    // dataset and are attached by initMotionPlay when they near the
    // viewport, so loading the page never pulls all eight MP4s at once.
    if (!motion || priority === 'high') media.src = src;

    // If a local file was placed in assets/, prefer it.
    if (!motion && S.media && S.media.preferLocal) {
      var probe = new Image();
      probe.onload = function () { media.src = probe.src; };
      probe.src = localPath(src);
    }

    // Cross-fade once decoded.
    if (S.media && S.media.fadeIn) {
      box.classList.add('can-fade');
      if (S.media.fadeInDuration) box.style.setProperty('--fdur', S.media.fadeInDuration + 'ms');
      var mark = function () { box.classList.add('loaded'); };
      if (motion) {
        // Fires when the first frame is decodable. Off-screen pages have
        // not been attached yet, so they keep the placeholder until the
        // observer starts them — same visible result as native lazy images.
        if (media.readyState >= 2) mark();
        else media.addEventListener('loadeddata', mark, { once: true });
      } else if (media.complete) mark();
      else media.addEventListener('load', mark, { once: true });
    }

    if (S.media && S.media.clickable) {
      box.classList.add('can-zoom');
      box.addEventListener('click', function () { openLightbox(media); });
    }

    box.appendChild(media);
    return { box: box, media: media };
  }

  /* ---------------------------------------------------------------- *
   * Module renderers
   * ---------------------------------------------------------------- */
  var zoomables = [];   // images eligible for the lightbox, in DOM order

  function renderImage(m) {
    // The first image in the stream is what the visitor actually sees on
    // arrival, so it gets first claim on the connection; everything after
    // it yields (fetchpriority=low) because it is lazy-loaded anyway.
    var priority = zoomables.length === 0 ? 'high' : 'low';
    var el = shot(m.src, m.w, m.h, m.alt || m.caption || 'Project image ' + m.n, priority);
    zoomables.push(el.media);
    return wrap(m, el.box);
  }

  function renderCollection(m) {
    var frag = document.createElement('div');
    m.rows.forEach(function (row) {
      var rowEl = document.createElement('div');
      rowEl.className = 'coll__row';
      row.forEach(function (cell, i) {
        var el = shot(cell.src, cell.w, cell.h, cell.alt || ('Project image ' + m.n + '.' + (i + 1)));
        el.box.className = 'coll__cell';
        // Weight each tile by its aspect ratio so rows keep a constant height.
        el.box.style.flexGrow = String(cell.flex != null ? cell.flex : 100 / row.length);
        el.box.style.flexBasis = '0';
        el.box.style.paddingBottom = (cell.h / cell.w * 100) + '%';
        el.box.style.height = '0';
        el.media.style.position = 'absolute';
        el.media.style.inset = '0';
        el.media.style.height = '100%';
        el.media.style.objectFit = 'cover';
        zoomables.push(el.media);
        rowEl.appendChild(el.box);
      });
      frag.appendChild(rowEl);
    });
    return wrap(m, frag);
  }

  function renderVideo(m) {
    var el = document.createElement('div');
    el.className = 'embed';
    var box = document.createElement('div');
    box.className = 'embed__box';
    var f = document.createElement('iframe');
    f.src = m.src;
    f.title = 'Project video';
    f.allowFullscreen = true;
    f.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
    box.appendChild(f);
    el.appendChild(box);
    return wrap(m, el);
  }

  function renderEmbed(m) {
    var el = document.createElement('div');
    el.className = 'embed';
    var f = document.createElement('iframe');
    f.src = m.src;
    f.title = 'Embedded content';
    f.height = String(m.height || 352);
    f.style.width = '100%';
    f.style.border = '0';
    f.allowFullscreen = true;
    f.setAttribute('allow', 'autoplay; clipboard-write; encrypted-media; picture-in-picture');
    el.appendChild(f);
    return wrap(m, el);
  }


  /* ---------------------------------------------------------------- *
   * The "videogrid" module — six tiles that play their own video while
   * the cursor is on them, and only then.
   *
   * Nothing autoplays: every <video> is built with no `src` and
   * preload="none", so a page load transfers zero video bytes. An
   * IntersectionObserver attaches the source as `preload="metadata"`
   * roughly 600px before the module arrives so hovering feels instant.
   * Sound is always attempted first and only dropped to muted when the
   * browser's autoplay policy refuses — in which case the tile grows a
   * small "sound off" badge until the first real user gesture.
   * ---------------------------------------------------------------- */
  function videoTile(t, i, g) {
    var ratio = (t.ratio === '9:16') ? '9:16' : '16:9';
    var box = document.createElement('div');
    box.className = 'vgtile';
    box.dataset.ratio = ratio;
    box.dataset.index = String(i);
    box.tabIndex = 0;
    box.setAttribute('role', 'button');
    box.setAttribute('aria-label', 'Play: ' + (t.title || ('video ' + (i + 1))));

    var video = null;
    if (g.enabled !== false) {
      video = document.createElement('video');
      video.className = 'vgtile__video';
      video.setAttribute('preload', 'none');   // never "auto"
      video.setAttribute('playsinline', '');
      video.setAttribute('aria-hidden', 'true');
      video.playsInline = true;
      video.loop = g.loop !== false;
      video.muted = false;                     // sound on unless policy says no
      video.dataset.src = t.video;             // no src attribute: 0 bytes
      box.appendChild(video);
    }

    // Ratio-correct intrinsic size: the poster can never shift the layout,
    // whatever file the user points "poster" at later.
    var dims = (ratio === '9:16') ? [720, 1280] : [1280, 720];
    var img = document.createElement('img');
    img.className = 'vgtile__poster';
    img.src = t.poster;
    img.alt = t.alt || '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.width = dims[0];
    img.height = dims[1];
    img.setAttribute('draggable', 'false');
    box.appendChild(img);

    var badge = document.createElement('span');
    badge.className = 'vgtile__badge';
    badge.textContent = 'sound off - click to enable';
    badge.setAttribute('aria-hidden', 'true');
    box.appendChild(badge);

    return { el: box, video: video, img: img, badge: badge, src: t.video, loaded: false };
  }

  /* Shared hover-to-play wiring: the six-tile grid below and the single
     showreel module on page 4 are the same mechanism with one list. */
  function wireHoverPlay(tiles, g) {
    if (g.enabled === false || !tiles.length) return;

    var active = null;         // at most one tile may be playing
    var activated = false;     // becomes true on the first gesture anywhere
    var canHover = !!(window.matchMedia &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches);

    function tileAt(el) {
      var i = parseInt(el && el.dataset ? el.dataset.index : '-1', 10);
      return isNaN(i) ? null : (tiles[i] || null);
    }

    function showBadge(t) { if (g.soundBadge !== false) t.el.classList.add('is-muted'); }
    function hideBadge(t) { t.el.classList.remove('is-muted'); }

    // First contact with the network, and only once the module is near.
    function ensureLoaded(t) {
      if (t.loaded || !t.video || t.video.src) return;
      t.loaded = true;
      t.video.preload = 'metadata';
      t.video.src = t.src;
      t.video.load();
    }

    function play(t) {
      ensureLoaded(t);
      var v = t.video;
      v.muted = false;                      // spec: always try audible first
      var p = v.play();
      if (p && typeof p.then === 'function') {
        p.then(function () { hideBadge(t); }).catch(function (err) {
          if (!err || err.name !== 'NotAllowedError') return;
          // Autoplay policy — audible play needs a gesture that already
          // happened. Fall back to muted so the tile still comes alive.
          v.muted = true;
          showBadge(t);
          var q = v.play();
          if (q && typeof q.catch === 'function') q.catch(function () {});
        });
      } else {
        hideBadge(t);
      }
    }

    function stop(t, rewind) {
      if (!t || !t.video) return;
      t.video.pause();
      if (rewind) { try { t.video.currentTime = 0; } catch (e) {} }
      t.el.classList.remove('is-playing');
      if (active === t) active = null;
    }

    function start(t) {
      if (active && active !== t) stop(active, true);   // always reset the other one
      active = t;
      play(t);
    }

    function toggle(t) {
      if (active === t && t.video && !t.video.paused) stop(t, g.rewindOnLeave !== false);
      else start(t);
    }

    var rewindOnLeave = function () { return g.rewindOnLeave !== false; };

    tiles.forEach(function (t) {
      if (t.video) {
        // Poster only cross-fades out once frames are really flowing,
        // so there is never a black flash.
        t.video.addEventListener('playing', function () {
          if (active === t) t.el.classList.add('is-playing');
        });
        t.video.addEventListener('error', function () { stop(t, false); });
      }

      if (canHover) {
        t.el.addEventListener('pointerenter', function () { start(t); });
        t.el.addEventListener('pointerleave', function () {
          if (active === t) stop(t, rewindOnLeave());
        });
      } else {
        // Touch: first tap plays with sound, second pauses.
        t.el.addEventListener('click', function (e) { e.preventDefault(); toggle(t); });
      }

      t.el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          toggle(t);
        }
      });
    });

    // First click / tap / key anywhere unlocks sound for good.
    function onActivate() {
      if (activated) return;
      activated = true;
      tiles.forEach(function (t) {
        hideBadge(t);
        if (active === t && t.video && t.video.muted && !t.video.paused) t.video.muted = false;
      });
    }
    ['pointerdown', 'keydown', 'click'].forEach(function (type) {
      document.addEventListener(type, onActivate, true);
    });

    if ('IntersectionObserver' in window) {
      // Metadata only, this far ahead of the viewport. Never "auto".
      var pre = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var t = tileAt(en.target);
          if (t) ensureLoaded(t);
          pre.unobserve(en.target);
        });
      }, { rootMargin: g.preloadMargin || '600px 0px' });
      tiles.forEach(function (t) { pre.observe(t.el); });

      if (g.pauseOnScrollAway !== false) {
        var away = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) return;
            var t = tileAt(en.target);
            if (t && active === t) stop(t, rewindOnLeave());
          });
        }, { threshold: 0 });
        tiles.forEach(function (t) { away.observe(t.el); });
      }
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden && active) stop(active, rewindOnLeave());
    });
  }

  function renderVideoGrid(m) {
    var g = S.videoGrid || {};
    var root = document.createElement('div');
    root.className = 'vgrid';

    if (g.fadeDuration != null) root.style.setProperty('--vg-fade', g.fadeDuration + 'ms');

    var top = document.createElement('div');
    top.className = 'vgrid__top';
    var bottom = document.createElement('div');
    bottom.className = 'vgrid__bottom';

    var tiles = [];
    (m.tiles || []).forEach(function (t, i) {
      var tile = videoTile(t, i, g);
      tiles.push(tile);
      (i < 4 ? top : bottom).appendChild(tile.el);
    });

    root.appendChild(top);
    root.appendChild(bottom);
    wireHoverPlay(tiles, g);
    return wrap(m, root);
  }

  /* ---------------------------------------------------------------- *
   * The "clip" module — page 4's showreel.
   *
   * A still card that plays its own video while the cursor is on it,
   * and only then. Same mechanism as the grid above with a single tile:
   * the <video> is built with no `src` and preload="none", so a page
   * load transfers zero video bytes, and an IntersectionObserver
   * attaches the source as preload="metadata" ahead of the viewport so
   * the first hover is instant rather than a stall.
   *
   * The clip is 16:9 but the card is 1.92:1, so the poster is fitted
   * rather than cropped — the captions sitting near its edges survive
   * intact. The element deliberately stays out of `.shot` and out of
   * `zoomables`, so the lightbox and the drift can never fight the
   * hover for the same pixels.
   * ---------------------------------------------------------------- */
  function renderClip(m) {
    var box = document.createElement('div');
    box.className = 'clip';
    // wireHoverPlay resolves a tile from the element it observes by index,
    // so the box carries its position in the list, exactly as .vgtile does.
    box.dataset.index = '0';
    box.tabIndex = 0;
    box.setAttribute('role', 'button');
    box.setAttribute('aria-label', 'Play: ' + (m.alt || 'showreel'));

    var v = document.createElement('video');
    v.className = 'clip__video';
    v.setAttribute('preload', 'none');        // never "auto"
    v.setAttribute('playsinline', '');
    v.setAttribute('aria-hidden', 'true');
    v.playsInline = true;
    v.loop = true;
    v.muted = false;                          // sound on unless policy says no
    v.dataset.src = m.src;                    // no src attribute: 0 bytes
    box.appendChild(v);

    // Ratio-correct intrinsic size: the 16:9 box is locked in CSS, so the
    // poster cannot collapse the frame while it decodes, and pointing
    // "poster" at any other file later cannot shift the layout.
    var img = document.createElement('img');
    img.className = 'clip__poster';
    img.src = m.poster;
    img.alt = m.alt || 'Showreel poster';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.width = 1280;
    img.height = 720;
    img.setAttribute('draggable', 'false');
    box.appendChild(img);

    var badge = document.createElement('span');
    badge.className = 'clip__badge';
    badge.textContent = 'sound off - click to enable';
    badge.setAttribute('aria-hidden', 'true');
    box.appendChild(badge);

    wireHoverPlay([{ el: box, video: v, img: img, badge: badge,
                     src: m.src, loaded: false }], S.showreel || {});
    return wrap(m, box);
  }

  /* Common wrapper: reveal state + optional caption. */
  function wrap(m, node) {
    var sec = document.createElement('section');
    sec.className = 'module';
    sec.dataset.type = m.type;
    sec.dataset.n = String(m.n);
    sec.appendChild(node);
    if (m.caption) {
      var cap = document.createElement('p');
      cap.className = 'caption';
      cap.textContent = m.caption;
      sec.appendChild(cap);
    }
    return sec;
  }

  /* ---------------------------------------------------------------- *
   * Closing slide. The GRACIAS plate stays raster art — its display
   * type is a bespoke condensed face a web font cannot reproduce — but
   * the header and the contact row are live HTML laid over it, so the
   * links are real anchors and the text stays selectable.
   * ---------------------------------------------------------------- */
  var ICONS = {
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true">' +
           '<path class="solid" d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24 11.36 11.36 0 0 0 3.57.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2Z"/></svg>',
    mail:   '<svg viewBox="0 0 26 18" aria-hidden="true">' +
            '<rect x="1" y="1" width="24" height="16" rx="1.4"/>' +
            '<path d="m1.7 1.9 11.3 8.3 11.3-8.3"/></svg>',
    ig:     '<svg viewBox="0 0 24 24" aria-hidden="true">' +
            '<rect x="2.5" y="2.5" width="19" height="19" rx="5.4"/>' +
            '<circle cx="12" cy="12" r="4.5"/>' +
            '<circle class="dot" cx="17.5" cy="6.5" r="1.2"/></svg>',
    li:     '<svg viewBox="0 0 24 24" aria-hidden="true">' +
            '<rect x="2.5" y="2.5" width="19" height="19" rx="5.4"/>' +
            '<circle class="dot" cx="7.5" cy="7.9" r="1.2"/>' +
            '<path d="M7.5 11.2v5.6"/>' +
            '<path d="M11.6 16.8v-5.6m0 1.9c.42-1.28 1.5-2.1 2.8-2.1 1.7 0 2.7 1.15 2.7 3.05v2.75"/></svg>'
  };

  function renderThanks(m) {
    var root = document.createElement('div');
    root.className = 'thanks';

    var pic = document.createElement('img');
    pic.className = 'thanks__img';
    pic.alt = m.alt || '';
    pic.decoding = 'async';
    pic.dataset.cdn = m.src;
    pic.src = m.src;
    if (S.media && S.media.preferLocal) {
      var probe = new Image();
      probe.onload = function () { pic.src = probe.src; };
      probe.src = localPath(m.src);
    }
    root.appendChild(pic);

    var hd = document.createElement('p');
    hd.className = 'thanks__hd';
    hd.textContent = m.portfolio || '';
    root.appendChild(hd);

    var row = document.createElement('nav');
    row.className = 'thanks__row';
    row.setAttribute('aria-label', 'Contact');
    (m.contacts || []).forEach(function (c) {
      var a = document.createElement('a');
      a.className = 'thanks__item';
      a.href = c.href;
      if (/^https?:/i.test(c.href)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }

      var ic = document.createElement('span');
      ic.className = 'thanks__ico';
      ic.classList.add('thanks__ico--' + c.kind);
      ic.innerHTML = ICONS[c.kind] || '';
      a.appendChild(ic);

      var t = document.createElement('span');
      t.className = 'thanks__txt';
      t.textContent = c.label;
      a.appendChild(t);

      row.appendChild(a);
    });
    root.appendChild(row);

    return wrap(m, root);
  }

  var RENDER = {
    image: renderImage,
    collection: renderCollection,
    video: renderVideo,
    embed: renderEmbed,
    clip: renderClip,
    videogrid: renderVideoGrid,
    thanks: renderThanks,
  };

  /* ---------------------------------------------------------------- *
   * Document title + meta description (nothing visible on the page)
   * ---------------------------------------------------------------- */
  function paintMeta() {
    if (C.meta && C.meta.title) document.title = C.meta.title + ' — Portfolio';
    var d = document.querySelector('meta[name="description"]');
    if (d && C.meta && C.meta.description) d.content = C.meta.description;
  }

  /* ---------------------------------------------------------------- *
   * Reveal-on-scroll
   * ---------------------------------------------------------------- */
  var revealObserver = null;
  function initReveal(sections) {
    var r = S.reveal || {};
    if (!r.enabled || reduceMotion || !('IntersectionObserver' in window)) return;

    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        if (r.once !== false) revealObserver.unobserve(e.target);
      });
    }, { threshold: r.threshold != null ? r.threshold : 0.12, rootMargin: '0px 0px -6% 0px' });

    sections.forEach(function (sec, i) {
      sec.classList.add('can-reveal');
      sec.style.setProperty('--rd', (r.distance || 48) + 'px');
      sec.style.setProperty('--rdur', (r.duration || 900) + 'ms');
      sec.style.setProperty('--rdelay', ((i % 4) * (r.stagger || 70)) + 'ms');
      revealObserver.observe(sec);
    });
  }

  /* ---------------------------------------------------------------- *
   * Drift (slow scale) on full-bleed images
   * ---------------------------------------------------------------- */
  function initDrift() {
    var d = S.drift || {};
    if (!d.enabled || reduceMotion) return;
    var shots = document.querySelectorAll('.stream .shot');
    if (!shots.length) return;

    var ticking = false;
    function frame() {
      ticking = false;
      var vh = window.innerHeight;
      for (var i = 0; i < shots.length; i++) {
        var el = shots[i];
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) continue;
        // 0 at the edges of the viewport, 1 when centred.
        var centre = (r.top + r.height / 2) / vh;
        var prox = 1 - Math.min(Math.abs(centre - 0.5) * 2, 1);
        el.style.setProperty('--ddur', (d.duration || 1400) + 'ms');
        // Stills are <img>, motion pages are <video>; both drift the same.
        var img = el.querySelector('img,video');
        if (img && !el.matches(':hover')) {
          img.style.transform = 'scale(' + (1 + prox * (d.amount || 0.06)).toFixed(4) + ')';
        }
      }
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(frame); }
    }, { passive: true });
    window.addEventListener('resize', frame);
    frame();
  }

  /* ---------------------------------------------------------------- *
   * Motion pages: attach, play and pause as they near the viewport
   *
   * The eight animated pages are MP4s now. Only the hero carries a src
   * when the DOM is built, so this is what attaches the other seven —
   * meaning a fresh load requests exactly one video no matter how long
   * the page is. Once attached, playback follows the viewport: a page
   * in view plays muted/looped exactly as the GIF it replaced did, and a
   * page out of view is paused outright rather than merely swapped for a
   * 1px src as the old GIF pause had to do, so it stops decoding too.
   * ---------------------------------------------------------------- */
  function initMotionPlay() {
    var vids = Array.prototype.filter.call(
      document.querySelectorAll('.stream video'),
      function (v) { return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(v.dataset.cdn || ''); }
    );
    if (!vids.length) return;

    function start(v) {
      // Attaching src on demand is what keeps the initial load to one file.
      if (!v.src && v.dataset.cdn) v.src = v.dataset.cdn;
      // Under prefers-reduced-motion the frame is decoded and held still:
      // the page still reads correctly, it simply never moves. The src has
      // already been attached above, which is what makes that frame exist.
      if (reduceMotion) return;
      // play() resolves a promise, and a rejected one would surface in the
      // console as an unhandled rejection (autoplay policy, race with an
      // intervening pause()). Both are expected, so swallow them.
      var p = v.play();
      if (p && typeof p.catch === 'function') p.catch(function () {});
    }
    function stop(v) { if (!v.paused) v.pause(); }

    if (!('IntersectionObserver' in window) || !(S.motion && S.motion.pauseWhenHidden)) {
      vids.forEach(start);   // degrade to "play everything", never to nothing
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        // `seen` records the observer's own verdict so visibilitychange can
        // resume exactly the pages that were in view, and no others.
        e.target.dataset.seen = e.isIntersecting ? '1' : '0';
        if (e.isIntersecting) start(e.target); else stop(e.target);
      });
    }, { rootMargin: '300px 0px' });   // start slightly early, as the GIF pause did
    vids.forEach(function (v) { io.observe(v); });

    // A background tab decodes nothing on its own; make that explicit, and
    // resume only the pages the observer still considers in view.
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { vids.forEach(stop); return; }
      vids.forEach(function (v) {
        if (v.dataset.seen === '1') start(v);
      });
    });
  }

  /* ---------------------------------------------------------------- *
   * Misc page chrome: smooth scroll + back-to-top
   * ---------------------------------------------------------------- */
  function initChrome() {
    var toTop = $('toTop');
    var chrome = S.chrome || {};

    if (chrome.smoothScroll && !reduceMotion) document.documentElement.classList.add('chromeSmooth');
    if (chrome.toTop && toTop) toTop.style.display = 'flex';

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        if (chrome.toTop && toTop) {
          toTop.classList.toggle('show', window.pageYOffset > (chrome.toTopAfter || 600));
        }
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (chrome.toTop && toTop) {
      toTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    }
  }

  /* ---------------------------------------------------------------- *
   * Lightbox
   * ---------------------------------------------------------------- */
  var lb, lbImg, lbVid, lbIndex = 0;
  function initLightbox() {
    lb = $('lightbox'); lbImg = $('lbImg'); lbVid = $('lbVid');
    if (!(S.lightbox && S.lightbox.enabled)) {
      // Remove zoom affordance entirely.
      Array.prototype.forEach.call(document.querySelectorAll('.shot.can-zoom'), function (el) {
        el.classList.remove('can-zoom');
      });
      return;
    }
    lb.style.setProperty('--lbdur', (S.lightbox.zoomDuration || 420) + 'ms');
    $('lbClose').addEventListener('click', closeLightbox);
    $('lbPrev').addEventListener('click', function () { step(-1); });
    $('lbNext').addEventListener('click', function () { step(1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });

    if (S.lightbox.keyboard) {
      document.addEventListener('keydown', function (e) {
        if (lb.hidden) return;
        if (e.key === 'Escape') closeLightbox();
        else if (e.key === 'ArrowLeft') step(-1);
        else if (e.key === 'ArrowRight') step(1);
      });
    }
  }

  /* Route a zoomable into the slot that can actually render it: stills go
     to #lbImg, motion pages to #lbVid — an <img> cannot hold an MP4, so
     the two slots swap rather than share. Only one is ever laid out. */
  function lbShow(media) {
    var isVideo = media.tagName === 'VIDEO';
    if (isVideo) {
      lbImg.hidden = true;
      lbImg.removeAttribute('src');      // release the still's decode
      lbVid.hidden = false;
      var want = media.currentSrc || media.src || media.dataset.cdn;
      if (lbVid.getAttribute('src') !== want) lbVid.src = want;
      var p = lbVid.play();
      if (p && typeof p.catch === 'function') p.catch(function () {});
    } else {
      lbReleaseVideo();
      lbImg.hidden = false;
      lbImg.style.transition = 'none';   // a fresh still is not a cross-fade
      lbImg.style.opacity = '1';
      lbImg.src = media.currentSrc || media.src || media.dataset.cdn;
    }
  }
  function lbReleaseVideo() {
    if (!lbVid) return;
    lbVid.pause();
    lbVid.hidden = true;
    lbVid.removeAttribute('src');        // do not keep a second copy alive
    lbVid.load();
  }

  function openLightbox(media) {
    if (!lb) return;
    lbIndex = zoomables.indexOf(media);
    if (lbIndex < 0) return;
    lbShow(media);
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () { lb.classList.add('show'); });
  }
  function closeLightbox() {
    if (!lb || lb.hidden) return;
    lb.classList.remove('show');
    document.body.style.overflow = '';
    lbReleaseVideo();
    setTimeout(function () { lb.hidden = true; }, 320);
  }
  function step(dir) {
    if (!zoomables.length) return;
    lbIndex = (lbIndex + dir + zoomables.length) % zoomables.length;
    var media = zoomables[lbIndex];
    if (media.tagName === 'VIDEO') { lbShow(media); return; }
    lbReleaseVideo();   // a still must take the stage back from the video
    lbImg.hidden = false;
    lbImg.style.opacity = '0';
    var next = new Image();
    next.onload = function () {
      lbImg.src = next.src;
      lbImg.style.transition = 'opacity .22s ease';
      lbImg.style.opacity = '1';
    };
    next.onerror = function () { lbImg.style.opacity = '1'; };  // never leave it blank
    next.src = media.currentSrc || media.src || media.dataset.cdn;
  }

  /* ---------------------------------------------------------------- *
   * Boot
   * ---------------------------------------------------------------- */
  function boot() {
    paintMeta();
    initLightbox();
    initChrome();

    var host = $('modules');
    var sections = [];
    C.modules.forEach(function (m) {
      var fn = RENDER[m.type];
      if (!fn) { console.warn('Unknown module type:', m.type); return; }
      var el = fn(m);
      host.appendChild(el);
      sections.push(el);
    });

    initReveal(sections);
    initDrift();
    initMotionPlay();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
