# Country Explorer

A single-page web app that displays a country's flag, capital, population, region, and currency. Built with plain HTML, CSS, and JavaScript, with no build step or dependencies.

## Intuition

Keep the design minimal: one HTML file, one CSS file, one JavaScript file, and a single `fetch` call.

## Approach

- Separate concerns: HTML for layout, CSS for the color palette (`:root` variables), and JavaScript split into small single-purpose functions.
- Manage five UI states (idle, loading, not found, error, data) through a single `showState(name)` function.
- Apply a 12-second timeout to the request using `Promise.race`, so a stalled request ends in an error state.
- Store the last 5 successful searches in `localStorage`, without case-sensitive duplicates and with the newest first.
- Support keyboard use: `/` focuses search, `Escape` clears it, and `aria-invalid` marks invalid input.

## User Guide:

- how to use it

  1. Run `serve.ps1` and open `http://127.0.0.1:8123/`.
  2. Enter a country name (e.g. `France`) and press Enter, or select a quick-pick chip.
  3. View the result card with flag, capital, region, subregion, population, and currency.
  4. Use `/` to focus search, `Escape` to clear it, and "Clear all" to remove recent searches.

- what it should do

  - Match full and accented country names (e.g. `Cote d'Ivoire`).
  - Show a spinner and disable the Search button while loading.
  - Display "No country matched" when no result is found.
  - Display "Network error" with a **Try again** option on timeout or failure.
  - Highlight empty, single-character, or non-letter input with a red border.
  - Persist the last 5 searches across reloads.
  - Support full keyboard navigation.
