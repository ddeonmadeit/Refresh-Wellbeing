#!/usr/bin/env python3
"""
Refresh Wellbeing - apply Studio Desk content to the static pages.

The Studio Desk (a published Artifact) writes a JSON snapshot when Evonne
presses Publish. This takes that snapshot and rewrites only the managed
regions of the HTML - the testimonial track, the class/treatment grids and
the pass list. Everything outside those regions is left byte for byte alone,
so the hand-tuned markup around them is never disturbed.

Usage:
    rw_publish.py content.json [--check]

--check reports what would change without writing.
"""
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Yoga is served from two identical files at different depths.
TARGETS = {
    "testimonials": ["index.html"],
    "yoga":         ["bookings/index.html", "bookings.html"],
    "treatments":   ["spa-treatments/index.html",
                     "spa-treatments/massage/index.html",
                     "spa-treatments/facial-treatments/index.html"],
    "retreats":     ["retreats/index.html"],
}

# Treatments are split across a hub and two subpages, so a group goes to the
# page that owns it rather than all of them landing on one listing. A group
# named here is written only to its page; anything unlisted stays on the hub.
GROUP_PAGES = {
    "Massages":    "spa-treatments/massage/index.html",
    "Facials":     "spa-treatments/facial-treatments/index.html",
    "Brow & Lash": "spa-treatments/facial-treatments/index.html",
}

T = "\t"


def esc(s):
    """Escape for HTML text content. Quotes are left alone: the pages carry
    apostrophes raw, and escaping them would rewrite lines nobody edited."""
    return html.escape((s or "").strip(), quote=False)


def esc_attr(s):
    """Escape for an attribute value - quotes and ampersands included."""
    return html.escape((s or "").strip(), quote=True)


def sr_label(name):
    """The visually hidden suffix on a Book link. Derived from the name rather
    than stored, so it can never drift out of sync with it."""
    return esc((name or "").replace("&", "and"))


def render_quotes(items, depth):
    p = T * depth
    out = []
    for q in items:
        text, name = (q.get("text") or "").strip(), (q.get("name") or "").strip()
        if not text and not name:
            continue
        out.append(f'{p}<li class="rw-quote">')
        out.append(f'{p}{T}<blockquote class="rw-quote__text">{esc(text)}</blockquote>')
        out.append(f'{p}{T}<p class="rw-quote__name">{esc(name)}</p>')
        out.append(f"{p}</li>")
    return "\n".join(out)


def render_card(c, depth):
    p = T * depth
    name = (c.get("name") or "").strip()
    out = [f'{p}<li class="rw-class">']
    out.append(f'{p}{T}<h4 class="rw-class__name">{esc(name)}</h4>')
    if (c.get("when") or "").strip():
        out.append(f'{p}{T}<p class="rw-class__when">{esc(c["when"])}</p>')
    out.append(
        f'{p}{T}<p class="rw-class__meta">'
        f'<span class="rw-class__len">{esc(c.get("length"))}</span>'
        f'<span class="rw-class__price">{esc(c.get("price"))}</span></p>'
    )
    if (c.get("desc") or "").strip():
        out.append(f'{p}{T}<p class="rw-class__desc">{esc(c["desc"])}</p>')
    out.append(
        f'{p}{T}<a class="rw-class__book" href="{esc_attr(c.get("book_url"))}" '
        f'target="_blank" rel="noopener">Book'
        f'<span class="rw-class__sr"> {sr_label(name)}</span></a>'
    )
    out.append(f"{p}</li>")
    return "\n".join(out)


def render_groups(groups, depth):
    """Group heading + grid, in the order the Studio Desk left them. A group
    that has been emptied is dropped rather than left as a bare heading."""
    p = T * depth
    blocks = []
    for g in groups:
        cards = [c for c in g.get("cards", []) if (c.get("name") or "").strip()]
        if not cards:
            continue
        b = [f'{p}<h3 class="rw-classes__group">{esc(g.get("group"))}</h3>']
        b.append(f'{p}<ul class="rw-classes__grid">')
        b.append("\n".join(render_card(c, depth + 1) for c in cards))
        b.append(f"{p}</ul>")
        blocks.append("\n".join(b))
    return "\n\n".join(blocks)


def render_passes(passes, depth):
    p = T * depth
    out = []
    for x in passes:
        if not (x.get("name") or "").strip():
            continue
        out.append(
            f'{p}<li class="rw-pass">'
            f'<span class="rw-pass__name">{esc(x.get("name"))}</span>'
            f'<span class="rw-pass__price">{esc(x.get("price"))}</span></li>'
        )
    return "\n".join(out)


