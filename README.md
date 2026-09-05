# Happy Birthday, Laura! — an EHCNYC Family birthday experience

An interactive birthday countdown built for **Laura Meyer** from the **EHCNYC Family**.
Plain HTML, vanilla JavaScript and CSS 3D. No build step, no framework, no dependencies.

## Running it

Double-click `index.html`. That is all — there is nothing to build, install or
serve. If you prefer a local server, `npx serve .` works too.

The experience is entirely silent by design; there is no audio anywhere.

---

## The things you'll want to change

### 1. The countdown date

`js/script.js`, in the **CONFIGURATION** block at the very top:

```js
var BIRTHDAY_DATE = '2026-09-05T00:00:00-04:00';
```

Currently set to **Sept 5, 12:00 AM New York time**.

The `-04:00` on the end matters. It pins the countdown to one exact moment in
time, so it hits zero simultaneously for everyone regardless of where they are.
Remaining time is then displayed on the viewer's own local clock.

| New York season | Offset to use |
|---|---|
| Summer — EDT (Mar–Nov) | `-04:00` |
| Winter — EST (Nov–Mar) | `-05:00` |

No age is shown anywhere on the page, by design.

### 2. The family messages

Written notes, in the same configuration block:

```js
var FAMILY_MESSAGES = [
  { name: 'Gennady', initial: 'G', message: '...' },
  { name: 'Nixie',   initial: 'N', message: '...' },
  { name: 'Ed',      initial: 'E', message: '...' }
];
```

Use `
` inside a message to break it into paragraphs — every message
currently opens with a "Happy Birthday," salutation on its own line, which
renders in the brand blue above the body.

Add or remove people freely; the layout adapts. Three sit in one row on
desktop and stack on smaller screens. Names here are independent of the
signatures inside the birthday card, so update both (`index.html`, the
`.signatures` list) if someone changes.

---

## Previewing before the big day

| URL | What it does |
|---|---|
| `index.html?celebrate=1` | Jumps straight into the full celebration |
| `index.html?t=20` | Sets the countdown to 20 seconds from now, so you can watch it roll over live |
| `index.html?t=8` | Short enough to see the final-ten-seconds escalation |

These leave no visible trace on the page — Laura will never see them.

---

## Deploying

You need a link to send her. Any static host works; there is no build step.

**Netlify Drop** (fastest) — go to [app.netlify.com/drop](https://app.netlify.com/drop)
and drag the `Laura-Birthday` folder onto the page. You get a URL immediately.

**GitHub Pages** — push the folder to a repo, then Settings → Pages → deploy
from `main` / root.

**After deploying, do one thing:** open `index.html` and set the two social
tags to the real address so the link preview image resolves —

```html
<meta property="og:url"   content="https://your-site.netlify.app/" />
<meta property="og:image" content="https://your-site.netlify.app/assets/og-image.png" />
```

Some link scrapers (WhatsApp in particular) will not resolve a relative
`og:image`. The preview card itself is `assets/og-image.png`; regenerate it
from `tools/og-source.html` if you want to change the wording.

---

## Structure

```
index.html          markup + the vial and message-note <template>s
css/fonts.css       self-hosted @font-face declarations
css/styles.css      design tokens, 3D card, flip clock, box, vials, all keyframes
js/script.js        configuration block first, then one module per feature
assets/logo.png     cropped from the EHCNYC logo (colours and proportions untouched)
assets/og-image.png link-preview card (1200x630)
assets/favicon.png
assets/fonts/       two variable woff2 files, no third-party font request
tools/og-source.html  regenerates the link-preview image
```

There is no CSS framework and no JavaScript library — the page has zero
runtime dependencies and works with no network connection at all.

## Notes

- **The countdown escalates.** The line above the clock changes as the moment
  approaches (*Something Special Is Coming… → Almost Here… → Tomorrow Is The
  Day → Just Moments Away → Any Second Now → Here We Go*), and in the last
  minute the seconds unit grows and glows while days and hours recede. The
  browser tab counts down too, so it keeps working in a background tab.
- **The takeover only plays once.** After Laura has seen the full celebration,
  a reload drops straight into party mode instead of replaying it. The
  "Replay the celebration" button in the hero always brings it back.
  (Stored in `localStorage`; clearing site data resets it.)
- **Reduced motion** is respected — with the OS setting on, the heavy 3D and
  particle work stops while every interaction keeps working.
- **The floating glass vials** (Tirzepatide, Semaglutide, Sermorelin) are purely
  decorative EHCNYC Easter eggs. They show a name on hover and a small message
  when clicked, and deliberately carry no dosage or medical text of any kind.
  They are hidden from screen readers.
- The logo is used unmodified on a white plate; it is never recoloured or
  stretched.
