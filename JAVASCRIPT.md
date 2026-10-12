# JavaScript in Country Explorer — A Plain-English Guide

This file explains **every JavaScript feature** used in `script.js`. It is written so that you (or a judge) can open the file, follow along section by section, and understand what each line does.

The app does five things:

1. Read a country name from the input box.
2. Send it to a free public API.
3. Show the result (flag, capital, region, population, currency) on the page.
4. Remember the last 5 searches in the browser.
5. Handle errors gracefully (empty input, no match, no internet, slow API).

Everything below is in the order it appears in `script.js`.

---

## 1. Settings (variables at the top of the file)

```js
var API_URL     = "https://countries.dev/name/";
var FLAG_CDN    = "https://flagcdn.com/w320/";
var MAX_RECENT  = 5;
var STORAGE_KEY = "atlas_recent_searches";
var TIMEOUT_MS  = 12000;
```

- `var` — declares a variable. (Old-school keyword, used here so the code is easy to read.)
- `API_URL` — the address of the country data API. The country name is added to the end of this URL.
- `FLAG_CDN` — the address where flag pictures live. We add the country's 2-letter code (e.g. `fr`) to make a full image URL.
- `MAX_RECENT` — how many past searches to remember.
- `STORAGE_KEY` — the "label" we use to save searches in the browser.
- `TIMEOUT_MS` — give up if the API takes longer than 12 seconds.

**JavaScript features used here:** `var`, strings (`""`), semicolons, comments.

---

## 2. Grabbing the HTML parts

```js
var form      = document.getElementById("searchForm");
var input     = document.getElementById("countryInput");
// ...etc.
```

- `document` — the web page. JavaScript can reach into it and grab any element.
- `.getElementById("countryInput")` — find the element whose `id="countryInput"`.
- `document.querySelector(".search__field")` — find the first element that matches a CSS selector. (`.` means a class.)
- Storing the result in a `var` means we can use the same element many times without re-searching.

**Features used:** `document`, `getElementById`, `querySelector`, dot-notation chaining.

---

## 3. Track current work

```js
var lastQuery = "";
```

We remember the user's last search so the **"Try again"** button on the error screen can re-run it.

**Features used:** `var`, empty string `""`.

---

## 4. Small helper functions

### `formatNumber(n)` — turn `67000000` into `"67,000,000"`

```js
function formatNumber(n) {
  if (n == null || n === "" || isNaN(Number(n))) return "N/A";
  var num = Number(n);
  return num.toLocaleString("en-US");
}
```

- `function name() { ... }` — declare a function.
- `n == null` — true if the value is `null` or `undefined`.
- `n === ""` — strictly equal to an empty string.
- `isNaN(Number(n))` — `Number("hello")` becomes `NaN` (Not a Number). `isNaN(...)` returns `true` if it isn't a real number.
- `Number(value)` — convert a value to a number.
- `toLocaleString("en-US")` — format the number using US rules (commas every 3 digits).
- `return` — send a value back to the caller.

### `showText(value)` — return the text, or `"N/A"` if missing

```js
function showText(value) {
  if (value == null) return "N/A";
  var str = String(value).trim();
  if (str === "") return "N/A";
  return str;
}
```

- `String(value)` — convert to a string.
- `.trim()` — remove spaces at the start and end.

### `timeAgo(timestamp)` — "3m ago", "2h ago", etc.

```js
function timeAgo(timestamp) {
  if (!timestamp) return "";
  var seconds = Math.floor((Date.now() - timestamp) / 1000);
  // ...minutes, hours, days...
  return new Date(timestamp).toLocaleDateString();
}
```

- `Date.now()` — the current time in milliseconds.
- `Math.floor(...)` — round **down** to the nearest whole number.
- `new Date(timestamp)` — turn a number back into a real date.
- `.toLocaleDateString()` — format the date as a readable string.

### `showToast(message, isError)` — small pop-up

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

- `toastEl.textContent = "..."` — change the text inside an element.
- `element.classList.add("className")` — add a CSS class.
- `element.classList.remove("className")` — remove a CSS class.
- `element.hidden = true/false` — show or hide the element using the built-in HTML `hidden` attribute.
- `setTimeout(fn, 2500)` — run `fn` after 2,500 milliseconds.
- `function () { ... }` — an **anonymous function** (a function with no name) used as a callback.

