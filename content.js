/* =====================================================================
 *  EDIT EVERYTHING HERE.
 *  This file is the single source of truth for the whole site.
 *  Change text, swap image URLs, reorder or delete modules,
 *  and tweak animation settings. Then just reload index.html.
 *
 *  Every image below is a local file in assets/pics&gifs/ — nothing is
 *  loaded from the Behance CDN anymore. w/h only drive the layout box
 *  (the aspect ratio); they are the real pixel sizes of each file.
 * ===================================================================== */

const CONTENT = {
  "meta": {
    "title": "GRAPHIC DESIGN PORTFOLIO 2026",
    "description": "This portfolio showcases selected works created throughout 2025–2026.\n\nEvery project reflects my approach to solving visual problems through strategy, storytelling, and design. Thank you for taking the time to explore my work.\n\nLet's create something INSANE!"
  },
  "modules": [
    {
      "n": 1,
      "type": "image",
      "src": "assets/pics&gifs/1.gif",
      "w": 1400,
      "h": 788,
      "caption": "",
      "alt": "GRAPHIC DESIGN PORTFOLIO 2026 — image 1"
    },
    /* --------------------------------------------------------------
     *  MODULE 2 — the "HELLO" about page.
     *  This one is live HTML, not an image, so every line below is
     *  editable text. Edit and reload.
     * -------------------------------------------------------------- */
    {
      "n": 2,
      "type": "about",
      "w": 1400,
      "h": 788,

      "greeting": "HELLO",

      "intro": {
        "lead": "Hi, I’m Harshith Sriramoju",
        "body": "A Video Editor and Cinematographer passionate about crafting powerful visual stories across both long-form and short-form content. Proficient in Premiere Pro, After Effects, Photoshop, and Illustrator, I have a strong hand in motion graphics, VFX, and 3D creative works. I collaborate with creators and brands to transform bold ideas into seamless, high-impact cinematic experiences."
      },

      "education": {
        "heading": "EDUCATION",
        "entries": [
          { "degree": "Bachelor of Engineering", "school": "Matrusri engineering College | 2025-2029" }
        ]
      },

      "experience": {
        "heading": "EXPERIENCE",
        "entries": [
          { "period": "2023-Present", "role": "Video Editor", "org": "" },
          { "period": "2025-Present", "role": "Cinematographer", "org": "" }
        ]
      },

      "skills": {
        "heading": "SKILLS",
        "items": [
          { "key": "ps", "name": "Photoshop" },
          { "key": "ai", "name": "Illustrator" },
          { "key": "ae", "name": "After Effects" },
          { "key": "pr", "name": "Premiere Pro" }
        ]
      },

      /* Torn-paper footer sliced from the original slide — paper, red
         shape and portrait. Swap this file to change the artwork. */
      "edge": "assets/about-edge.png",

      /* Looping 3D clip that plays inside the empty selection frame. */
      "fig": "assets/pics&gifs/3dfig.mp4"
    },
    {
      "n": 3,
      "type": "image",
      "src": "assets/pics&gifs/3.gif",
      "w": 1400,
      "h": 788,
      "caption": "",
      "alt": "GRAPHIC DESIGN PORTFOLIO 2026 — image 3"
    },
    {
      "n": 4,
      "type": "image",
      "src": "assets/pics&gifs/4.png",
      "w": 1400,
      "h": 656,
      "caption": "",
      "alt": "GRAPHIC DESIGN PORTFOLIO 2026 — image 4"
    },
    {
      "n": 5,
      "type": "image",
      "src": "assets/pics&gifs/5.gif",
      "w": 1400,
      "h": 55,
      "caption": "",
      "alt": "GRAPHIC DESIGN PORTFOLIO 2026 — image 5"
    },
    {
      "n": 6,
      "type": "image",
      "src": "assets/pics&gifs/6.png",
      "w": 1400,
      "h": 973,
      "caption": "",
      "alt": "GRAPHIC DESIGN PORTFOLIO 2026 — image 6"
    },
    {
      "n": 7,
      "type": "image",
      "src": "assets/pics&gifs/7.gif",
      "w": 1400,
      "h": 55,
      "caption": "",
      "alt": "GRAPHIC DESIGN PORTFOLIO 2026 — image 7"
    },
    /* --------------------------------------------------------------
     *  MODULE 8 — "LOGOS & MARKS", rebuilt as a LIVE VIDEO GRID.
     *  It used to be a single flat GIF (assets/pics&gifs/8.gif, which
     *  is still on disk, just no longer referenced). Now it is six
     *  tiles in a bento shape and each tile plays its video while the
     *  cursor is on it. Nothing plays on its own.
     *
     *  You only edit the six entries below: file names, titles, alt
     *  text. The shape of the grid (gaps, ratios, padding, which tile
     *  sits where) lives entirely in css/styles.css under `.vgrid`.
     *
     *  "ratio" is "9:16" (tall) or "16:9" (wide) and must stay as
     *  shown below — tiles 1 and 3 tall, 2/4/5/6 wide — otherwise the
     *  top and bottom edges of the bento stop lining up.
     *
     *  "poster" points at the small optimised WebP in
     *  assets/thumbnails/optimized/. The originals are untouched in
     *  assets/thumbnails/. Point "poster" back at an original any time
     *  (it will just be heavier).
     *
     *  To reorder, move a whole object — the tiles fill the bento in
     *  array order 1 to 6.
     * -------------------------------------------------------------- */
    {
      "n": 8,
      "type": "videogrid",
      "w": 1400,
      "h": 1112,

      "tiles": [
        { "title": "Short-form edit",   "ratio": "9:16", "video": "assets/videos/shortformvid.MP4", "poster": "assets/thumbnails/optimized/shortformimg.webp", "alt": "Short-form video editing showreel" },
        { "title": "SaaS promo",        "ratio": "16:9", "video": "assets/videos/saasvid.MP4",      "poster": "assets/thumbnails/optimized/saasimg.webp",      "alt": "SaaS product promo video" },
        { "title": "Viral edit",        "ratio": "9:16", "video": "assets/videos/viralvid.MP4",     "poster": "assets/thumbnails/optimized/viralimg.webp",     "alt": "Viral vertical video edit" },
        { "title": "Motion graphics",   "ratio": "16:9", "video": "assets/videos/motionvid.MP4",    "poster": "assets/thumbnails/optimized/motionimg.webp",    "alt": "Motion graphics piece" },
        { "title": "VFX work",          "ratio": "16:9", "video": "assets/videos/vfxvid.mp4",       "poster": "assets/thumbnails/optimized/vfximg.webp",       "alt": "Visual effects breakdown" },
        { "title": "Jaaz edits",        "ratio": "16:9", "video": "assets/videos/jaazvid.MP4",      "poster": "assets/thumbnails/optimized/jaazimg.webp",       "alt": "Jaaz video editing showreel" }
      ]
    },
    {
      "n": 9,
      "type": "image",
      "src": "assets/pics&gifs/9.gif",
      "w": 1400,
      "h": 55,
      "caption": "",
      "alt": "GRAPHIC DESIGN PORTFOLIO 2026 — image 9"
    },
    {
      "n": 10,
      "type": "image",
      "src": "assets/pics&gifs/10.png",
      "w": 1400,
      "h": 973,
      "caption": "",
      "alt": "GRAPHIC DESIGN PORTFOLIO 2026 — image 10"
    },
    {
      "n": 11,
      "type": "image",
      "src": "assets/pics&gifs/11.gif",
      "w": 1400,
      "h": 55,
      "caption": "",
      "alt": "GRAPHIC DESIGN PORTFOLIO 2026 — image 11"
    },
    {
      "n": 12,
      "type": "image",
      "src": "assets/pics&gifs/12.gif",
      "w": 1400,
      "h": 55,
      "caption": "",
      "alt": "GRAPHIC DESIGN PORTFOLIO 2026 — image 12"
    },
    {
      "n": 13,
      "type": "image",
      "src": "assets/pics&gifs/13.png",
      "w": 1400,
      "h": 973,
      "caption": "",
      "alt": "GRAPHIC DESIGN PORTFOLIO 2026 — image 13"
    },
    {
      "n": 14,
      "type": "image",
      "src": "assets/pics&gifs/14.gif",
      "w": 1400,
      "h": 55,
      "caption": "",
      "alt": "GRAPHIC DESIGN PORTFOLIO 2026 — image 14"
    },
    {
      "n": 15,
      "type": "image",
      "src": "assets/pics&gifs/15.gif",
      "w": 1400,
      "h": 788,
      "caption": "",
      "alt": "GRAPHIC DESIGN PORTFOLIO 2026 — image 15"
    },
    {
      "n": 16,
      "type": "image",
      "src": "assets/pics&gifs/16.gif",
      "w": 1400,
      "h": 55,
      "caption": "",
      "alt": "GRAPHIC DESIGN PORTFOLIO 2026 — image 16"
    },
    {
      "n": 17,
      "type": "image",
      "src": "assets/pics&gifs/17.png",
      "w": 1400,
      "h": 973,
      "caption": "",
      "alt": "GRAPHIC DESIGN PORTFOLIO 2026 — image 17"
    },
    {
      "n": 18,
      "type": "image",
      "src": "assets/pics&gifs/18.gif",
      "w": 1400,
      "h": 55,
      "caption": "",
      "alt": "GRAPHIC DESIGN PORTFOLIO 2026 — image 18"
    },
    {
      "n": 19,
      "type": "image",
      "src": "assets/pics&gifs/19.png",
      "w": 1400,
      "h": 1704,
      "caption": "",
      "alt": "GRAPHIC DESIGN PORTFOLIO 2026 — image 19"
    },
    {
      "n": 20,
      "type": "image",
      "src": "assets/pics&gifs/20.png",
      "w": 1400,
      "h": 788,
      "caption": "",
      "alt": "GRAPHIC DESIGN PORTFOLIO 2026 — image 20"
    }
  ]
};
