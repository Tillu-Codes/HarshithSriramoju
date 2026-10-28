/* Static consistency check: every class app.js emits must exist in CSS,
   every asset content.js references must exist on disk, and the
   videogrid module (page 8) must reference real assets with valid ratios. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8').replace(/^﻿/, '');

const css = read('css/styles.css');
const app = read('js/app.js');
const content = read('content.js');

/* --- CSS class names --- */
const cssClasses = new Set();
for (const m of css.matchAll(/\.([A-Za-z][\w-]*)/g)) cssClasses.add(m[1]);

/* --- classes app.js produces --- */
const jsClasses = new Set();
for (const m of app.matchAll(/className\s*=\s*'([^']+)'/g)) m[1].split(/\s+/).forEach(c => c && jsClasses.add(c));
for (const m of app.matchAll(/\.className\s*=\s*"([^"]+)"/g)) m[1].split(/\s+/).forEach(c => c && jsClasses.add(c));
for (const m of app.matchAll(/'(module|shot|coll__\w+|embed|caption|lb\w*|totop)'/g)) jsClasses.add(m[1]);

const missing = [...jsClasses]
  .filter(c => !cssClasses.has(c))
  // structural wrappers that intentionally carry no styling
  .filter(c => !['lbClose', 'lbImg', 'lbNext', 'lbPrev', 'lbVid'].includes(c))
  .sort();
console.log('JS classes with no CSS rule : ' + (missing.length ? missing.join(', ') : 'none'));

/* --- assets referenced --- */
const assets = [...content.matchAll(/"((?:assets|https?:)[^"]+)"/g)].map(m => m[1]);
const local = assets.filter(a => !/^https?:/.test(a));
const gone = local.filter(a => !fs.existsSync(path.join(root, a)));
console.log('asset files missing         : ' + (gone.length ? gone.join(', ') : 'none'));

/* --- hero preload in index.html must match module 1's src ---
   index.html preloads the first asset so it starts downloading before
   settings.js / content.js / app.js parse. If content.js's first image
   module ever changes, that preload would silently point at a file the
   page no longer shows (wasted bandwidth + no prefetch). Keep them equal,
   and keep `as`/`type` honest about what the file actually is — a video
   preloaded as `as="image"` is dropped by the browser and buys nothing. */
const preloadIssues = [];
const html = read('index.html');
const preTag = (html.match(/<link\s+rel="preload"[^>]*>/) || [])[0] || '';
const pre = (preTag.match(/href="([^"]+)"/) || [])[1];
const preAs = (preTag.match(/as="([^"]+)"/) || [])[1];
const preType = (preTag.match(/type="([^"]+)"/) || [])[1];
const firstImage = (content.match(/"type":\s*"image"[\s\S]{0,400}?"src":\s*"([^"]+)"/) || [])[1];
const wantAs = firstImage && /\.(mp4|webm|mov|m4v)$/i.test(firstImage) ? 'video' : 'image';
const wantType = wantAs === 'video' ? 'video/mp4' : undefined;
const typeOk = wantType ? preType === wantType : true;

console.log('hero preload vs module 1    : ' +
  (!pre ? 'no preload in index.html'
        : !firstImage ? 'no first image module in content.js'
        : pre !== firstImage ? 'MISMATCH preload=' + pre + ' src=' + firstImage
        : preAs !== wantAs ? 'MISMATCH as=' + preAs + ' but module 1 is a ' + wantAs
        : !typeOk ? 'MISMATCH type=' + preType + ' expected ' + wantType
        : pre + '  (as=' + preAs + ')'));
if (!pre) preloadIssues.push('index.html is missing the hero <link rel="preload">');
else if (!firstImage) preloadIssues.push('content.js has no first image module to match');
else if (pre !== firstImage) preloadIssues.push('preload (' + pre + ') !== module 1 src (' + firstImage + ')');
else if (preAs !== wantAs) preloadIssues.push('preload as="' + preAs + '" but module 1 is a ' + wantAs);
else if (!typeOk) preloadIssues.push('preload type (' + preType + ') !== ' + wantType);

