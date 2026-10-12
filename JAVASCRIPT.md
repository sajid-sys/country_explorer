# JavaScript Walk-Through — Country Explorer

This document explains every JavaScript concept the Country Explorer app uses.
The code in `script.js` is written in a **beginner-friendly** style on purpose,
so you can read each line out loud to a judge. The matching explanations below
follow the file section by section.

> General coding standards used throughout the explanations:
> - **Clear, descriptive names** for variables and functions.
> - **One small job per function** (composition over big multi-purpose functions).
> - **Comments only where the *why* isn't obvious** — the code itself is the answer.
> - **YAGNI** (no extra features "just in case").

---

## How the file is organized

The script is split into **12 numbered sections**. Reading top-to-bottom is the
same order the code runs in:

| # | Section                       | What it does                                          |
|---|-------------------------------|-------------------------------------------------------|
| 1 | Settings                      | Save URLs and limits as easy-to-change constants.    |
| 2 | Grab the HTML parts           | Find each page element once, store it in a variable. |
| 3 | Track current work            | Remember the last query for the "Retry" button.      |
| 4 | Small helper functions        | Format numbers, text, time, loading, toast, screens. |
| 5 | Check the input               | Validation + the red error message under the input.  |
| 6 | Read past searches            | localStorage helpers (get / save / add / remove).    |
| 7 | Search the API                | `fetch` + timeout race → updates the page.           |
| 8 | Show the country              | `drawCountry` — fills the result card.               |
| 9 | Start a search                | `runSearch` — the single "go do a search" function.  |
| 10| Tiny UI handlers              | onInput, onClear, onChipClick, onRetry, onKeyDown.  |
| 11| Start the app                 | `start()` — wires every event listener.              |
| 12| Boot                          | Runs `start()` when the DOM is ready.                |

---

## 1. Settings

```js
var API_URL    = "https://countries.dev/name/";
var FLAG_CDN   = "https://flagcdn.com/w320/";
var MAX_RECENT = 5;
var STORAGE_KEY = "atlas_recent_searches";
var TIMEOUT_MS  = 12000;
```

**Concepts used**

- `var` — the old-school way to make a variable. We use it everywhere because
  judges are more likely to recognise it than `let` / `const`.
- **Constants by convention** — variables written in `UPPER_SNAKE_CASE` mean
  "this is a setting, don't change it at runtime."
- A **comment** (`// ...`) explains the *why* when the *what* isn't obvious.
- **Why these are at the top:** changing the API URL or the timeout should
  only ever mean editing one line, not hunting through the file.

---

## 2. Grab the HTML parts

```js
var form     = document.getElementById("searchForm");
var input    = document.getElementById("countryInput");
var searchBtn= document.getElementById("searchBtn");
```

**Concepts used**

- `document` — the browser's view of the whole HTML page.
- `document.getElementById("...")` — finds one element by its `id`.
- `document.querySelector(".search__field")` — finds the first element that
  matches a **CSS selector** (here, a class name).
- **Why store them once?** Every function later just says `input` or `form`.
  No re-typing the lookup. If the id changes, we only fix one line.

---

## 3. Track current work

```js
var lastQuery = "";
```

**Concepts used**

- A simple **module-scope variable** to remember one piece of state.
- The "Retry" button later asks: *what was the last thing the user searched?*

---

## 4. Small helper functions

Each helper is **one focused function** — easy to read, easy to test, easy to
swap.

### `formatNumber(n)` — add commas to big numbers

```js
function formatNumber(n) {
  if (n == null || n === "" || isNaN(Number(n))) return "N/A";
  var num = Number(n);
  return num.toLocaleString("en-US");
}
```

- `function` — declares a function. We pass `n` (a value) and get a string back.
- `n == null` — true when the value is `null` or `undefined`.
- `isNaN(Number(n))` — true if `n` is not a real number after conversion.
- `Number(n)` — converts strings like `"67000000"` into a real number.
- `.toLocaleString("en-US")` — formats the number with commas.

### `showText(value)` — show "N/A" when the API gives nothing

