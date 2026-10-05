# Kraj Impex Diamonds — website

Static site: plain HTML, CSS and JavaScript. The 3D scenes use Three.js, loaded from the jsDelivr CDN. It is published with GitHub Pages at **https://krajimpex.github.io/**.

## Editing the site

Everything lives in this `Kraj-Impex-Website` folder on the `main` branch. Any change saved to `main` republishes the site automatically within about a minute (progress shows in the repository's **Actions** tab).

- **Change text on a page:** open the page's `.html` file on GitHub, click the pencil icon (**Edit this file**), change the words between the tags, then **Commit changes**.
- **Replace an image:** open `assets/img`, choose **Add file → Upload files**, and upload the new image with the same file name.
- **Bigger changes:** press `.` on the repository page to open the full editor in your browser, or clone the repository and edit on your computer.

To preview on your computer, double-click `index.html`.

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

After editing a CSS or JS file, raise the `?v=11` number in the HTML `<script>`/`<link>` tags so visitors' browsers fetch the new version.

### Enquiry forms

Open `assets/js/main.js` and find `FORM_ENDPOINT` near the forms section.

- **Left empty** (as delivered): sending an enquiry opens WhatsApp with the message already written, addressed to +91 98201 24336. Make sure that number uses WhatsApp, or change `WHATSAPP`.
- **To receive enquiries by email**: create a free form at formspree.io, copy its address (`https://formspree.io/f/…`) into `FORM_ENDPOINT`, raise the `?v=` number and commit.

A hidden field quietly discards most spam bots.

## Before going live

1. **Collection stones**: the listings are illustrative. Edit `STONES` in `assets/js/collection.js` to list real stones and report numbers (and the `Example` badge if you no longer want it).
2. **Dossier figures** on the home page are an example record.
3. **Crystal tiles** on Home and Craft are drawn; swap the `<canvas class="lt">` elements for photographs when you have them.
4. Once the domain is live, add it to link previews (`og:url`, and an `og:image` with an absolute address).