### `showState(name)` — switch which screen is visible

The result card has 5 "screens" (idle, loading, not-found, error, data). Only one is visible at a time.

```js
function showState(name) {
  var screens = [stateIdle, stateLoading, stateNotFound, stateError, stateData];
  for (var i = 0; i < screens.length; i++) {
    if (screens[i]) screens[i].hidden = true;
  }
  if (name === "idle"      && stateIdle)     stateIdle.hidden     = false;
  // ...etc
}
```

- `[a, b, c]` — an **array** of values.
- `for (var i = 0; i < length; i++) { }` — a classic **for loop** that runs from `0` to `length - 1`.
- `screens.length` — how many items are in the array.
- `screens[i]` — the item at position `i` (zero-based: first item is index `0`).
- `&&` — "and" — both sides must be true.
- `name === "idle"` — strict equality between a string and a literal.

**Features used:** functions, `if`/`else`, `for` loop, arrays, `&&`, `===`, `hidden`, `classList`.

---

## 5. Check the input

### `setError(message)` — show or clear the red error

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

- `if (message)` — any non-empty string is **truthy** in JavaScript.
- `.setAttribute("name", "value")` — add or change an attribute on an HTML element.
- `.removeAttribute("name")` — remove an attribute.
- `aria-*` attributes help screen readers (accessibility).

### `validateInput(raw)` — is the input acceptable?

```js
function validateInput(raw) {
  var value = (raw || "").trim();
  if (value === "") {
    setError("Please enter a country name.");
    return "";
  }
  if (value.length < 2) {
    setError("Country name must be at least 2 characters.");
    return "";
  }
  var ok = /^[A-Za-zÀ-ÿ\s'’\-\.,()]+$/.test(value);
  if (!ok) {
    setError("Use letters, spaces, hyphens, or apostrophes only.");
    return "";
  }
  setError("");
  return value;
}
```

- `(raw || "")` — if `raw` is `null` or `undefined`, use `""` instead.
- `value.length` — number of characters in the string.
- `/.../ ` — a **regular expression** (a search pattern).
- `.test(value)` — does the pattern match? Returns `true` or `false`.
- `!ok` — the opposite of `ok` (so `!true` is `false`).
- `return ""` — stop the function and send back an empty string as a "failure" signal.

The regex `^[A-Za-zÀ-ÿ\s'’\-\.,()]+$` means:
- `^` ... `$` — start to end of the string.
- `[ ... ]` — one of the characters in the brackets.
- `A-Za-z` — any letter, A–Z or a–z.
- `À-ÿ` — accented letters (like é, ñ, ü).
- `\s` — whitespace.
- `'` `’` `\-` `\.` `,` `(` `)` — apostrophes, hyphens, dots, commas, parentheses.
- `+` — one or more.

**Features used:** truthy/falsy, `||`, `.length`, regular expressions, `.test()`, string literals.

---

## 6. Read past searches (browser storage)

```js
function getRecent() {
  var raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    var list = JSON.parse(raw);
    if (Array.isArray(list)) return list;
    return [];
  } catch (e) {
    return [];
  }
}
```

- `localStorage` — a tiny key/value database built into every browser. Data stays even after closing the tab.
- `.getItem(key)` — read the saved value as a **string**.
- `JSON.parse(string)` — turn a JSON string back into a real JS array/object.
- `Array.isArray(x)` — is `x` an array? `true`/`false`.
- `try { ... } catch (e) { ... }` — if something inside `try` throws an error, run `catch` instead of crashing. Used to handle broken saved data safely.

```js
function saveRecent(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
  } catch (e) {}
}
```

- `.setItem(key, value)` — save a string to localStorage.
- `JSON.stringify(array)` — turn a JS array into a JSON string (so it can be saved).
- `list.slice(0, MAX_RECENT)` — keep only the first 5 items.

```js
function addRecent(name, country) {
  // ...remove older copies of the same name (case-insensitive)...
  filtered.unshift({ name: trimmed, ts: Date.now(), code: ..., capital: ... });
  saveRecent(filtered);
  drawRecent();
}
```

- `{ name: "...", ts: 1234 }` — an **object** (a bundle of named values).
- `.unshift(item)` — add `item` to the **front** of an array.
- `.toLowerCase()` — make a string all-lowercase so "France" and "france" are treated the same.

