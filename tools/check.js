/* Static consistency check: every class app.js emits must exist in CSS,
   every content.js field the about renderer reads must be present, and the
   videogrid module (page 8) must reference real assets with valid ratios. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8').replace(/^\uFEFF/, '');

const css = read('css/styles.css');
const app = read('js/app.js');
const content = read('content.js');

/* --- CSS class names --- */
const cssClasses = new Set();
for (const m of css.matchAll(/\.([A-Za-z][\w-]*)/g)) cssClasses.add(m[1]);

/* --- classes app.js produces --- */
const jsClasses = new Set();
// literal 'className = "a b"' and textEl/sectionHeading 'cls' string args
for (const m of app.matchAll(/className\s*=\s*'([^']+)'/g)) m[1].split(/\s+/).forEach(c => c && jsClasses.add(c));
for (const m of app.matchAll(/\.className\s*=\s*"([^"]+)"/g)) m[1].split(/\s+/).forEach(c => c && jsClasses.add(c));
for (const m of app.matchAll(/'(sk|entry|ab-entry|about__[a-z]+|module|shot|coll__\w+|embed|caption|lb\w*|totop|skgrid)'/g)) jsClasses.add(m[1]);
// 'sk sk--' + key  ->  base + generated prefix
jsClasses.add('sk'); jsClasses.add('sk__svg'); jsClasses.add('sk__plate'); jsClasses.add('sk__letters');

const missing = [...jsClasses]
  .filter(c => !cssClasses.has(c))
  // structural wrappers that intentionally carry no styling
  .filter(c => !['ab-entries', 'ab-group', 'lbClose', 'lbImg', 'lbNext', 'lbPrev'].includes(c))
  .filter(c => c !== 'sk--')
  .sort();
console.log('JS classes with no CSS rule : ' + (missing.length ? missing.join(', ') : 'none'));

/* --- about-module fields --- */
const mod = content.match(/"type":\s*"about"[\s\S]*?\n    \}/);
if (!mod) { console.log('FAIL: no about module in content.js'); process.exit(1); }
const block = mod[0];
const wanted = ['greeting', 'intro', 'lead', 'body', 'education', 'entries',
                'degree', 'school', 'experience', 'period', 'role', 'skills',
                'items', 'key', 'name', 'edge'];
const absent = wanted.filter(k => !new RegExp('"' + k + '"').test(block));
console.log('about fields missing        : ' + (absent.length ? absent.join(', ') : 'none'));

/* --- assets referenced --- */
const assets = [...content.matchAll(/"((?:assets|https?:)[^"]+)"/g)].map(m => m[1]);
const local = assets.filter(a => !/^https?:/.test(a));
const gone = local.filter(a => !fs.existsSync(path.join(root, a)));
console.log('asset files missing         : ' + (gone.length ? gone.join(', ') : 'none'));

/* --- skills count (the brief asked for the last two removed) --- */
const items = [...block.matchAll(/"key":/g)].length;
console.log('skill tiles                 : ' + items + (items === 4 ? '  (ok — 4, was 6)' : '  (expected 4)'));

/* --- slide height sanity: does the intro fit above EDUCATION? --- */
const body = (block.match(/"body":\s*"([^"]+)"/) || [])[1] || '';
console.log('intro characters            : ' + body.length +
            (body.length < 620 ? '  (fits the 440px column)' : '  (may collide — raise min-height)'));

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

/* --- isolation: drift, GIF-pause and the lightbox must never touch tiles --- */
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

console.log(missing.length || absent.length || gone.length || items !== 4 || vgIssues.length
  ? '\nRESULT: issues found' + (vgIssues.length ? '\n  videogrid: ' + vgIssues.join('; ') : '')
  : '\nRESULT: all checks passed');
