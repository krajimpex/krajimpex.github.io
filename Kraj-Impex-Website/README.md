# Kraj Impex Diamonds — website

Static site: plain HTML, CSS and JavaScript, no build step. The 3D scenes use Three.js, loaded from the jsDelivr CDN (needs an internet connection). Upload the folder to any static host (Netlify, Cloudflare Pages, Vercel, cPanel).

## Preview locally

Double-click `index.html`, or run:

```bash
node serve.js
```

Then open http://localhost:5173.

## Pages

| File | Page |
|---|---|
| `index.html` | Home: Koh-i-Noor hero, dossier, crystal tiles, **3D diamond-set watch under a spotlight**, collections, statement |
| `collections.html` | "Kraj Impex Diamonds": Natural and Laboratory-grown collections (click to open; `#natural` / `#lab-grown`), 5 sample stones each with a 360° detail view, shapes, access code |
| `lab-grown.html` | **Scroll-driven 3D: how a diamond is grown (CVD), in 8 steps** |
| `craft.html` | Brilliance / fire / scintillation, rough-to-record steps |
| `house.html` | Vision, director, principles |
| `introduction.html` | Private-client and Trade & business enquiry forms (tabs; `#trade` opens the trade form; validated, **not connected yet**), address |

## Assets

- `assets/css/main.css`: all styles and design tokens (`:root`)
- `assets/js/main.js`: header, menu, scroll reveals, hero sparkle, crystal tiles, enquiry forms and tabs
- `assets/js/three-kit.js`: loads Three.js and shared 3D helpers, including the diamond shader
- `assets/js/watch3d.js`: the diamond-set watch (an original, unbranded design; the section shows text only without WebGL)
- `assets/js/collection.js`: the sample stones (data at the top of the file: edit `STONES` to list real stones), their cut geometry and the 360° viewer
- `assets/js/rubies3d.js`: the single antique cushion-cut red diamond behind "Rarity is the standard" (CSS ruby gradient without WebGL)
- `assets/js/growth.js`: the lab-grown sequence (falls back to a readable list without WebGL)
- `assets/img/koh-i-noor.png`: hero stone

After editing a CSS or JS file, raise the `?v=10` number in the HTML `<script>`/`<link>` tags so visitors' browsers fetch the new version.

## Deploying from GitHub (Cloudflare Pages)

This repository holds the source. Cloudflare Pages builds and publishes it on every change.

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → choose this repository.
2. Build settings: **Framework preset** None · **Build command** `node build.js` · **Build output directory** `dist`.
3. **Save and Deploy**, then **Custom domains** → add your domain.

To update the site, change files in GitHub (edit in the browser, or upload new versions); Cloudflare redeploys automatically within a minute or two.
## Publishing by upload (alternative)

```bash
node build.js
```

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Upload assets**.
2. Name the project (for example `krajimpex`) and upload the **dist** folder.
3. **Custom domains** → add your domain; Cloudflare issues the certificate.
4. To update later: run `node build.js` again and upload **dist** as a new deployment.

`_headers` (security policy, caching) and `404.html` are picked up automatically.

### Enquiry forms

Open `assets/js/main.js` and find `FORM_ENDPOINT` near the forms section.

- **Left empty** (as delivered): sending an enquiry opens WhatsApp with the message already written, addressed to +91 98201 24336. Make sure that number uses WhatsApp, or change `WHATSAPP`.
- **To receive enquiries by email**: create a free form at formspree.io, copy its address (`https://formspree.io/f/…`) into `FORM_ENDPOINT`, raise the `?v=` number, rebuild and upload. The security policy already allows formspree.io.

A hidden field quietly discards most spam bots.

### Security

`_headers` sets a strict Content-Security-Policy (this site, Google Fonts and the jsDelivr CDN for Three.js only; the one inline script is allowed by its hash), HSTS, no framing, no MIME sniffing, a strict referrer policy and a locked-down permissions policy. If you ever edit the import map in the pages, update its `sha256-…` hash in `_headers`.

## Before going live

1. **Collection stones**: the listings are illustrative. Edit `STONES` in `assets/js/collection.js` to list real stones and report numbers (and the `Example` badge if you no longer want it).
2. **Dossier figures** on the home page are an example record.
3. **Crystal tiles** on Home and Craft are drawn; swap the `<canvas class="lt">` elements for photographs when you have them.
4. Once the domain is live, add it to link previews (`og:url`, and an `og:image` with an absolute address).