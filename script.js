var API_URL = "https://countries.dev/name/";
var FLAG_CDN = "https://flagcdn.com/w320/";
var MAX_RECENT = 5;
var STORAGE_KEY = "atlas_recent_searches";
var TIMEOUT_MS = 12000;

var form         = document.getElementById("searchForm");
var input        = document.getElementById("countryInput");
var searchBtn    = document.getElementById("searchBtn");
var clearBtn     = document.getElementById("clearInput");
var errorBox     = document.getElementById("searchError");
var inputBox     = document.querySelector(".search__field");

var stateIdle      = document.getElementById("stateIdle");
var stateLoading   = document.getElementById("stateLoading");
var stateNotFound  = document.getElementById("stateNotFound");
var stateError     = document.getElementById("stateError");
var stateData      = document.getElementById("stateData");
var notFoundDetail = document.getElementById("notFoundDetail");
var resultMeta     = document.getElementById("resultMeta");
var retryBtn       = document.getElementById("retryBtn");

var flagImg          = document.getElementById("flagImg");
var countryNameEl    = document.getElementById("countryName");
var countryOfficialEl= document.getElementById("countryOfficial");
var statCapital      = document.getElementById("statCapital");
var statRegion       = document.getElementById("statRegion");
var statSubregion    = document.getElementById("statSubregion");
var statPopulation   = document.getElementById("statPopulation");
var statCurrency     = document.getElementById("statCurrency");
var statCurrencySub  = document.getElementById("statCurrencySub");

var recentList     = document.getElementById("recentList");
var recentEmpty    = document.getElementById("recentEmpty");
var recentCount    = document.getElementById("recentCount");
var clearRecentBtn = document.getElementById("clearRecent");
var toastEl        = document.getElementById("toast");
var yearEl         = document.getElementById("year");

var lastQuery = "";

function formatNumber(n) {
  if (n == null || n === "" || isNaN(Number(n))) return "N/A";
  var num = Number(n);
  return num.toLocaleString("en-US");
}

function showText(value) {
  if (value == null) return "N/A";
  var str = String(value).trim();
  if (str === "") return "N/A";
  return str;
}

function timeAgo(timestamp) {
  if (!timestamp) return "";
  var seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 30)  return "just now";
  if (seconds < 60)  return seconds + "s ago";
  var minutes = Math.floor(seconds / 60);
  if (minutes < 60)  return minutes + "m ago";
  var hours = Math.floor(minutes / 60);
  if (hours   < 24)  return hours + "h ago";
  var days = Math.floor(hours / 24);
  if (days    < 7)   return days + "d ago";
  return new Date(timestamp).toLocaleDateString();
}

function setLoading(isLoading) {
  if (!inputBox) return;
  if (isLoading) inputBox.setAttribute("data-loading", "true");
  else inputBox.removeAttribute("data-loading");
  if (searchBtn) searchBtn.disabled = !!isLoading;
}

function showToast(message, isError) {
  if (!toastEl) return;
  toastEl.textContent = message;
  if (isError) toastEl.classList.add("toast--error");
  else toastEl.classList.remove("toast--error");
  toastEl.hidden = false;
  setTimeout(function () { toastEl.hidden = true; }, 2500);
}

function showState(name) {
  var screens = [stateIdle, stateLoading, stateNotFound, stateError, stateData];
  for (var i = 0; i < screens.length; i++) {
    if (screens[i]) screens[i].hidden = true;
  }
  if (name === "idle"      && stateIdle)     stateIdle.hidden     = false;
  if (name === "loading"   && stateLoading)  stateLoading.hidden  = false;
  if (name === "not-found" && stateNotFound) stateNotFound.hidden = false;
  if (name === "error"     && stateError)    stateError.hidden    = false;
  if (name === "data"      && stateData)     stateData.hidden     = false;
}

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

function saveRecent(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
  } catch (e) {
  }
}

function addRecent(name, country) {
  var trimmed = name.trim();
  if (!trimmed) return;
  var list = getRecent();

  var filtered = [];
  for (var i = 0; i < list.length; i++) {
    if (list[i].name.toLowerCase() !== trimmed.toLowerCase()) {
      filtered.push(list[i]);
    }
  }

  var code = country && country.alpha2Code ? country.alpha2Code : "";
  var capital = "";
  if (country && country.capital) {
    capital = Array.isArray(country.capital) ? country.capital[0] : country.capital;
  }

  filtered.unshift({
    name: trimmed,
    ts: Date.now(),
    code: code.toLowerCase(),
    capital: capital
  });

  saveRecent(filtered);
  drawRecent();
}

function removeRecent(name) {
  var list = getRecent();
  var filtered = [];
  for (var i = 0; i < list.length; i++) {
    if (list[i].name.toLowerCase() !== name.toLowerCase()) {
      filtered.push(list[i]);
    }
  }
  saveRecent(filtered);
  drawRecent();
}

function clearAllRecent() {
  saveRecent([]);
  drawRecent();
  showToast("Recent searches cleared");
}