```js
function showText(value) {
  if (value == null) return "N/A";
  var str = String(value).trim();
  if (str === "") return "N/A";
  return str;
}
```

- `String(value).trim()` — turns anything into a string and removes spaces.
- We use this in every field so missing data never leaves a blank hole.

### `timeAgo(timestamp)` — "just now", "5m ago", "3d ago"

```js
function timeAgo(timestamp) {
  if (!timestamp) return "";
  var seconds = Math.floor((Date.now() - timestamp) / 1000);
  ...
}
```

- `Date.now()` — current time in milliseconds since 1970.
- `Math.floor(x)` — round *down* to the nearest whole number.
- A series of `if` checks decide which "bucket" the time falls into.

### `setLoading(isLoading)` — show or hide the spinner

```js
function setLoading(isLoading) {
  if (!inputBox) return;
  if (isLoading) inputBox.setAttribute("data-loading", "true");
  else inputBox.removeAttribute("data-loading");
  if (searchBtn) searchBtn.disabled = !!isLoading;
}
```

- `setAttribute("data-loading", "true")` — adds a custom attribute the CSS
  uses to show the spinner. Removing the attribute hides it again.
- `!!isLoading` — the `!` twice turns *any* value into a clean `true` / `false`.
- `disabled = true` greys out the Search button while we wait.

### `showToast(message, isError)` — pop-up message

```js
function showToast(message, isError) {
  if (!toastEl) return;
  toastEl.textContent = message;
  if (isError) toastEl.classList.add("toast--error");
  else toastEl.classList.remove("toast--error");
  toastEl.hidden = false;
  setTimeout(function () { toastEl.hidden = true; }, 2500);
}
```

- `textContent = ...` — sets the *text* of an element (no HTML is parsed).
- `classList.add(...)` / `.remove(...)` — toggle a CSS class.
- `setTimeout(..., 2500)` — run a function after 2.5 seconds.

### `showState(name)` — show one "screen" inside the result card

```js
function showState(name) {
  var screens = [stateIdle, stateLoading, stateNotFound, stateError, stateData];
  for (var i = 0; i < screens.length; i++) {
    if (screens[i]) screens[i].hidden = true;
  }
  if (name === "idle"      && stateIdle)     stateIdle.hidden     = false;
  ...
}
```

- An **array** of the five "screens" and a **for loop** that hides them all.
- Then we pick the one we want and make *just that one* visible.
- **One function, one job** = "switch the visible result screen."

---

## 5. Check the input

### `setError(message)` — turn the red message on or off

```js
function setError(message) {
  if (message) {
    errorBox.textContent = message;
    inputBox.setAttribute("data-invalid", "true");
    input.setAttribute("aria-invalid", "true");
  } else {
    errorBox.textContent = "";
    inputBox.removeAttribute("data-invalid");
    input.setAttribute("aria-invalid", "false");
  }
}
```

- `aria-invalid` is a screen-reader hint that the field is bad.
- `data-invalid` is a CSS hook for the red border.

### `validateInput(raw)` — return a clean name, or empty string

```js
function validateInput(raw) {
  var value = (raw || "").trim();
  if (value === "")         { setError("Please enter a country name."); return ""; }
  if (value.length < 2)     { setError("Country name must be at least 2 characters."); return ""; }
  var ok = /^[A-Za-zÀ-ÿ\s'’\-\.,()]+$/.test(value);
  if (!ok)                  { setError("Use letters, spaces, hyphens, or apostrophes only."); return ""; }
  setError("");
  return value;
}
```

- `(raw || "")` — if `raw` is missing, use the empty string.
- `.trim()` — remove spaces at the start and end.
- `/^...$/.test(value)` — a **regular expression** that allows only letters,
  spaces, hyphens, apostrophes, dots, commas, and parentheses.
- **Returns** a *valid* name, or `""` if invalid. The caller decides what
  to do next.

---

## 6. Read past searches

We use the browser's `localStorage` to remember the last 5 searches.

### `getRecent()`

