/* Static consistency check: every class app.js emits must exist in CSS,
   and every content.js field the about renderer reads must be present. */
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

console.log(missing.length || absent.length || gone.length || items !== 4 ? '\nRESULT: issues found' : '\nRESULT: all checks passed');