def indent_of(src, idx):
    """Tabs on the line that `idx` sits on - so generated markup lands at the
    same depth as the markup it replaces."""
    line_start = src.rfind("\n", 0, idx) + 1
    run = 0
    while line_start + run < len(src) and src[line_start + run] == "\t":
        run += 1
    return run


def replace_between(src, open_pat, close_tag, build):
    """Swap the inner content of the first region matching open_pat."""
    m = re.search(open_pat, src)
    if not m:
        return src, False
    start = m.end()
    end = src.find(close_tag, start)
    if end == -1:
        return src, False
    depth = indent_of(src, m.start()) + 1
    body = build(depth)
    closing_indent = T * (depth - 1)
    new = "\n" + body + "\n" + closing_indent if body else "\n" + closing_indent
    if src[start:end] == new:
        return src, False
    return src[:start] + new + src[end:], True


class RegionMissing(Exception):
    """A managed region the file is supposed to have could not be located.
    Raised rather than skipped: a silent miss looks exactly like 'nothing to
    change' and would let a publish quietly do nothing."""


def apply_quotes(src, data):
    return replace_between(
        src, r'<ul class="rw-quotes__track">', "</ul>",
        lambda d: render_quotes(data.get("testimonials", []), d),
    )


# The run of group headings and their grids, up to whatever follows the last
# one. The trailing markup differs per page - a <p> or <div> call to action, the
# passes list, or simply the end of the wrapper - so all of them are listed. A
# missing terminator used to make this silently match nothing, which read as
# "unchanged" and quietly skipped the page; find_region_or_fail now shouts.
GRID_REGION = re.compile(
    r'(<h3 class="rw-classes__group">.*</ul>)(?=\s*(?:<(?:p|div) class="rw-classes__cta"|'
    r'<p class="rw-classes__note"|<h3 class="rw-passes__title"|<ul class="rw-passes"|'
    r'</section>|</div>))',
    re.S,
)


def apply_groups(src, groups):
    """Replace the whole run of group+grid blocks in one go, so groups can be
    added, removed or reordered - not just their contents."""
    m = GRID_REGION.search(src)
    if not m:
        if not groups:
            return src, False   # nothing to place and nowhere to place it
        raise RegionMissing("no rw-classes__group region found")
    depth = indent_of(src, m.start())
    # Take the region from the start of its line, so the leading tabs already
    # in the file are replaced rather than added to.
    line_start = src.rfind("\n", 0, m.start(1)) + 1
    new = render_groups(groups, depth)
    if src[line_start:m.end(1)] == new:
        return src, False
    return src[:line_start] + new + src[m.end(1):], True


def apply_passes(src, passes):
    return replace_between(
        src, r'<ul class="rw-passes">', "</ul>",
        lambda d: render_passes(passes, d),
    )


def apply_to_file(path, key, data, check):
    p = ROOT / path
    if not p.exists():
        return f"missing {path}", False
    src = original = p.read_text(encoding="utf-8")
    touched = []

    try:
        return _apply(p, path, key, data, check, src, original, touched)
    except RegionMissing as e:
        return f"{path}: PROBLEM - {e}", False


def _apply(p, path, key, data, check, src, original, touched):
    if key == "testimonials":
        src, ch = apply_quotes(src, data)
        if ch:
            touched.append("testimonials")
    else:
        section = data.get(key) or {}
        groups = section.get("groups", [])
        if key == "treatments":
            groups = [g for g in groups
                      if GROUP_PAGES.get(g.get("group"), TARGETS["treatments"][0]) == path]
        src, ch = apply_groups(src, groups)
        if ch:
            touched.append("groups")
        if "passes" in section:
            src, ch = apply_passes(src, section["passes"])
            if ch:
                touched.append("passes")

    if src == original:
        return f"{path}: unchanged", False
    if not check:
        p.write_text(src, encoding="utf-8")
    return f"{path}: {'would update' if check else 'updated'} {', '.join(touched)}", True


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    check = "--check" in sys.argv
    if not args:
        print(__doc__)
        return 2
    data = json.loads(Path(args[0]).read_text(encoding="utf-8"))
    changed = False
    for key, files in TARGETS.items():
        if key not in data:
            continue
        for f in files:
            msg, ch = apply_to_file(f, key, data, check)
            changed = changed or ch
            print(msg)
    return 0 if not check else (1 if changed else 0)


if __name__ == "__main__":
    sys.exit(main())