```js
function getRecent() {
  var raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    var list = JSON.parse(raw);
    if (Array.isArray(list)) return list;
    return [];
  } catch (e) { return []; }
}
```

- `localStorage.getItem(KEY)` — read a saved string (or `null`).
- `JSON.parse(raw)` — turn the saved string back into a real JS array.
- `try { ... } catch (e) { ... }` — if the saved data is broken, swallow
  the error and return `[]`. We never want a corrupt entry to crash the app.

### `saveRecent(list)`

```js
function saveRecent(list) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_RECENT))); }
  catch (e) { /* localStorage may be full or disabled — silently ignore. */ }
}
```

- `JSON.stringify(list)` — turn the array into text so we can store it.
- `.slice(0, MAX_RECENT)` — keep only the first 5 entries.

### `addRecent(name, country)`

```js
function addRecent(name, country) {
  var trimmed = name.trim();
  if (!trimmed) return;
  var list = getRecent();

  // Remove any older copy of the same name (case-insensitive).
  var filtered = [];
  for (var i = 0; i < list.length; i++) {
    if (list[i].name.toLowerCase() !== trimmed.toLowerCase()) filtered.push(list[i]);
  }
  ...
  filtered.unshift({ name: trimmed, ts: Date.now(), code: code.toLowerCase(), capital: capital });
  saveRecent(filtered);
  drawRecent();
}
```

- A **for loop** walks the saved list and rebuilds it without duplicates.
- `.toLowerCase()` makes the duplicate check case-insensitive.
- `.unshift({...})` — adds a new entry to the **front** of the array.
- `Date.now()` is stored as `ts` so `timeAgo()` can show "5m ago".

### `removeRecent(name)` and `clearAllRecent()`

- `removeRecent` is the same loop-and-filter pattern, just narrower.
- `clearAllRecent` writes an empty array and shows a toast.

### `drawRecent()` — paint the list

```js
function drawRecent() {
  var list = getRecent();
  recentCount.textContent = list.length + " / " + MAX_RECENT;
  // Remove the old items but keep the "empty" placeholder.
  var oldItems = recentList.querySelectorAll(".recent__item");
  for (var i = 0; i < oldItems.length; i++) oldItems[i].remove();
  ...
  for (var j = 0; j < list.length; j++) {
    var item = list[j];
    var li = document.createElement("li");
    var btn = document.createElement("button");
    ...
    btn.innerHTML = '...';        // build the row
    btn.querySelector(".recent__name").textContent = item.name;  // safe text
    (function (savedItem) {
      btn.addEventListener("click", function (e) {
        if (e.target.closest(".recent__remove")) { ... }
        input.value = savedItem.name;
        clearBtn.hidden = false;
        runSearch(savedItem.name);
      });
    })(item);
    li.appendChild(btn);
    recentList.appendChild(li);
  }
}
```

**Concepts used**

- `document.createElement("li")` — make a new list item in memory.
- `.innerHTML = "..."` — paste HTML markup (used for structure only).
- `textContent` — paste **plain text** (no HTML), so user input is safe.
- `e.target.closest(".recent__remove")` — did the click land on the "x"?
  `closest()` walks **up** the DOM to find a matching ancestor.
- `e.stopPropagation()` — don't let the click also reach the row.
- **IIFE pattern:** `(function(savedItem){ ... })(item)` captures `savedItem`
  in a new scope so the click handler always knows *which* item it belongs to.
- `appendChild(li)` — finally push the new `<li>` into the list.

---

## 7. Search the API

### `timeoutPromise(ms)` — fail after a given time

```js
function timeoutPromise(ms) {
  return new Promise(function (_resolve, reject) {
    setTimeout(function () { reject(new Error("Request timed out")); }, ms);
  });
}
```

- A `Promise` is a placeholder for a value that arrives **later**.
- `new Promise(function(resolve, reject) { ... })` builds one.
- `resolve` means *success*; `reject` means *failure*.
- After `ms` milliseconds we call `reject(...)` so the caller can move on.

