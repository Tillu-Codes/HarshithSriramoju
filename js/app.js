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

  /* Build a <div class="shot"> wrapper around an <img>. */
  function shot(src, w, h, alt) {
    var box = document.createElement('div');
    box.className = 'shot';

    var img = document.createElement('img');
    img.alt = alt || '';
    img.loading = (S.lazy && S.lazy.enabled) ? 'lazy' : 'eager';
    img.decoding = 'async';

    // Reserve the box so the dark background shows instead of a jump.
    if (w && h) {
      box.style.paddingBottom = (h / w * 100) + '%';
      box.style.height = '0';
      img.style.position = 'absolute';
      img.style.inset = '0';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
    }
    if (S.lazy && S.lazy.placeholder) box.style.setProperty('--ph', S.lazy.placeholder);

    img.dataset.cdn = src;
    img.src = src;

    // If a local file was placed in assets/, prefer it.
    if (S.media && S.media.preferLocal) {
      var probe = new Image();
      probe.onload = function () { img.src = probe.src; };
      probe.src = localPath(src);
    }

    // Cross-fade once decoded.
    if (S.media && S.media.fadeIn) {
      box.classList.add('can-fade');
      if (S.media.fadeInDuration) box.style.setProperty('--fdur', S.media.fadeInDuration + 'ms');
      var mark = function () { box.classList.add('loaded'); };
      if (img.complete) mark(); else img.addEventListener('load', mark, { once: true });
    }

    if (S.media && S.media.clickable) {
      box.classList.add('can-zoom');
      box.addEventListener('click', function () { openLightbox(img); });
    }

    box.appendChild(img);
    return { box: box, img: img };
  }

  /* ---------------------------------------------------------------- *
   * Module renderers
   * ---------------------------------------------------------------- */
  var zoomables = [];   // images eligible for the lightbox, in DOM order

  function renderImage(m) {
    var el = shot(m.src, m.w, m.h, m.alt || m.caption || 'Project image ' + m.n);
    zoomables.push(el.img);
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
        el.img.style.position = 'absolute';
        el.img.style.inset = '0';
        el.img.style.height = '100%';
        el.img.style.objectFit = 'cover';
        zoomables.push(el.img);
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
   * The "about" slide — live HTML in place of the old 2.gif, so the
   * intro, experience, education and skills are all editable text.
   * ---------------------------------------------------------------- */
  function textEl(tag, cls, text) {
    var n = document.createElement(tag);
    n.className = cls;
    n.textContent = text;
    return n;
  }

  // Positions of the selection handles, in slide pixels, relative to the
  // frame box. The bottom three are baked into about-edge.png already.
  var HANDLES = [[-8, -6], [125, -6], [260, -6], [-8, 304], [260, 304]];

  function frameDecoration() {
    var f = document.createElement('div');
    f.className = 'about__frame';
    f.setAttribute('aria-hidden', 'true');
    HANDLES.forEach(function (p) {
      var h = document.createElement('i');
      h.className = 'about__hnd';
      h.style.left = 'calc(' + p[0] + ' * var(--u))';
      h.style.top = 'calc(' + p[1] + ' * var(--u))';
      f.appendChild(h);
    });
    return f;
  }

  // Adobe-style tile: dark rounded square + two-letter mark.
  // The mark comes from `key` (ps/ai/ae/pr…), not from the name.
  function skillTile(item) {
    var key = item.key || 'sk';
    var mark = (item.key ? item.key.charAt(0).toUpperCase() + item.key.slice(1)
                         : (item.name || '').slice(0, 2));
    var tile = document.createElement('span');
    tile.className = 'sk sk--' + key;
    tile.setAttribute('title', item.name || key);

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 48 48');
    svg.setAttribute('class', 'sk__svg');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', item.name || key);

    var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '0'); rect.setAttribute('y', '0');
    rect.setAttribute('width', '48'); rect.setAttribute('height', '48');
    rect.setAttribute('rx', '10');
    rect.setAttribute('class', 'sk__plate');
    svg.appendChild(rect);

    var t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', '24'); t.setAttribute('y', '25');
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('dominant-baseline', 'middle');
    t.setAttribute('class', 'sk__letters');
    t.textContent = mark;
    svg.appendChild(t);

    tile.appendChild(svg);
    return tile;
  }

  /* ---------------------------------------------------------------- *
   * The looping 3D clip pinned inside the empty selection frame.
   * One <video>, no JS animation — the browser owns the loop, so it is
   * built once with the module and never reloads or restarts on scroll.
   * Reduced motion gets no autoplay: the source is pulled just far
   * enough to paint frame 0 and then holds still.
   *
   * The clip is shot on a black plate. This filter turns that plate into
   * real alpha so the figure stands on the slide's own grid: luminance
   * becomes alpha, then a knee at 6/255 clears it — the plate measures
   * <=2 across the whole background while the figure (hair included)
   * stays above that. Built once, shared by every frame.
   * ---------------------------------------------------------------- */
  var FIG_FILTER = 'fig-key';
  function figFilter() {
    if (document.getElementById(FIG_FILTER)) return;
    var host = document.createElement('div');
    host.innerHTML =
      '<svg width="0" height="0" aria-hidden="true" ' +
        'style="position:absolute;width:0;height:0;overflow:hidden">' +
      '<filter id="' + FIG_FILTER + '" color-interpolation-filters="sRGB">' +
        '<feColorMatrix type="matrix" ' +
          'values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 .2126 .7152 .0722 0 0"/>' +
        '<feComponentTransfer>' +
          '<feFuncA type="linear" slope="60" intercept="-1.4118"/>' +
        '</feComponentTransfer>' +
      '</filter></svg>';
    document.body.appendChild(host.firstChild);
  }

  function renderFig(src) {
    figFilter();
    var v = document.createElement('video');
    v.className = 'about__figvid';
    v.loop = true;
    v.defaultMuted = true;          // `muted` content attribute
    v.muted = true;                 // state the autoplay policy checks
    v.playsInline = true;
    v.setAttribute('aria-label', 'Looping 3D animation of Harshith Sriramoju');
    v.preload = 'metadata';
    if (reduceMotion) {
      v.preload = 'auto';           // fetch frame 0 so the box is not blank
    } else {
      v.autoplay = true;
    }
    v.src = src;                    // last: every flag is in place before
                                    // resource selection kicks off
    var box = document.createElement('div');
    box.className = 'about__fig';
    box.appendChild(v);
    return box;
  }

  function renderAbout(m) {
    var root = document.createElement('div');
    root.className = 'about';

    // --- left: greeting + introduction -----------------------------
    var left = document.createElement('div');
    left.className = 'about__left';

    left.appendChild(textEl('h2', 'about__greet', m.greeting || 'HELLO'));

    var intro = m.intro || {};
    if (intro.lead) left.appendChild(textEl('p', 'about__lead', intro.lead));
    if (intro.body) left.appendChild(textEl('p', 'about__body', intro.body));
    root.appendChild(left);

    if (m.fig) root.appendChild(renderFig(m.fig));

    if (m.education && m.education.entries && m.education.entries.length) {
      var edu = document.createElement('div');
      edu.className = 'about__edu';
      edu.appendChild(sectionHeading(m.education.heading || 'EDUCATION', 'about__h'));
      var eduList = document.createElement('div');
      eduList.className = 'ab-entries';
      m.education.entries.forEach(function (e) {
        var box = document.createElement('div');
        box.className = 'ab-entry';
        if (e.degree) box.appendChild(textEl('p', 'entry__strong', e.degree));
        if (e.school) box.appendChild(textEl('p', 'entry__muted', e.school));
        eduList.appendChild(box);
      });
      edu.appendChild(eduList);
      root.appendChild(edu);
    }

    // --- right column: skills + experience -------------------------
    var right = document.createElement('div');
    right.className = 'about__right';

    if (m.skills && m.skills.items && m.skills.items.length) {
      var g1 = document.createElement('div');
      g1.className = 'ab-group ab-group--skills';
      g1.appendChild(sectionHeading(m.skills.heading || 'SKILLS', 'about__h'));
      var grid = document.createElement('div');
      grid.className = 'skgrid';
      m.skills.items.forEach(function (item) { grid.appendChild(skillTile(item)); });
      g1.appendChild(grid);
      right.appendChild(g1);
    }

    if (m.experience && m.experience.entries && m.experience.entries.length) {
      var g2 = document.createElement('div');
      g2.className = 'ab-group ab-group--xp';
      g2.appendChild(sectionHeading(m.experience.heading || 'EXPERIENCE', 'about__h'));
      var xpList = document.createElement('div');
      xpList.className = 'ab-entries';
      m.experience.entries.forEach(function (e) {
        var box = document.createElement('div');
        box.className = 'ab-entry';
        if (e.period) box.appendChild(textEl('p', 'entry__period', e.period));
        if (e.role) box.appendChild(textEl('p', 'entry__strong', e.role));
        if (e.org) box.appendChild(textEl('p', 'entry__muted', e.org));
        xpList.appendChild(box);
      });
      g2.appendChild(xpList);
      right.appendChild(g2);
    }
    root.appendChild(right);

    // --- torn-paper footer band (paper + red shape + portrait) -----
    if (m.edge) {
      var edge = document.createElement('img');
      edge.className = 'about__edge';
      edge.src = m.edge;
      edge.alt = '';
      edge.setAttribute('aria-hidden', 'true');
      root.appendChild(edge);
    }

    root.appendChild(frameDecoration());
    return wrap(m, root);
  }

  function sectionHeading(text, cls) {
    var h = document.createElement('h3');
    h.className = cls;
    h.textContent = text;
    return h;
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

  function wireVideoGrid(root, tiles, g) {
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
    wireVideoGrid(root, tiles, g);
    return wrap(m, root);
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
    about: renderAbout,
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
        var img = el.querySelector('img');
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
   * Pause GIFs that are off-screen
   * ---------------------------------------------------------------- */
  function initGifPause() {
    if (!(S.gif && S.gif.pauseWhenHidden) || !('IntersectionObserver' in window)) return;
    var gifs = Array.prototype.filter.call(
      document.querySelectorAll('.stream img'),
      function (i) { return /\.gif(\?|$)/i.test(i.dataset.cdn || i.src); }
    );
    if (!gifs.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var img = e.target;
        if (e.isIntersecting) {
          if (img.dataset.frozen === '1') { img.src = img.dataset.cdn; img.dataset.frozen = '0'; }
        } else if (img.dataset.frozen !== '1') {
          // Swapping to a 1px data URI effectively halts the animation.
          img.dataset.frozen = '1';
          img.removeAttribute('src');
        }
      });
    }, { rootMargin: '300px 0px' });
    gifs.forEach(function (g) { io.observe(g); });
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
  var lb, lbImg, lbIndex = 0;
  function initLightbox() {
    lb = $('lightbox'); lbImg = $('lbImg');
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

  function openLightbox(img) {
    if (!lb) return;
    lbIndex = zoomables.indexOf(img);
    if (lbIndex < 0) return;
    lbImg.src = img.currentSrc || img.src;
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () { lb.classList.add('show'); });
  }
  function closeLightbox() {
    if (!lb || lb.hidden) return;
    lb.classList.remove('show');
    document.body.style.overflow = '';
    setTimeout(function () { lb.hidden = true; }, 320);
  }
  function step(dir) {
    if (!zoomables.length) return;
    lbIndex = (lbIndex + dir + zoomables.length) % zoomables.length;
    var img = zoomables[lbIndex];
    lbImg.style.opacity = '0';
    var next = new Image();
    next.onload = function () {
      lbImg.src = next.src;
      lbImg.style.transition = 'opacity .22s ease';
      lbImg.style.opacity = '1';
    };
    next.src = img.currentSrc || img.src;
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
    initGifPause();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