function drawRecent() {
  var list = getRecent();
  recentCount.textContent = list.length + " / " + MAX_RECENT;

  var oldItems = recentList.querySelectorAll(".recent__item");
  for (var i = 0; i < oldItems.length; i++) {
    oldItems[i].remove();
  }

  if (list.length === 0) {
    recentEmpty.hidden = false;
    clearRecentBtn.hidden = true;
    return;
  }
  recentEmpty.hidden = true;
  clearRecentBtn.hidden = false;

  for (var j = 0; j < list.length; j++) {
    var item = list[j];
    var li = document.createElement("li");
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "recent__item";
    btn.setAttribute("aria-label", "Search again for " + item.name);

    var flagHTML = "";
    if (item.code) {
      flagHTML = '<img class="recent__flag" alt="" src="' + FLAG_CDN + item.code + '.png" '
               + 'width="22" height="16" '
               + 'style="width:22px;height:16px;border-radius:3px;object-fit:cover;border:1px solid #cfdcef;" '
               + 'onerror="this.style.display=\'none\'" />';
    }
    btn.innerHTML =
      '<span class="recent__num">' + (j + 1) + '</span>' +
      flagHTML +
      '<span class="recent__name"></span>' +
      '<span class="recent__meta"></span>' +
      '<span class="recent__remove" role="button" aria-label="Remove ' + item.name + '" tabindex="0">' +
        '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" '
            + 'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
          '<path d="M18 6 6 18M6 6l12 12"></path>' +
        '</svg>' +
      '</span>';

    btn.querySelector(".recent__name").textContent = item.name;
    btn.querySelector(".recent__meta").textContent = timeAgo(item.ts);

    (function (savedItem) {
      btn.addEventListener("click", function (e) {
        if (e.target.closest(".recent__remove")) {
          e.stopPropagation();
          removeRecent(savedItem.name);
          return;
        }
        input.value = savedItem.name;
        clearBtn.hidden = false;
        runSearch(savedItem.name);
      });
    })(item);

    li.appendChild(btn);
    recentList.appendChild(li);
  }
}

function timeoutPromise(ms) {
  return new Promise(function (_resolve, reject) {
    setTimeout(function () { reject(new Error("Request timed out")); }, ms);
  });
}

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
      if (response.status === 404) {
        showState("not-found");
        notFoundDetail.textContent =
          "No country matched \"" + name.trim() + "\". " +
          "Check the spelling or try another name.";
        resultMeta.textContent = "No match";
        return;
      }
      throw new Error("HTTP " + response.status);
    }
    return response.json();
  })
  .then(function (data) {
    if (!Array.isArray(data) || data.length === 0) {
      showState("not-found");
      notFoundDetail.textContent =
        "No country matched \"" + name.trim() + "\". " +
        "Check the spelling or try another name.";
      resultMeta.textContent = "No match";
      return;
    }
    var country = data[0];
    drawCountry(country, name.trim());
    addRecent(name.trim(), country);
  })
  .catch(function (err) {
    showState("error");
    resultMeta.textContent = "Network error";
    console.error("[Atlas] request failed:", err);
  })
  .then(function () {
    setLoading(false);
  });
}

function drawCountry(country, query) {
  var name      = (country && country.name)  ? String(country.name).trim()  : query;
  var official  = (country && country.nativeName && country.nativeName !== country.name)
                  ? country.nativeName : "";
  var code      = country && country.alpha2Code ? country.alpha2Code.toLowerCase() : "";
  var flagURL   = code ? (FLAG_CDN + code + ".png") : "";

  var capital   = "";
  if (country && country.capital) {
    capital = Array.isArray(country.capital) ? country.capital[0] : country.capital;
  }

  var region    = country ? country.region    : "";
  var subregion = country ? country.subregion : "";
  var population= country ? country.population: null;

  var currencyName = "N/A";
  var currencyCode = "";
  var currencySym  = "";
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
        currencyName = info.name || currencyCode;
        currencySym  = info.symbol || "";
      }
    }
  }

  if (flagURL) {
    flagImg.src = flagURL;
    flagImg.alt = "Flag of " + name;
    flagImg.onerror = function () {
      flagImg.removeAttribute("src");
      flagImg.alt = "Flag of " + name + " (unavailable)";
    };
  } else {
    flagImg.removeAttribute("src");
    flagImg.alt = "Flag of " + name + " (unavailable)";
  }

  countryNameEl.textContent     = name;
  countryOfficialEl.textContent = official && official !== name ? official : "";

  statCapital.textContent     = showText(capital);
  statRegion.textContent      = showText(region);
  statSubregion.textContent   = subregion ? "Subregion: " + subregion : "";
  statPopulation.textContent  = formatNumber(population);

  if (currencyName === "N/A") {
    statCurrency.textContent    = "N/A";
    statCurrencySub.textContent = "";
  } else {
    statCurrency.textContent    = currencyCode
      ? currencyName + " (" + currencyCode + ")"
      : currencyName;
    statCurrencySub.textContent = currencySym ? "Symbol: " + currencySym : "";
  }

  showState("data");
  resultMeta.textContent = "Showing results for \"" + query + "\"";
}

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

function onInput() {
  clearBtn.hidden = input.value.length === 0;
  if (errorBox.textContent) setError("");
}

function onClear() {
  input.value = "";
  clearBtn.hidden = true;
  setError("");
  input.focus();
}

function onChipClick(event) {
  var chip = event.target.closest("[data-quick]");
  if (!chip) return;
  var value = chip.getAttribute("data-quick") || "";
  input.value = value;
  clearBtn.hidden = value === "";
  runSearch(value);
}

function onRetry() {
  if (lastQuery) runSearch(lastQuery);
  else input.focus();
}

function onKeyDown(event) {
  if (event.key === "Escape" && document.activeElement === input && input.value) {
    onClear();
  }
}

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

  document.addEventListener("keydown", function (e) {
    if (e.key === "/" && document.activeElement !== input && !e.metaKey && !e.ctrlKey && !e.altKey) {
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

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