### `searchCountry(name)` — the main fetch

```js
function searchCountry(name) {
  var url = API_URL + encodeURIComponent(name.trim());
  showState("loading");
  setError("");
  resultMeta.textContent = "Searching for \"" + name.trim() + "\"...";
  setLoading(true);

  Promise.race([
    fetch(url),
    timeoutPromise(TIMEOUT_MS)
  ])
  .then(function (response) {
    if (!response.ok) {
      if (response.status === 404) { showState("not-found"); ... return; }
      throw new Error("HTTP " + response.status);
    }
    return response.json();
  })
  .then(function (data) { ... drawCountry(country, name.trim()); addRecent(name.trim(), country); })
  .catch(function (err) { showState("error"); resultMeta.textContent = "Network error"; console.error(...); })
  .then(function () { setLoading(false); });
}
```

**Concepts used**

- `encodeURIComponent(name)` — turn spaces, accents, etc. into URL-safe
  characters like `%20`.
- `fetch(url)` — built-in browser function that returns a `Promise` for a
  network response.
- `Promise.race([...])` — *"whoever finishes first wins."* The fetch and the
  timeout race each other. If the timeout wins, the user sees an error
  instead of an infinite spinner.
- `.then(function(response) { ... })` — runs after the previous promise
  succeeds. We can chain many `.then()` calls; each gets the previous result.
- `response.ok` — true when the HTTP status is 200–299.
- `response.status` — the HTTP code (404, 500, ...).
- `throw new Error("...")` — jump straight to the next `.catch(...)`.
- `response.json()` — read the body as JSON (also a Promise).
- `.catch(function(err) { ... })` — runs if **any** earlier step failed.
- The last `.then(function () { setLoading(false); })` is the "always runs
  last" cleanup that hides the spinner whether we won or lost.
- `console.error(...)` — helpful in DevTools, ignored by users.

---

## 8. Show the country on the page

`drawCountry(country, query)` fills the result card. Highlights:

- **Defensive reads** — every field is checked for `null` / missing.
- **Capital can be a string or an array**:
  ```js
  capital = Array.isArray(country.capital) ? country.capital[0] : country.capital;
  ```
  The **ternary operator** `? :` picks the right one.
- **Currency can be an object or an array**, so we handle both shapes and
  fall back to "N/A".
- **The flag image**:
  ```js
  flagImg.onerror = function () {
    flagImg.removeAttribute("src");
    flagImg.alt = "Flag of " + name + " (unavailable)";
  };
  ```
  If the picture 404s, we blank it and update the alt text.
- `showState("data")` finally reveals the result screen.

---

## 9. Start a search

`runSearch(name)` is the single function that *runs* a search.

```js
function runSearch(name) {
  var value = (name != null) ? String(name).trim() : input.value.trim();
  var valid = validateInput(value);
  if (!valid) { showState("idle"); resultMeta.textContent = "Awaiting your first search"; input.focus(); return; }
  lastQuery = valid;
  searchCountry(valid);
}
```

- If `name` is passed in (e.g. from a recent chip), we use it.
- Otherwise we read `input.value`.
- We **validate** first — bad input never reaches the network.
- On invalid input we go back to the idle screen and put the cursor back in.

---

## 10. Tiny UI handlers

| Handler        | When it fires                                  | What it does                               |
|----------------|------------------------------------------------|--------------------------------------------|
| `onInput`      | every keystroke in the search box              | show/hide the "x", clear the error         |
| `onClear`      | click on the "x"                               | empty the input, focus it                  |
| `onChipClick`  | click on a quick-pick chip                     | copy the chip text into the input, search  |
| `onRetry`      | click on "Try again"                           | re-run the last query                      |
| `onKeyDown`    | key pressed inside the input                    | `Escape` clears the field                  |

**Key concept — `event.target.closest(...)`:**

```js
function onChipClick(event) {
  var chip = event.target.closest("[data-quick]");
  if (!chip) return;
  var value = chip.getAttribute("data-quick") || "";
  input.value = value;
  clearBtn.hidden = value === "";
  runSearch(value);
}
```

