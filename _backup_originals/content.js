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
      "edge": "assets/about-edge.png"
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
    {
      "n": 8,
      "type": "image",
      "src": "assets/pics&gifs/8.gif",
      "w": 1400,
      "h": 788,
      "caption": "",
      "alt": "GRAPHIC DESIGN PORTFOLIO 2026 — image 8"
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
