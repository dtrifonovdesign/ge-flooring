# G&E Tile and Flooring website

A static, build-free site. The hero is a three.js scene of floating flooring boards that lean toward the cursor (drag on touch screens). Textures are cropped from the company's own job photos.

## Before you publish

Edit **`js/config.js`**:

| Key | What it does |
| --- | --- |
| `phone` | Shown in the header, hero and estimate section. Used for the `tel:` links. |
| `email` | Where the estimate form emails if no endpoint is set. |
| `formEndpoint` | Optional. A [Formspree](https://formspree.io) URL makes the form submit in the background. Leave empty to open the visitor's email app. |

Currently set to `(612) 324-9962` and `gregsfloorings@gmail.com`.

## Run locally

Browsers block WebGL textures from `file://`, so use any local server:

```bash
npx http-server -p 5173
```

Then open http://localhost:5173.

## Deploy on GitHub Pages

1. Create a repository and push this folder to the `main` branch.
2. Repository **Settings > Pages > Build and deployment**: Source = *Deploy from a branch*, Branch = `main` / `(root)`.
3. The site goes live at `https://<user>.github.io/<repo>/`. All paths are relative, so it works in a subfolder.

## Before you add a custom domain

The address of the site appears in a few places. Search the project for `dtrifonovdesign.github.io/ge-flooring` and replace it with the new domain (keep the `https://`):

- `index.html`: the canonical link, the `og:url` and `og:image` tags, and the JSON-LD block
- `privacy.html`: the canonical link
- `sitemap.xml`: both `<loc>` lines
- `robots.txt`: the `Sitemap:` line

The phone number and email also appear once in the JSON-LD block in `index.html` (`telephone`, `email`). Everything else reads them from `js/config.js`. After the domain is live, submit `/sitemap.xml` in Google Search Console.

## Site basics

- **Privacy policy** (`privacy.html`): no cookies, analytics or ad trackers. If you add any (Google Analytics, a chat widget, a map embed), update this page first.
- **404 page** (`404.html`): GitHub Pages and Cloudflare Pages both serve it automatically for missing addresses.
- **Fonts and the 3D library** are hosted in the project (`assets/fonts`, `js/vendor`), so visitors make no requests to Google or a CDN.
- **Accessibility:** checked with axe-core (WCAG 2.2 AA) on all three pages with zero violations. Keep text contrast at 4.5:1 or better when changing colors, and keep alt text on every photo.

## Where things are

```
index.html          page content
css/style.css       brand tokens (Oak Gold, Light Gold, Charcoal, Cream; Jost) and layout
js/boards.js        the floating-boards scene (board list is DEFS at the top)
js/main.js          phone/email fill-in, scroll reveal, estimate form
js/config.js        phone, email, form endpoint
assets/brand/       logos from the brand kit (light and reversed)
assets/tex/         swatches wrapped onto the floating boards
assets/img/         gallery photos
```

## Swapping or adding boards

Drop a flat photo crop in `assets/tex/` (about 768x256 for a plank, 512x512 for a tile), then add a line to `DEFS` in `js/boards.js` with its size, edge color and hover label.

## Notes

- The boards pause when the hero is off screen or the tab is hidden.
- With `prefers-reduced-motion` the scene renders once, still. Without WebGL it falls back to three static swatches.
- three.js r128 is bundled in `js/vendor/three.min.js`; no CDN is used.
