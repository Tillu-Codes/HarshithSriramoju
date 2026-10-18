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
(`1.gif` → `20.png`), each laid out at its real aspect ratio — except two
of them, which are no longer flat images:

- **block 2** used to be a single raster (`2.gif`), so its text could not
  be edited. It is now live HTML (see *The `about` slide* below).
- **block 8** — the "LOGOS & MARKS" page — used to be one flat GIF
  (`8.gif`). It is now a live six-tile video grid (see *The video grid*
  below). The GIF is still on disk, just no longer referenced.

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

### The video grid (block 8, "LOGOS & MARKS")

```js
{
  "n": 8,
  "type": "videogrid",
  "w": 1400, "h": 1112,
  "tiles": [
    { "title": "Short-form edit", "ratio": "9:16",
      "video": "assets/videos/shortformvid.MP4",
      "poster": "assets/thumbnails/optimized/shortformimg.webp",
      "alt": "Short-form video editing showreel" },
    /* …five more… */
  ]
}
```

Six tiles in a fixed bento shape. Each shows its poster and plays its
video **only while the cursor is on it** — nothing autoplays, ever.

Per-tile fields:

```js
title    // shown to screen readers as "Play: <title>"
ratio    // "9:16" (tall) or "16:9" (wide) — see the warning below
video    // the video file
poster   // the still shown while paused
alt      // alt text
```

**Keep the ratios in this order: `9:16, 16:9, 9:16, 16:9, 16:9, 16:9`.**
Tiles 1 and 3 are the tall pair flanking a centre column of two wide
tiles; 5 and 6 sit underneath. The bento's arithmetic assumes exactly
that, so changing a ratio stops the top and bottom edges lining up.

**Layout lives in CSS, not here** — the module holds file names and text
only, no pixel positions.

#### How the tiles behave

- **Hover** (desktop) starts the video; leaving pauses it, rewinds to 0
  and brings the poster back.
- **Tap** (touch) plays with sound; tap again pauses.
- **Enter / Space** toggles a focused tile. Focus and blur never autoplay.
- Only **one** tile plays at a time — starting one pauses *and resets*
  the others.
- Hiding the tab, or a tile scrolling out of view, pauses it.
- The poster cross-fades out on the video's `playing` event only, so
  there is never a black flash.

#### Sound, and the browser's autoplay policy

Audio is never removed. Every hover calls `play()` with `muted = false`
first. Browsers refuse audible playback until you have clicked, tapped or
pressed a key somewhere on the page — when that happens the tile falls
back to **muted** so it still comes alive, and shows a small
`sound off - click to enable` chip. The first click, tap or key press
anywhere clears the chip and unmutes whatever is already playing; from
then on every hover plays **with sound**.

No audio is re-encoded, attenuated or otherwise altered.

> Tested with a simulated `NotAllowedError`, because headless Chrome does
> not enforce the autoplay policy at all (it allows unmuted `play()` with
> no gesture whatsoever, even under
> `--autoplay-policy=document-user-activation-required`). On a real,
> headed browser the fallback path is the one that runs.

#### Performance

A page load transfers **zero video bytes**. Each `<video>` is created
with no `src` and `preload="none"`; an `IntersectionObserver` attaches the
source as `preload="metadata"` once its tile is within `preloadMargin`
(600px by default), so hovering starts fast without downloading the
videos. `preload="auto"` is never used.

The tiles deliberately **do not** carry the `.shot` class, so the drift
effect, the GIF-pause feature and the lightbox all ignore them, and the
lightbox's arrow keys skip straight past them.

#### Geometry

Like the about slide this is a fixed canvas that scales like an image —
it never reflows between 761px and 1400px+, and stacks into one column
under 760px.

```
W = 1400 - 2·pad   grid width        (pad 48  -> 1304)
G = gap            12 at a 1400px canvas
t = (W - 10G/9) · 81/290   tall tile width    = 360.5
H = 16t/9                  tall tile height   = 640.9
m = (H - G) · 8/9          centre column width = 559.0
c = 9m/16                  centre tile height  = 314.4
bottom tiles (W-G)/2 × 9(W-G)/32               = 646 × 363.4
```

Because `2t + m + 2G = W` and `2c + G = H` hold by construction, the
edges line up **exactly** — the ratios are exact, not approximated. All
of it is written in `css/styles.css` under the `VIDEO GRID` banner as
`calc(… * var(--u))`, where `--u` is one design pixel. Change `--vg-pad`
or `--vg-gap` and the whole bento rescales itself.

#### Optimised posters

The originals in `assets/thumbnails/` (487 KB – 1.98 MB each) are kept
untouched. `assets/thumbnails/optimized/` holds WebP copies at quality 85
sized to twice their display width — about 28–61 KB each, ~96% smaller.
Point a tile's `poster` at an original any time if you would rather serve
the full-size file.

### Animations and effects
`settings.js` — every effect is a labelled block you can switch off or tune:

- `reveal` — modules fade + rise in on scroll (distance, duration, easing, stagger)
- `drift` — slow Ken-Burns scale on images as they pass through the viewport
- `lazy` / `media.fadeIn` — lazy loading with a cross-fade
- `gif.pauseWhenHidden` — halts off-screen GIFs to save CPU
- `lightbox` — click any image to zoom; arrow keys and Esc navigate
- `chrome` — back-to-top button, smooth scroll
- `videoGrid` — the six-tile video grid: hover/tap playback, sound policy,
  preload distance, rewind-on-leave, pause-on-scroll-away (see above)

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
preview.html   renders one module on its own at full canvas size.
               Pick it with the hash: #videogrid (default), #about, #8 …
compare.ps1    measures preview render.png against the source slide
render*.png    headless-Chrome screenshots (preview, and block 2 on index.html)
check.js       node tools/check.js — every class app.js emits has CSS,
               every field the about renderer reads exists, assets
               resolve, and the videogrid's tiles, ratios, videos,
               posters, CSS classes, settings flags and isolation from
               drift / GIF-pause / lightbox are all verified
*.ps1          one-off measurement scripts used to derive the geometry
```
