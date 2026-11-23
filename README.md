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
| `#about` | Story, the four steps from site visit to payment plan, both offices |
| `#contact` | Phone numbers, offices with map links, Book a site visit form |

The opening intro (logo builds, arcs draw, curtain lifts) plays once per browser session and is skipped for reduced motion.

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

## Files

| Path | What it is |
|---|---|
| `index.html` | All views, intro, dialogs |
| `assets/css/site.css` | All styles |
| `assets/js/data.js` | Photos, projects, contact details |
| `assets/js/site.js` | Engine: routing, rendering, gallery, lightbox, booking form, intro |
| `assets/img/` | Logo mark in gold and navy, cut from the Instagram profile picture |
| `assets/media/renders/` | Villa renders from their Instagram posts |