/* --- motion pages: the eight animated pages ship as MP4, and app.js must
   actually render them as <video> with src attached on demand.
   Reverting a ref to .gif, or dropping the observer that attaches the
   other seven srcs, would silently reintroduce the multi-megabyte GIF
   load this refactor exists to remove — so gate it. --- */
const motionIssues = [];
const gifRefs = [...content.matchAll(/"[^"]*\.gif(?:[?#][^"]*)?"/g)].map(m => m[0]);
console.log('content.js .gif refs        : ' + (gifRefs.length ? gifRefs.join(', ') : 'none  (ok)'));
if (gifRefs.length) motionIssues.push('content.js still references .gif: ' + gifRefs.join(', '));

const motionGates = [
  ['renders <video>', /createElement\(\s*'video'\s*\)/.test(app)],
  ['detects motion by extension', /function isMotion\(/.test(app)],
  ['attaches src only for the hero', /if \(!motion \|\| priority === 'high'\)/.test(app)],
  ['initMotionPlay defined', /function initMotionPlay\(/.test(app)],
  ['initMotionPlay called from boot', /\binitMotionPlay\(\);/.test(app)],
  ['observes .stream video', /querySelectorAll\(\s*'\.stream video'\s*\)/.test(app)],
  ['holds the first frame under prefers-reduced-motion', /priority === 'high' && !reduceMotion/.test(app)],
  ['queries both media kinds for drift', /querySelector\(\s*'img,video'\s*\)/.test(app)],
  ['lightbox has a video slot', /id="lbVid"/.test(html)],
  ['lightbox releases the video', /function lbReleaseVideo\(/.test(app)],
];
const motionBad = motionGates.filter(([, ok2]) => !ok2).map(([name]) => name);
console.log('motion rendering pipeline   : ' + (motionBad.length ? 'MISSING ' + motionBad.join(', ') : 'all ' + motionGates.length + ' present'));
if (motionBad.length) motionIssues.push('missing: ' + motionBad.join(', '));

/* --- .shot video must be styled, or motion pages render at the UA's
   default inline size inside an otherwise absolutely-positioned box --- */
const shotVideoCss = /\.shot[^{}]*\bvideo\b/.test(css);
console.log('.shot video styled          : ' + (shotVideoCss ? 'yes  (ok)' : 'MISSING'));
if (!shotVideoCss) motionIssues.push('styles.css has no .shot video rule');

/* --- the setting the observer reads must still exist under its new name --- */
const settingsNow = read('settings.js');
const motionBlock = (settingsNow.match(/motion:\s*\{([\s\S]*?)\n  \}/) || [])[1] || '';
console.log('settings.motion block       : ' + (/pauseWhenHidden\s*:/.test(motionBlock) ? 'pauseWhenHidden present  (ok)' : 'MISSING pauseWhenHidden'));
if (!/pauseWhenHidden\s*:/.test(motionBlock)) motionIssues.push('settings.js is missing motion.pauseWhenHidden');

/* --- videogrid module (page 8) --- */
const vgIssues = [];
const vgMod = content.match(/"type":\s*"videogrid"[\s\S]*?\n    \}/);
if (!vgMod) {
  console.log('videogrid module            : MISSING');
  vgIssues.push('no videogrid module');
} else {
  const vgb = vgMod[0];
  const tileObjs = [...vgb.matchAll(/\{[^{}]*"title":[^{}]*\}/g)].map(m => m[0]);

  console.log('videogrid tiles             : ' + tileObjs.length +
    (tileObjs.length === 6 ? '  (ok)' : '  (expected 6)'));
  if (tileObjs.length !== 6) vgIssues.push('expected 6 tiles, found ' + tileObjs.length);

  // every tile needs all five documented fields
  ['title', 'ratio', 'video', 'poster', 'alt'].forEach(k => {
    const bad = tileObjs.map((t, i) => new RegExp('"' + k + '"').test(t) ? null : i + 1).filter(Boolean);
    if (bad.length) vgIssues.push('tile(s) missing "' + k + '": ' + bad.join(','));
  });

  // the bento needs tall,wide,tall,wide,wide,wide — anything else breaks the
  // alignment maths in styles.css (see --vg-t / --vg-m)
  const ratios = tileObjs.map(t => (t.match(/"ratio":\s*"([^"]+)"/) || [])[1]);
  const wantOrder = ['9:16', '16:9', '9:16', '16:9', '16:9', '16:9'];
  const orderOk = JSON.stringify(ratios) === JSON.stringify(wantOrder);
  console.log('videogrid ratios            : ' + ratios.join(' / ') +
    (orderOk ? '  (ok — matches the bento)' : '  (must be 9:16,16:9,9:16,16:9,16:9,16:9)'));
  if (!orderOk) vgIssues.push('tile ratios do not match the bento order');

  // layout must stay in CSS, not here
  const layoutKeys = ['gap', 'pad', 'width', 'height', 'left', 'top', 'cols', 'size']
    .filter(k => new RegExp('"' + k + '"\\s*:').test(vgb));
  if (layoutKeys.length) vgIssues.push('hardcoded layout in content.js: ' + layoutKeys.join(', '));

  // assets must really exist
  const vfiles = [...vgb.matchAll(/"video":\s*"([^"]+)"/g)].map(m => m[1]);
  const pfiles = [...vgb.matchAll(/"poster":\s*"([^"]+)"/g)].map(m => m[1]);
  const badV = vfiles.filter(f => !fs.existsSync(path.join(root, f)));
  const badP = pfiles.filter(f => !fs.existsSync(path.join(root, f)));
  console.log('videogrid videos present    : ' + (vfiles.length - badV.length) + '/' + vfiles.length +
    (badV.length ? '  MISSING: ' + badV.join(', ') : '  (ok)'));
  console.log('videogrid posters present   : ' + (pfiles.length - badP.length) + '/' + pfiles.length +
    (badP.length ? '  MISSING: ' + badP.join(', ') : '  (ok)'));
  if (badV.length) vgIssues.push('missing video files');
  if (badP.length) vgIssues.push('missing poster files');

  const unopt = pfiles.filter(f => !/optimized\//.test(f));
  console.log('posters use optimised copies: ' + (pfiles.length - unopt.length) + '/' + pfiles.length +
    (unopt.length ? '  (not optimised: ' + unopt.join(', ') + ')' : '  (ok)'));
  if (/\.gif/i.test(vfiles.join(' '))) vgIssues.push('a videogrid video is a .gif');
  if (vfiles.length !== new Set(vfiles).size) vgIssues.push('duplicate video file in the grid');
}

/* --- CSS classes the videogrid renderer relies on --- */
const vgCssWanted = ['vgrid', 'vgrid__top', 'vgrid__bottom', 'vgtile', 'vgtile__video',
                     'vgtile__poster', 'vgtile__badge', 'is-playing', 'is-muted'];
const vgCssMissing = vgCssWanted.filter(c => !cssClasses.has(c));
console.log('videogrid CSS classes       : ' + (vgCssMissing.length ? 'MISSING ' + vgCssMissing.join(', ') : 'all ' + vgCssWanted.length + ' present'));
if (vgCssMissing.length) vgIssues.push('missing CSS: ' + vgCssMissing.join(', '));

/* --- settings.js videoGrid block --- */
const settings = read('settings.js');
const sBlock = (settings.match(/videoGrid:\s*\{([\s\S]*?)\n  \}/) || [])[1] || '';
const sFlags = ['enabled', 'rewindOnLeave', 'loop', 'fadeDuration',
                'preloadMargin', 'soundBadge', 'pauseOnScrollAway'];
const sMissing = sFlags.filter(f => !new RegExp('\\b' + f + '\\s*:').test(sBlock));
console.log('videoGrid settings flags    : ' + (sMissing.length ? 'MISSING ' + sMissing.join(', ') : 'all ' + sFlags.length + ' present'));
if (sMissing.length) vgIssues.push('settings.js missing: ' + sMissing.join(', '));

/* --- isolation: drift, motion playback and the lightbox must never touch tiles --- */
const vgSrc = app.slice(app.indexOf('function videoTile'),
                        app.indexOf('/* Common wrapper'));
// strip comments first, otherwise the word "autoplay" inside an explanatory
// comment about the browser's autoplay POLICY reads as a real autoplay attribute
const vgCode = vgSrc.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
const isolation = [];
if (/\bshot\b/.test(vgCode)) isolation.push('emits .shot (drift/lightbox would grab it)');
if (/can-zoom|zoomables/.test(vgCode)) isolation.push('touches zoomables');
if (/\bautoplay\b/i.test(vgCode)) isolation.push('sets autoplay');
if (/preload\s*=\s*['"]auto/.test(vgCode)) isolation.push('uses preload="auto"');
console.log('videogrid isolation         : ' + (isolation.length ? isolation.join(', ') : 'no .shot, no zoomables, no autoplay, no preload=auto'));
if (isolation.length) vgIssues.push('isolation broken: ' + isolation.join(', '));

/* --- SEO: the static <head> must agree with content.js, and the
   verification file / sitemap / robots.txt must stay in place.
   index.html carries title + description itself so crawlers that never
   execute app.js still get real values; content.js re-applies them at
   runtime. If the two ever disagree, one of them is a lie to Google, so
   this fails the run. The Google verification file must never be
   deleted or renamed - removing it eventually un-verifies the site in
   Search Console. */
const seoIssues = [];
const metaTitle = (content.match(/"title":\s*"([^"]*)"/) || [])[1];
const metaDesc = (content.match(/"description":\s*"([^"]*)"/) || [])[1];
const htmlTitle = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
const htmlDesc = (html.match(/<meta\s+name="description"\s+content="([^"]*)"/) || [])[1] || '';
const unescape = s => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
if (unescape(htmlTitle) !== metaTitle) seoIssues.push('index.html <title> !== content.js title');
if (htmlDesc !== metaDesc) seoIssues.push('index.html description !== content.js description');
if (metaDesc.length > 160) seoIssues.push('description is ' + metaDesc.length + ' chars (Google truncates past ~160)');

const verification = fs.readdirSync(root).filter(f => /^google[a-z0-9]+\.html$/.test(f));
const verifyOk = verification.length === 1 &&
  fs.readFileSync(path.join(root, verification[0]), 'utf8').trim() ===
    'google-site-verification: ' + verification[0];
if (!verification.length) seoIssues.push('Google verification file is missing from the repo root');
else if (!verifyOk) seoIssues.push('verification file content does not match its own name');

const canonical = (html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/) || [])[1];
const sitemapLoc = ((read('sitemap.xml').match(/<loc>([^<]+)<\/loc>/) || [])[1] || '');
const robotsSitemap = (read('robots.txt').match(/^Sitemap:\s*(\S+)$/mi) || [])[1] || '';
if (!canonical) seoIssues.push('index.html has no canonical link');
if (sitemapLoc !== canonical) seoIssues.push('sitemap.xml <loc> !== canonical (' + sitemapLoc + ')');
if (robotsSitemap !== canonical.replace(/\/?$/, '/') + 'sitemap.xml') seoIssues.push('robots.txt Sitemap line !== canonical + sitemap.xml');

const ogImage = (html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/) || [])[1] || '';
const ogPath = ogImage.replace(/^https?:\/\/[^/]+\//, '');
if (!ogImage) seoIssues.push('no og:image (link previews would be blank)');
else if (!fs.existsSync(path.join(root, ogPath))) seoIssues.push('og:image file missing: ' + ogPath);

console.log('SEO head / verification     : ' +
  (seoIssues.length ? seoIssues.join('; ')
                    : 'title+description match content.js, canonical/sitemap/robots agree, ' +
                      verification[0] + ' in place, og:image present'));

const ok = !missing.length && !gone.length && !vgIssues.length && !preloadIssues.length && !motionIssues.length && !seoIssues.length;

console.log(ok
  ? '\nRESULT: all checks passed'
  : '\nRESULT: issues found'
    + (preloadIssues.length ? '\n  preload: ' + preloadIssues.join('; ') : '')
    + (motionIssues.length ? '\n  motion: ' + motionIssues.join('; ') : '')
    + (vgIssues.length ? '\n  videogrid: ' + vgIssues.join('; ') : '')
    + (seoIssues.length ? '\n  seo: ' + seoIssues.join('; ') : ''));

// A gate that always exits 0 gates nothing — fail the run on any issue.
process.exit(ok ? 0 : 1);
