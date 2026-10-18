# GRAPHIC DESIGN PORTFOLIO 2026 — Behance project page replica

A dependency-free static rebuild of
[the Behance project](https://www.behance.net/gallery/252076827/GRAPHIC-DESIGN-PORTFOLIO-2026).
Open `index.html` in a browser — no build step, no server required.

```
index.html      page shell (module stream, lightbox, back-to-top)
settings.js     ← ANIMATIONS & EFFECTS. Edit this to change how things move.
content.js      ← TEXT, IMAGES, VIDEOS. Edit this to change what's shown.
css/styles.css  styling + keyframes
js/app.js       renders content.js and drives the effects from settings.js
assets/pics&gifs/    the images shown on the page (1.gif … 20.png)
```

## What's on the page

The stream is the 20 blocks from the source project, in file order
(`1.gif` → `20.png`), each laid out at its real aspect ratio — except
**block 2**, which is no longer a flat image. It used to be a single
raster (`2.gif`), so its text could not be edited; it is now rebuilt as
live HTML (see *The `about` slide* below) and its copy is fully editable
in `content.js`.

Everything else from the source project — the extra CDN images, the
collections, the video and the Spotify embed — has been removed, so no
Behance/Adobe network requests are made any more.

Plus the project title and description, used only for the browser tab
and the `<meta name="description">` tag — nothing is rendered above or
below the images. The page opens straight on image 1.

## Editing it

### Text
Everything textual lives in `content.js`:

```js
meta.title        // "GRAPHIC DESIGN PORTFOLIO 2026"
meta.description  // the intro paragraph (browser tab + meta tag only)
modules[n].caption
```

## Images

Every image module points straight at a local file:

```js
{ "n": 1, "type": "image", "src": "assets/pics&gifs/1.gif", "w": 1400, "h": 788, "alt": "…" }
```

Drop a file into `assets/pics&gifs/`, add an object like the above to
`content.js`, and reload. `w`/`h` are only the aspect ratio (any unit
works — they drive the layout box). `settings.media.preferLocal` is off
because `src` is already local; turn it back on if you ever want
`assets/…` to shadow a CDN URL again.

### Videos and embeds
```js
{ "type": "video",  "src": "https://…/player/embed?…" }        // any iframe player URL
{ "type": "embed",  "src": "https://open.spotify.com/embed/…", "height": 352 }
```
`src` is the **embed** URL, not a share link.

### Adding, removing, reordering
The `modules` array is the page, top to bottom. Delete an object to remove a
block, copy one and edit it to add a block, move them to reorder. Collections
hold their tiles in `rows` — each row is an array of `{ src, w, h, flex }`,
where `flex` is the tile's share of the row width.

### The `about` slide (block 2)

```js
{ "n": 2, "type": "about", … }
```

This is the HELLO / SKILLS / EXPERIENCE / EDUCATION page. It is rendered
as real text on a **fixed 1400 × 788 canvas**, so it behaves like an image
in the stream (it scales, it does not reflow) until the screen is under
760px wide, where it stacks into a normal readable document.

Editable fields:

```js
greeting          // "HELLO"
intro.lead        // "Hi, I'm Harshith Sriramoju"
intro.body        // the paragraph beneath it
skills.heading    // "SKILLS"
skills.items[]    // { "key": "ps", "name": "Photoshop" }  — key drives the
                  // tile colour + the letters on it (ps / ai / ae / pr …)
experience.heading// "EXPERIENCE"
experience.entries[] // { "period": "2023-Present", "role": "Video Editor",
                     //   "org": "optional, only shown if present" }
education.heading // "EDUCATION"
education.entries[]  // { "degree": "…", "school": "…" }
edge              // the torn-paper footer artwork (see below)
```

**Adding a skill** = copy an entry in `skills.items` and give it a new
`key`. Add a matching `.sk--<key>` rule in `css/styles.css` for its
colours (or reuse an existing one); without one it falls back to a dark
tile with white letters.

**Skills are laid out in a 2 × 2 grid** — the two extra logos from the
source slide were removed on purpose. Widening it is one line:
`.skgrid { grid-template-columns: repeat(3, …) }`.

`edge` points at `assets/about-edge.png`, the bottom 168px of the
original slide (torn paper, red shape, portrait, and the three lower
selection handles). It is a real image so that band stays pixel-exact.
Replace that file to change the artwork; the grid behind it is drawn in
CSS and will line up on its own.

Geometry lives in `css/styles.css` under the `ABOUT SLIDE` banner. Every
number is the element's real pixel position in the source slide, written
as `calc(N * var(--u))`, where `--u` is one design pixel. Change `474` to
`400` and the column moves to `x = 400`. The `padding-top` / `min-height`
pair on `.about__left` is what pins the greeting to `y = 123` and
EDUCATION to `y = 478` — if you write a much longer intro, EDUCATION is
pushed down instead of colliding with it.

### Animations and effects
`settings.js` — every effect is a labelled block you can switch off or tune:

- `reveal` — modules fade + rise in on scroll (distance, duration, easing, stagger)
- `drift` — slow Ken-Burns scale on images as they pass through the viewport
- `lazy` / `media.fadeIn` — lazy loading with a cross-fade
- `gif.pauseWhenHidden` — halts off-screen GIFs to save CPU
- `lightbox` — click any image to zoom; arrow keys and Esc navigate
- `chrome` — back-to-top button, smooth scroll

Setting `enabled: false` on any block removes that behaviour entirely. The
`prefers-reduced-motion` media query overrides all of it for accessibility.

## Note on the assets

Everything the page displays lives in `assets/`. The images in
`assets/pics&gifs/` and the footer band `assets/about-edge.png` are the
**original creator's work (RAAGAV SUNDAR)**. Swap them for your own
material before publishing this anywhere public — see "Images" and
*The `about` slide* above. The text in `content.js` is already yours.

## tools/

Dev-only helpers, nothing here affects the page:

```
preview.html   renders block 2 on its own at full canvas size
compare.ps1    measures preview render.png against the source slide
render*.png    headless-Chrome screenshots (preview, and block 2 on index.html)
check.js       node tools/check.js — every class app.js emits has CSS,
               every field the about renderer reads exists, assets resolve
*.ps1          one-off measurement scripts used to derive the geometry
```
