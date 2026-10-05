# G&E Flooring website

A static, build-free site. The hero is a three.js scene of floating flooring boards that lean toward the cursor (drag on touch screens). Textures are cropped from the company's own job photos.

## Before you publish

Edit **`js/config.js`**:

| Key | What it does |
| --- | --- |
| `phone` | Shown in the header, hero and estimate section. Used for the `tel:` links. |
| `email` | Where the estimate form emails if no endpoint is set. |
| `formEndpoint` | Optional. A [Formspree](https://formspree.io) URL makes the form submit in the background. Leave empty to open the visitor's email app. |

Currently set to `(303) 875-6521` and `gregsfloorings@gmail.com`.

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
- three.js loads from cdnjs. To self-host, download `three.min.js` r128 into `js/` and change the script tag.
