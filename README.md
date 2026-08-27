# Refresh Wellbeing — static clone

A complete static copy of [refreshwellbeing.com.au](https://refreshwellbeing.com.au),
with the homepage hero video changed to a clean, silent, looping background
video — no play button, no player chrome, nothing clickable.

Everything lives under [`site/`](site/), which is the web root.

## What's here

| | |
|---|---|
| Pages | Home, Blog, Bookings, Group Classes, Private Classes, Spa Treatments, Our Team, Our Story, Our Space, Contact |
| Blog posts | 33 posts, plus the Yoga category and author archives |
| Assets | All theme, plugin and upload assets (CSS, JS, images, fonts) served locally |

The clone is fully self-contained: it renders with no calls back to the live
WordPress site. The only outbound request is the hero video (see below).

## Running it

```bash
npx http-server site -p 8080
# then open http://localhost:8080
```

Any static host works — GitHub Pages, Netlify, Cloudflare Pages, nginx, S3.
Point the document root at `site/`.

## The homepage hero video

The original hero was a Slider Revolution 7 slide backed by a **YouTube embed**
(video `dBmETCZ0RgE`). YouTube painted its own interface over the footage — the
large centre play button, the title bar, and the share / watch-later buttons —
which is the overlay you wanted gone.

That slider has been replaced with a plain background video block:

- `site/assets/rw-hero-video.css` — layout and sizing
- `site/assets/rw-hero-video.js` — optional swap to a self-hosted file
- `site/assets/hero/hero-poster.jpg` — first-frame poster

It ships as a YouTube background with every control switched off
(`controls=0`, `modestbranding=1`, `disablekb=1`, `fs=0`, `iv_load_policy=3`)
and `pointer-events: none`, so no chrome is drawn and the video cannot be
paused, scrubbed or clicked. It autoplays muted and loops.

Heights match the original slider exactly (700 / 768 / 960 / 720 px across
breakpoints), so everything below the hero sits where it always did.

### Recommended: self-host the video

A YouTube embed is never *guaranteed* chrome-free — some mobile browsers and
data-saver modes can still refuse muted autoplay and fall back to a poster with
a play button. The only way to guarantee zero chrome everywhere is to serve the
file yourself.

Drop your video in as `site/assets/hero/hero.mp4`, then point the hero at it —
one attribute in `site/index.html`:

```html
<div class="rw-hero-video" role="presentation" data-local-video="assets/hero/hero.mp4"
```

`rw-hero-video.js` then swaps the iframe for a native
`<video autoplay muted loop playsinline>` with no `controls` attribute — zero
chrome, guaranteed, on every browser. If the file is missing or unreadable the
YouTube background stays in place, so a wrong path can never blank the hero.

## Notes

- Forms (Contact, WPForms) are static — they have no PHP backend to post to.
- Booking links still point at the live WellnessLiving booking system, and the
  Bookings page keeps its original third-party embed — both are external on the
  live site too.
- Elementor's dynamically-loaded widget bundles were fetched and its asset URL
  rewritten to a relative path, so no page calls back to the live site.
- Google Fonts still load from Google's CDN, exactly as the live site does.
- Content was captured from the live site; re-run the mirror to refresh it.
