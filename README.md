# Country Explorer

A small single-page web app that lets a user type a country name, hit
search, and see the flag, capital, population, region, and currency for
the matching country. Built with plain HTML, CSS, and vanilla
JavaScript — no build step and no dependencies.

## Intuition

<!-- Describe your first thoughts on how to solve this problem. -->

The very first idea was: keep it boring. A user wants a country, types
a country, gets a country. No frameworks, no router, no React. Just a
search box, a result card, and a single `fetch` call.

Everything else follows from that:

- One HTML file, one CSS file, one JS file. Easy to demo, easy to
  judge, easy to read.
- The page should still feel useful while the request is in flight and
  when it fails — so we need a loading state, a not-found state, and
  an error state in addition to the result state.
- The last few searches should "stick" so the user doesn't have to
  retype. `localStorage` is built into the browser and needs zero
  setup.
- The JavaScript is written in the most beginner-friendly style so a
  judge can read each line out loud and follow.

## Approach

<!-- Describe your approach to solving the problem. -->

**One file per concern.**

- `index.html` defines the search bar, the result card, and the recents
  panel. Each "screen" inside the card (idle, loading, not-found,
  error, data) is a separate `<div>` that we show or hide — never
  rewritten.
- `styles.css` defines the whole visual system as CSS custom properties
  on `:root` (the olive / amber / cream / beige earth palette), then
  every component pulls colors from those tokens. No hard-coded hex
  values inside component rules.
- `script.js` is split into small, single-job functions and organised
  into 12 numbered sections (settings → DOM grabs → helpers →
  validation → recents → API → render → search → UI handlers → boot).

**States are explicit.**

The result card has five "screens": idle, loading, not-found, error,
data. `showState(name)` is the one and only function that decides which
screen is visible. Every code path calls it, so it is impossible to
end up in two states at once.

**The network call has a timeout.**

`Promise.race([fetch(url), timeoutPromise(12000)])` means a hung
request gives up after 12 seconds and the user sees the error state
instead of an infinite spinner. No third-party library needed.

**Recents are honest.**

The last 5 searches live in `localStorage` under one key
(`atlas_recent_searches`). A search whose country resolves
successfully gets added; "No country matched" does not. The list is
capped, de-duplicated case-insensitively, and the most recent entry
floats to the top. Click a row to re-run that search; click the `x` to
remove it.

**Accessible by default.**

- Search form uses `role="search"` and `aria-label`.
- The clear button has `tabindex="-1"` so the tab order is field →
  search button → quick-pick chips → recents.
- Invalid input sets `aria-invalid="true"` and turns the border red
  via a `data-invalid` attribute.
- The `/` key anywhere on the page focuses the search box (except when
  the user is already typing in an input).

## User Guide:

- **how to use it**

  1. Open `index.html` in a browser, or run `serve.ps1` to serve it
     from `http://127.0.0.1:8123/`.
  2. Type a country name into the search bar (for example
     `France`, `Japan`, or `Brazil`).
  3. Press **Enter** or click the **Search** button. A spinner
     appears while the request is in flight.
  4. The result card fills with the flag, capital, region, subregion,
     population, and currency of the matching country.
  5. Press **/** (slash) anywhere on the page to jump back to the
     search box. Press **Escape** while focused in the input to clear
     it.
  6. Click any of the quick-pick chips (France, Japan, Brazil,
     Canada, Australia, South Africa) to instantly search that
     country.
  7. Your last 5 successful searches appear in the **Recent**
     panel on the right. Click a row to re-run that search, click the
     `x` on the row to remove it, or click **Clear all** to wipe
     the list.

- **what it should do**

  - **Find a country by name** — for example `France` returns the
    French Republic with the tricolour flag, Paris as capital, and
    the Euro as currency.
  - **Find a country by partial or accented name** — `Cote d'Ivoire`,
    `Timor-Leste`, and `Saudi Arabia` all work.
  - **Show a spinner** while the request is loading and disable the
    Search button so it can't be double-clicked.
  - **Show "No country matched"** when the API returns 404 (for
    example `xyz123`).
  - **Show "Network error" with a Try again button** if the request
    times out or the network drops.
  - **Highlight invalid input** — empty input, single character, or
    symbols that aren't letters/spaces/hyphens/apostrophes/dots turn
    the field red and show a message under the box.
  - **Remember recent searches** across page reloads using
    `localStorage`, capped at 5 entries with the most recent on top.
  - **Stay keyboard-friendly** — `Tab` moves through field → search →
    chips → recents in order, `Enter` submits, `Escape` clears, `/`
    jumps to search.

## Stack

HTML, CSS, vanilla JavaScript. No build step. No dependencies.
