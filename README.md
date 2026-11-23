# Serop Kizirian Development

Website demo for Serop Kizirian Development (Instagram `@seropkiziriandevelopment`), a real estate developer in Saida building lifestyle luxury villas. Static HTML, CSS and JavaScript, no build step.

Design taken from their logo: petrol blue fields, pale-gold line work drawn from the logo's horizon arcs, Marcellus headlines and Manrope text.

## Tabs

One page, routed by hash:

| Hash | View |
|---|---|
| `#home` | Hero, facts strip, project cards, customization section, what every villa comes with |
| `#projects` | All projects |
| `#<project-slug>` | Project page: specs, gallery with full-screen viewer |
| `#design` | Design your villa: pick facade, frames, floors, kitchen, outdoor, bedrooms and extras; live drawing and material board; brief sent to WhatsApp |
| `#about` | Story, the four steps from site visit to payment plan, both offices |
| `#contact` | Phone numbers, offices with map links, Book a site visit form |
| `#saved` | The visitor's shortlist (hearted projects, kept in their browser) |
| `#sell` | Home, scrolled to the land owners' form |

The opening intro (logo builds, arcs draw, curtain lifts) plays once per browser session and is skipped for reduced motion.

Home also has a villa finder (goal + location → filtered projects), "How we can help" services, and a land owners' form (sell or develop together). The Projects page has location filters, a saved filter and a schematic map of the project locations.

## Arabic

The toggle in the header switches the whole site to Arabic with a right-to-left layout and Arabic fonts (IBM Plex Sans Arabic, Noto Kufi Arabic). All copy lives in `assets/js/i18n.js` as English → Arabic pairs; WhatsApp messages are sent in the visitor's language. The choice is remembered in the visitor's browser. Confirm the Arabic spelling of "Baasiri Street" with the client.

Every "Book a site visit" button opens a form that sends name, phone, project, preferred day and time to WhatsApp (+961 81 309 384). Nothing is stored on a server.

## Run locally

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## Adding a project's content

1. Put photos in `assets/media/<project-slug>/`, each as `NN.webp` (full, about 1600 px wide) and `NN-sm.webp` (720 px wide).
2. Register each photo in `SK_MEDIA` in `assets/js/data.js` with `src`, `thumb`, `width`, `height`, `alt`, and optionally `lqip` (tiny blurred preview as a data URI).
3. In `SK_PROJECTS`, set the project's `coverId`, `galleryIds`, `description` and `facts` (for example `["Area", "450 m²"]`).

A project with no photos shows a gold line drawing of a villa instead of an empty box.

Videos (for example Instagram Reels) register the same way with `type: "video"`, `src: "NN.mp4"` and `poster: "NN-poster.webp"`. Cards show the poster, the project cover plays muted on loop, and the gallery opens it with controls.

Add each project's Arabic title, location and summary to `assets/js/i18n.js`, and set its approximate `pin: [lat, lon]` for the map.

## Going live

- Deploy the repo on Vercel (no build step) and connect the client's domain.
- Turn on **Analytics** in the Vercel project: the page loads the visit counter only on the live domain.
- Change `og:image` in `index.html` to the full URL (for example `https://their-domain.com/assets/img/og-image.jpg`) so WhatsApp and Instagram show the preview image.

## Files

| Path | What it is |
|---|---|
| `index.html` | All views, intro, dialogs |
| `assets/css/site.css` | All styles |
| `assets/js/data.js` | Photos, projects, contact details, map pins |
| `assets/js/i18n.js` | English → Arabic copy and the language switch |
| `assets/js/site.js` | Engine: routing, rendering, gallery, lightbox, forms, studio, map, intro |
| `assets/img/` | Logo mark in gold and navy, cut from the Instagram profile picture; link preview image |
| `assets/media/renders/` | Villa renders from their Instagram posts |
