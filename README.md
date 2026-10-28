# GRAPHIC DESIGN PORTFOLIO 2026

A dependency-free static portfolio site. Open `index.html` in a browser —
no build step, no server required.

```
index.html      page shell (module stream, lightbox, back-to-top)
settings.js     ← ANIMATIONS & EFFECTS. Edit this to change how things move.
content.js      ← TEXT, IMAGES, VIDEOS. Edit this to change what's shown.
css/styles.css  styling + keyframes
js/app.js       renders content.js and drives the effects from settings.js
assets/pics&gifs/    the images shown on the page
assets/videos/       the six clips in the video grid
assets/thumbnails/   optimised poster stills (see below)
assets/og-image.jpg  1200x630 social-card image (see "SEO" below)
robots.txt          crawler rules + sitemap pointer
sitemap.xml         the one URL on the site
googlee484d….html   Google Search Console proof-of-ownership (do not delete)
```

## What's on the page

A vertical stream of 13 modules, laid out in `content.js` in file order.
Each one is a full-width block at its own aspect ratio:

| # | Type | Shown as |
|---|------|----------|
| 1, 2, 3 | `image` | looping MP4 motion pages |
| 4 | `clip` | the showreel — still card, plays on hover |
| 5, 7, 12, 14 | `image` | thin animated banner strips (MP4) |
| 6, 13 | `image` | stills (WebP) |
| 15 | `image` | the `new15` motion page (MP4) |
| 8 | `videogrid` | six tiles in a bento grid |
| 20 | `thanks` | the GRACIAS plate with live contact links |

Plus the project title and description, used only for the browser tab and
the `<meta name="description">` tag — nothing is rendered above or below
the images. The page opens straight on image 1.

## Editing it

### Text
Everything textual lives in `content.js`:

```js
meta.title        // "Harshith Sriramoju — Graphic Design & Video Editing Portfolio"
meta.description  // one sentence, under 160 chars (see "SEO" below)
modules[n].caption
modules[n].alt
```

### Images

Every image module points straight at a local file:

```js
{ "n": 1, "type": "image", "src": "assets/pics&gifs/new1.mp4", "w": 1400, "h": 788, "alt": "…" }
```

The file extension decides how the module renders: a video extension
(`.mp4`, `.webm`, `.mov`) becomes a muted, looping `<video>` that plays
while it is on screen and stops when it is not; anything else stays an
`<img>`. The eight animated pages were converted to MP4 — the same
pictures as before, but roughly 73% lighter and decoded off the main
thread.

Drop a file into `assets/pics&gifs/`, add an object like the above to
`content.js`, and reload. `w`/`h` are only the aspect ratio (any unit
works — they drive the layout box).

`settings.media.preferLocal` is off because `src` is already local; turn
it back on if you ever want `assets/…` to shadow a remote URL again.

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

### The showreel (block 4)

```js
{
  "n": 4,
  "type": "clip",
  "src": "assets/pics&gifs/showreel.mp4",
  "poster": "assets/thumbnails/optimized/showpic.webp",
  "ratio": "16:9",
  "w": 1400, "h": 788
}
```

A still card that plays its video while the cursor is on it, and only
then. Nothing autoplays, and the `<video>` is built with no `src`, so a
page load transfers **zero video bytes**.

`poster` points at a small optimised WebP — the full-size original was 9x
heavier for no visible gain, so it is not shipped. The box is
ratio-locked, so pointing `poster` at any other file shifts nothing.

### The video grid (block 8)

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
effect, motion playback and the lightbox all ignore them, and the
lightbox's arrow keys skip straight past them.

#### Geometry

The grid is a fixed canvas that scales like an image — it never reflows
between 761px and 1400px+, and stacks into one column under 760px.

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

`assets/thumbnails/optimized/` holds WebP copies of the poster stills at
quality 85, sized to twice their display width — about 28–61 KB each.
Point a tile's `poster` at a larger source any time if you would rather
serve the full-size file.

### Animations and effects
`settings.js` — every effect is a labelled block you can switch off or tune:

- `reveal` — modules fade + rise in on scroll (distance, duration, easing, stagger)
- `drift` — slow Ken-Burns scale on images as they pass through the viewport
- `lazy` / `media.fadeIn` — lazy loading with a cross-fade
- `motion.pauseWhenHidden` — attaches and plays a motion page only as it
  nears the viewport, and pauses it again once it is gone (the initial
  load therefore pulls exactly one video)
- `lightbox` — click any image to zoom; arrow keys and Esc navigate
- `chrome` — back-to-top button, smooth scroll
- `showreel` — page 4's hover-to-play clip (see above)
- `videoGrid` — the six-tile video grid: hover/tap playback, sound policy,
  preload distance, rewind-on-leave, pause-on-scroll-away (see above)

Setting `enabled: false` on any block removes that behaviour entirely. The
`prefers-reduced-motion` media query switches off the reveal, drift and
smooth-scroll effects, and holds each motion page on its first frame
instead of playing it.

## SEO

The page is almost entirely images, so the text Google has to work with is
the `<head>` and nothing else. That makes three things load-bearing:

**`index.html` carries the title and description statically.**
`content.js` re-applies the same two strings at runtime, but the HTML is
what a crawler sees if it never executes the scripts — so the values exist
in both places and `tools/check.js` fails the run if they drift apart. The
description is a single sentence under 160 characters, because Google
truncates anything longer. Change the wording in **both** files.

**Keep the URL stable.** `index.html` declares a canonical URL, and
`sitemap.xml` / `robots.txt` both repeat it. If the site ever moves to a
custom domain, update all four places plus the JSON-LD block — `check.js`
asserts the canonical, sitemap and robots entries agree.

**Never delete `googlee484d76eb50ce296.html`.** It is the Search Console
proof-of-ownership for `https://harshithsriramoju.vercel.app/`. Removing or
renaming it eventually un-verifies the property. It must stay at the repo
root, since the repo root is the web root.

`assets/og-image.jpg` is the 1200x630 card shown when the link is shared
on WhatsApp, Slack, LinkedIn or X — a frame from the hero clip, cover-cropped
and JPEG-compressed. Replace it with any 1200x630 image and every
`og:image` / `twitter:image` tag follows, no other edits needed.

Structured data (`ProfilePage` + `Person`) sits at the bottom of
`index.html`, describing who the page belongs to; it is what stops Google
having to guess a name from a picture-only page.

## tools/

Dev-only helpers, nothing here affects the page:

```
check.js       node tools/check.js — every class app.js emits has CSS,
               every asset content.js references exists, the hero
               preload matches module 1 (including as=/type=), the motion
               pages really render as <video>, and the
               videogrid's tiles, ratios, videos, posters, CSS classes,
               settings flags and isolation from drift / motion playback /
               lightbox are all verified
preview.html   renders one module on its own at full canvas size.
               Pick it with the hash: #videogrid (default), #8 …
compare.ps1    measures a preview render against the source slide
*.ps1          one-off measurement scripts used to derive the geometry
```