```js
function removeRecent(name) { /* ...filter out name... */ }
function clearAllRecent()  { saveRecent([]); drawRecent(); }
```

- `saveRecent([])` — save an empty array (no searches left).

### `drawRecent()` — show the list on the page

```js
var li = document.createElement("li");
var btn = document.createElement("button");
btn.type = "button";
btn.className = "recent__item";
btn.innerHTML = "...";
recentList.appendChild(li);
```

- `document.createElement("li")` — make a new `<li>` element in memory.
- `.type = "button"` — set its `type` attribute.
- `.className = "..."` — set its CSS class.
- `.innerHTML = "..."` — set the inner HTML (text + tags).
- `parent.appendChild(child)` — put the new element inside the parent.

A `for` loop builds one row per saved search.

```js
(function (savedItem) {
  btn.addEventListener("click", function (e) { ... });
})(item);
```

- `(function (x) { ... })(item)` — an **IIFE (Immediately Invoked Function Expression)**. A small helper function that runs right away, used so each row's click handler remembers **its own** `savedItem`. (Beginner-friendly way to capture a value inside a loop.)
- `.addEventListener("click", fn)` — when the user clicks, run `fn`.
- `e.target` — the element the user actually clicked on.
- `e.target.closest(".recent__remove")` — find the nearest ancestor that matches the selector, or `null` if none.

**Features used:** `localStorage`, `JSON.parse`, `JSON.stringify`, `try/catch`, `Array.isArray`, `.slice`, `.unshift`, `.toLowerCase`, objects, `document.createElement`, `innerHTML`, `appendChild`, `addEventListener`, `e.target`, `closest`, IIFE, `Date.now`.

---

## 7. Search the API

```js
function timeoutPromise(ms) {
  return new Promise(function (_resolve, reject) {
    setTimeout(function () { reject(new Error("Request timed out")); }, ms);
  });
}
```

- `new Promise(function (resolve, reject) { ... })` — create a **Promise**. A Promise is "a value that will be ready later."
- `resolve(value)` — the promise succeeded.
- `reject(error)` — the promise failed.
- `new Error("...")` — make an Error object with a message.
- `_resolve` — leading underscore means "I'm not using this parameter."

```js
function searchCountry(name) {
  var url = API_URL + encodeURIComponent(name.trim());

  showState("loading");
  resultMeta.textContent = "Searching for \"" + name.trim() + "\"...";
  searchBtn.disabled = true;

  Promise.race([ fetch(url), timeoutPromise(TIMEOUT_MS) ])
  .then(function (response) { ... })
  .then(function (data)      { ... })
  .catch(function (err)      { ... })
  .then(function ()          { searchBtn.disabled = false; });
}
```

- `encodeURIComponent("Côte d'Ivoire")` — turn a string into something safe to put in a URL (`C%C3%B4te%20d%27Ivoire`).
- `Promise.race([a, b])` — whichever of `a` or `b` finishes **first** wins. Here we race the real fetch against the timeout, so a slow API doesn't hang forever.
- `fetch(url)` — built-in browser function to load a URL. Returns a Promise.
- `.then(function (x) { ... })` — run this when the previous Promise succeeds; pass the value along.
- `.catch(function (err) { ... })` — run this if any previous step fails.
- A final `.then(...)` — always runs, success or failure, so we can re-enable the button.
- `searchBtn.disabled = true` — make a button un-clickable while the request is in flight.

Inside the first `.then`:

```js
if (!response.ok) {
  if (response.status === 404) { ...show "not found" screen... }
  throw new Error("HTTP " + response.status);
}
return response.json();
```

- `response.ok` — true if status is 200–299.
- `response.status` — the HTTP code (404, 500, etc.).
- `throw new Error(...)` — jump straight to the next `.catch()`.
- `response.json()` — turn the response body into a JS object (also a Promise).

Inside the second `.then`:

```js
if (!Array.isArray(data) || data.length === 0) { ...not found... }
var country = data[0];
drawCountry(country, name.trim());
addRecent(name.trim(), country);
```

- `||` — "or" — if the first part is true, the second part is skipped.
- `data[0]` — first item in the array.

