# Studio Desk sync

The Studio Desk is a published Artifact that edits the site's changeable
content — testimonials, yoga classes and passes, spa treatments, retreat
workshops. It writes to its own store; this folder turns what it publishes
back into the static pages.

    https://claude.ai/code/artifact/3c4138c6-4d19-4d12-8f5e-73ddf5e3621b

## Applying a publish

Read the `published` object out of the artifact's store into a JSON file,
then:

    python3 tools/rw_publish.py content.json --check   # report only
    python3 tools/rw_publish.py content.json           # write

Then commit and push; GitHub Pages redeploys on its own.

## What it touches

Only the managed regions, and nothing else in the file:

| Region                     | Files                                        |
|----------------------------|----------------------------------------------|
| `ul.rw-quotes__track`      | `index.html`                                 |
| `h3.rw-classes__group` runs and their grids | `bookings/index.html`, `bookings.html`, `spa-treatments/index.html`, `retreats/index.html` |
| `ul.rw-passes`             | `bookings/index.html`, `bookings.html`       |

`bookings.html` and `bookings/index.html` are the same page at two depths and
are always written together.

## Guarantees worth keeping

- **Round-trips clean.** Applying the current content back over the pages is
  a no-op on every file except `index.html`, where it drops the pre-baked
  marquee clones that `rw-quotes.js` regenerates at runtime anyway.
- **Idempotent.** Running twice changes nothing the second time.
- **Escaping is handled.** Text keeps its apostrophes raw to match the rest
  of the file; `&` becomes `&amp;`; the Book link's screen-reader label is
  derived from the name (`&` read as "and") so it cannot drift.
- **Empty rows are dropped**, and a group left with no cards is dropped with
  its heading rather than left as a bare title.

`content.seed.json` is the content as it stood when the tool was built —
useful as a reference or to restore a known-good state.
