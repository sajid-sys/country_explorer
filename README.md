# Country Explorer

Single-page web app: type a country, get flag, capital, population,
region, and currency. Plain HTML, CSS, vanilla JS — no build, no deps.

## Intuition

Keep it boring. One HTML file, one CSS file, one JS file, one `fetch`.

## Approach

- **One file per concern.** HTML lays out screens, CSS defines the
  olive/amber/cream palette as `:root` tokens, JS is 12 small
  single-job function sections.
- **Five explicit states.** idle, loading, not-found, error, data.
  `showState(name)` is the only function that flips them.
- **Network call has a timeout.** `Promise.race([fetch(url),
  timeoutPromise(12000)])` so a hung request shows the error state
  instead of a frozen spinner.
- **Recents via `localStorage`.** Last 5 successful searches, deduped
  case-insensitively, most recent on top. Click row to re-run, `x` to
  remove.
- **Keyboard-first.** `/` focuses search, `Escape` clears it,
  `aria-invalid` flags bad input.

## User Guide:

- **how to use it**

  1. Run `serve.ps1` → open `http://127.0.0.1:8123/`.
  2. Type a country (e.g. `France`, `Japan`, `Brazil`) and press
     **Enter** — or click a quick-pick chip.
  3. Result card shows flag, capital, region, subregion, population,
     and currency.
  4. **/** jumps to search, **Escape** clears it, **Clear all** wipes
     recents.

- **what it should do**

  - Match full or accented names (`Cote d'Ivoire`, `Timor-Leste`).
  - Spinner while loading, Search button disabled.
  - "No country matched" on 404 (`xyz123`).
  - "Network error" + **Try again** on timeout/drop.
  - Red border on empty / single-char / non-letter input.
  - Remember last 5 searches across reloads.
  - Keyboard: `Tab` walks field → search → chips → recents, `Enter`
    submits, `Escape` clears, `/` focuses search.