**Features used:** `fetch`, `Promise`, `Promise.race`, `.then`, `.catch`, `throw`, `new Error`, `encodeURIComponent`, `.json`, `.ok`, `.status`, `.length`, `Array.isArray`, `||`, `disabled`, IIFE-style callbacks.

---

## 8. Show the country on the page

```js
function drawCountry(country, query) {
  var name      = (country && country.name) ? String(country.name).trim() : query;
  var official  = (country && country.nativeName && country.nativeName !== country.name)
                  ? country.nativeName : "";
  // ...
}
```

- `a && b` — returns `b` if both are truthy, otherwise the first falsy one. Here we use it to **guard** against `country` being `null`.
- `condition ? valueIfTrue : valueIfFalse` — the **ternary operator**, a one-line `if/else`.
- `country.capital` may be a string **or** an array, so we check `Array.isArray(...)` and use `[0]` if needed.

```js
if (country && country.currencies) {
  if (Array.isArray(country.currencies) && country.currencies.length > 0) {
    var first = country.currencies[0];
    currencyName = first.name || "N/A";
    currencyCode = first.code || "";
    currencySym  = first.symbol || "";
  } else if (typeof country.currencies === "object") {
    var keys = Object.keys(country.currencies);
    if (keys.length > 0) {
      currencyCode = keys[0];
      var info = country.currencies[keys[0]] || {};
      // ...
    }
  }
}
```

- `typeof x === "object"` — check what **type** a value is.
- `Object.keys(obj)` — return an array of the object's property names.
- `a || "N/A"` — if `a` is missing, use `"N/A"`.
- `country.currencies[keys[0]] || {}` — if the lookup is `undefined`, use an empty object so `.name` and `.symbol` don't crash.

Then we write everything into the page:

```js
flagImg.src          = flagURL;
flagImg.alt          = "Flag of " + name;
flagImg.onerror      = function () { ... };
countryNameEl.textContent = name;
statCapital.textContent    = showText(capital);
statPopulation.textContent = formatNumber(population);
showState("data");
```