`closest()` walks up from whatever the user clicked (could be an inner `<svg>`
or `<span>`) until it finds an element matching the selector. That way we
don't care *which* child the user actually clicked.

---

## 11. Start the app — `start()`

```js
function start() {
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  drawRecent();

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    runSearch();
  });

  input.addEventListener("input", onInput);
  input.addEventListener("keydown", onKeyDown);
  clearBtn.addEventListener("click", onClear);
  clearRecentBtn.addEventListener("click", clearAllRecent);
  retryBtn.addEventListener("click", onRetry);

  // "/" anywhere focuses the search bar.
  document.addEventListener("keydown", function (e) {
    if (e.key === "/" && document.activeElement !== input
        && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      input.focus({ preventScroll: true });
      input.select();
    }
  });

  document.addEventListener("click", function (event) {
    var chip = event.target.closest(".chip[data-quick]");
    if (chip) onChipClick(event);
  });

  window.addEventListener("load", function () {
    input.focus({ preventScroll: true });
  });
}
```

**Concepts used**

- `addEventListener("submit", fn)` — wire up a function to fire on form
  submit (Enter key or button click).
- `event.preventDefault()` — stop the browser from reloading the page on
  submit. Without this our app would refresh every search.
- `document.activeElement` — the element that currently has keyboard focus.
  We skip the `/` shortcut when the user is already typing in the input.
- `input.focus({ preventScroll: true })` — move the cursor without jumping
  the page.
- `input.select()` — highlight whatever is in the box.
- The last `window.addEventListener("load", ...)` makes the input autofocus
  once everything (including images) has loaded.

---

## 12. Boot

```js
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
```

- `document.readyState` tells us whether the HTML is still being parsed.
- If yes, wait for `DOMContentLoaded`. Otherwise the page is already ready
  and we can call `start()` right away.

---

## Feature checklist (judges love this)

| Feature                              | Where it lives                              |
|--------------------------------------|---------------------------------------------|
| Type a country, get a result         | `runSearch` → `searchCountry` → `drawCountry` |
| Loading spinner                      | `setLoading(true/false)` + `data-loading`    |
| "No match" 404 state                 | `searchCountry` `.then` branch on `404`      |
| Error / "Try again"                  | `searchCountry` `.catch` → `onRetry`         |
| Recents list (last 5)                | `getRecent` / `saveRecent` / `drawRecent`    |
| Remove a single recent               | `removeRecent` (delegated click on `.recent__remove`) |
| Clear all recents                    | `clearAllRecent`                             |
| Recent chip click → re-search        | `drawRecent` row click handler               |
| Toast notifications                  | `showToast`                                  |
| `Enter` to search                    | `form` submit listener in `start()`          |
| `Escape` clears input                | `onKeyDown`                                  |
| `/` focuses the search box           | global `keydown` listener in `start()`       |
| Autofocus on load                    | `window` `load` listener in `start()`        |
| Invalid input feedback               | `validateInput` → `setError` + `data-invalid`|
| Persistence across reload            | `localStorage` (`STORAGE_KEY`)               |
| Accessible labels & focus order      | `aria-label`, `aria-invalid`, `tabindex`     |

---

## Tiny glossary

- **Variable** — a labelled box that holds a value.
- **Function** — a reusable block of code that does one job.
- **String** — text inside quotes.
- **Number** — a numeric value.
- **Boolean** — `true` / `false`.
- **Array** — an ordered list of values, accessed by index (`list[0]`).
- **Object** — a list of named properties (`country.capital`).
- **Promise** — a placeholder for a value that arrives later.
- **`.then(fn)`** — "when the promise succeeds, run this."
- **`.catch(fn)`** — "if anything failed, run this."
- **Event** — a user action the page reacts to (click, key, submit).
- **DOM** — the browser's view of the HTML page.
- **CSS selector** — a pattern to pick elements (`#id`, `.class`, `[attr]`).
- **localStorage** — small key/value storage that survives page reloads.