- `element.textContent = "..."` — set the text inside an element.
- `element.src = "..."` — set the `src` of an `<img>`.
- `element.onerror = function () { ... }` — run this if the image fails to load (e.g. the code `xx` doesn't exist on the flag CDN).
- `+ ` is used to **concatenate** (join) strings.
- `showState("data")` — finally switch to the result screen.

**Features used:** `&&`, ternary `?:`, `||`, `typeof`, `Object.keys`, `Array.isArray`, `textContent`, `.src`, `.onerror`, string concatenation.

---

## 9. Start a search

```js
function runSearch(name) {
  var value;
  if (name != null) {
    value = String(name).trim();
  } else {
    value = input.value.trim();
  }

  var valid = validateInput(value);
  if (!valid) {
    showState("idle");
    resultMeta.textContent = "Awaiting your first search";
    input.focus();
    return;
  }

  lastQuery = valid;
  searchCountry(valid);
}
```

- `if (name != null)` — if a value was passed in (e.g. from a recent item), use it; otherwise read the input box.
- `name != null` is the **opposite** of `name == null`. (Both `null` and `undefined` are "null-like", but `==` only catches them when written this way.)
- `input.value.trim()` — read the current text in the input box and strip spaces.
- `input.focus()` — put the cursor inside the input.
- `return;` — exit the function early (no value sent back).

**Features used:** `if/else`, function arguments with default behavior, `.focus`, `!=`, `return`.

---

## 10. Tiny UI handlers

```js
function onInput() {
  clearBtn.hidden = input.value.length === 0;
  if (errorBox.textContent) setError("");
}
```

- Runs on every keystroke. If the input is empty, hide the **×** clear button. If there was a red error, clear it.

```js
function onClear() {
  input.value = "";
  clearBtn.hidden = true;
  setError("");
  input.focus();
}
```

- Clicking **×** wipes the input, hides itself, clears any error, and re-focuses the input.

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

- Quick-pick chips in the hero have a `data-quick="France"` attribute.
- `event.target.closest("[data-quick]")` — climb up from whatever was clicked until we find an element with that attribute.
- `.getAttribute("data-quick")` — read the attribute's value.

```js
function onRetry() {
  if (lastQuery) runSearch(lastQuery);
  else input.focus();
}
```

```js
function onKeyDown(event) {
  if (event.key === "Escape" && document.activeElement === input && input.value) {
    onClear();
  }
}
```

- `event.key` — the key the user pressed (`"Enter"`, `"Escape"`, etc.).
- `document.activeElement` — the element that currently has the cursor.
- Three checks: was it Escape, are we in the input, and is there text to clear?

**Features used:** `event` object, `event.target`, `event.key`, `closest`, `getAttribute`, `data-*` attributes, `activeElement`, logical `&&`.

---

## 11. Start the app

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

  document.addEventListener("click", function (event) {
    var chip = event.target.closest(".chip[data-quick]");
    if (chip) onChipClick(event);
  });

  window.addEventListener("load", function () {
    input.focus({ preventScroll: true });
  });
}
```

- `new Date()` — the current date/time.
- `.getFullYear()` — the year as a 4-digit number.
- `String(new Date().getFullYear())` — turn the number into a string so we can assign it to `textContent`.
- `addEventListener("event", handler)` — listen for an event and run a function.
- `event.preventDefault()` — stop the browser's default action (here: stop the form from reloading the page).
- `input.focus({ preventScroll: true })` — focus the input without the page jumping.

```js
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
```

- `document.readyState` — has the page finished parsing? `"loading"` means the HTML is still being read.
- `DOMContentLoaded` event — fires when the page is parsed and ready, but before images load.
- This trick starts the app as soon as it's safe, whether the script tag is at the top or bottom of the HTML.

**Features used:** `new Date`, `getFullYear`, `addEventListener`, `preventDefault`, `focus`, `readyState`, `DOMContentLoaded`, objects as options (`{ preventScroll: true }`).

---

## Quick reference: every JS feature used

| Category         | Features                                                                                          |
|------------------|---------------------------------------------------------------------------------------------------|
| Basics           | `var`, `function`, `if` / `else`, `for`, `return`, comments, semicolons                           |
| Types            | strings, numbers, booleans, `null`, `undefined`, arrays, objects                                   |
| Operators        | `===`, `!==`, `==`, `!=`, `&&`, `\|\|`, `!`, ternary `?:`, `+` (concat / math)                    |
| String helpers   | `.trim()`, `.toLowerCase()`, `.length`, `.toLocaleString()`, `.toLocaleDateString()`              |
| Arrays           | `[a, b]`, `array.length`, `array[i]`, `.slice()`, `.unshift()`, `Array.isArray()`                 |
| Objects          | `{ key: value }`, `obj.key`, `obj[key]`, `Object.keys(obj)`, `typeof`                              |
| DOM              | `document`, `getElementById`, `querySelector`, `createElement`, `appendChild`, `innerHTML`        |
| Element updates  | `.textContent`, `.src`, `.alt`, `.className`, `.classList.add/remove`, `.hidden`, `.focus()`      |
| Attributes       | `.setAttribute()`, `.removeAttribute()`, `data-*` and `aria-*`                                    |
| Events           | `addEventListener`, `event.preventDefault`, `event.target`, `event.key`, `DOMContentLoaded`, `load` |
| Storage          | `localStorage.getItem` / `setItem`, `JSON.parse`, `JSON.stringify`                                |
| Async            | `fetch`, `Promise`, `Promise.race`, `.then`, `.catch`, `setTimeout`, `new Error`, `throw`          |
| Regex            | `/.../.test(value)`                                                                               |
| Browser APIs     | `URL` / `encodeURIComponent`, `Date.now`, `new Date`, `Math.floor`                                |
| Patterns         | IIFE `(function(x){...})(item)` for closing-over a value, `&&` and `||` for null-safe access       |

---

## Suggested speaking order when explaining to judges

1. **Settings** — show the constants at the top.
2. **Grabbing HTML** — `document.getElementById`.
3. **Helpers** — `formatNumber`, `showText`, `timeAgo`, `showToast`.
4. **State switching** — `showState` (only one screen visible at a time).
5. **Validation** — `validateInput` and the regex.
6. **Recent searches** — `localStorage` + `JSON.parse` / `JSON.stringify`.
7. **Searching** — `fetch`, `Promise.race` for the timeout, `.then` / `.catch` chains.
8. **Drawing the result** — `drawCountry` writing into the page.
9. **Starting the app** — `start()` wiring up all event listeners.

That top-to-bottom walkthrough follows the exact order of the file, which makes it easy to flip back and forth between explanation and code.
