/* offline-shelf · theme menu
 * Appended by tools/kiwix-theme to kiwix-serve's polyfills.js, the one small
 * script that the library page and the reader both load early in <head>.
 * Each device can pick its own theme; the choice lives in localStorage.
 * "Automatic" keeps the server's pack (light or dark per device setting).
 * No dependencies, no network requests except the chosen theme's CSS file.
 * SPDX-License-Identifier: GPL-3.0-or-later */
(function () {
  "use strict";
  var KEY = "offline-shelf-theme";
  var doc = document, root = doc.documentElement;
  var themes = typeof OS_THEMES !== "undefined" ? OS_THEMES : [];
  if (!themes.length || !doc.querySelector) return;

  var script = doc.currentScript;
  var base = script && script.src ? script.src.replace(/\/skin\/polyfills\.js.*$/, "") : "";
  var de = /^de\b/i.test(navigator.language || "");
  var T = de
    ? { btn: "Design wählen", title: "Design", auto: "Automatisch", autoHint: "folgt dem Gerät", light: "Hell", dark: "Dunkel" }
    : { btn: "Choose theme", title: "Theme", auto: "Automatic", autoHint: "follows the device", light: "Light", dark: "Dark" };

  function byId(id) {
    for (var i = 0; i < themes.length; i++) if (themes[i][0] === id) return themes[i];
    return null;
  }
  function load() {
    try { return localStorage.getItem(KEY) || ""; } catch (e) { return ""; }
  }
  function save(id) {
    try {
      id ? localStorage.setItem(KEY, id) : localStorage.removeItem(KEY);
      /* keep only the chosen theme's cached CSS */
      for (var i = 0; i < themes.length; i++) {
        if (themes[i][0] !== id) localStorage.removeItem(KEY + ":" + themes[i][0]);
      }
    } catch (e) {}
  }
  function href(id) { return base + "/skin/os-theme/" + id + ".css"; }

  /* 1. Before first paint. The chosen theme's CSS is cached in localStorage
        and put inline at once, so the page never flashes in the wrong theme
        and no extra request holds up kiwix-serve's own scripts. A fresh copy
        is fetched in the background in case the server's themes changed. */
  var current = load(), style = null;
  function cssKey(id) { return KEY + ":" + id; }
  function setStyle(text) {
    if (!style) {
      style = doc.createElement("style");
      style.id = "os-theme-css";
      (doc.head || root).appendChild(style);
    }
    style.textContent = text;
  }
  function fetchCss(id, done) {
    var x = new XMLHttpRequest();
    x.open("GET", href(id));
    x.onload = function () {
      if (x.status !== 200) return;
      try { localStorage.setItem(cssKey(id), x.responseText); } catch (e) {}
      done(x.responseText);
    };
    x.send();
  }
  if (current && byId(current)) {
    var cached = "";
    try { cached = localStorage.getItem(cssKey(current)) || ""; } catch (e) {}
    root.setAttribute("data-theme", current);
    if (cached) setStyle(cached);
    fetchCss(current, function (text) { if (current && text !== cached) setStyle(text); });
  } else {
    current = "";
  }

  /* 2. Switching later: fetch the new theme first, then swap it in together
        with the attribute. Cross-fades where View Transitions exist. */
  function apply(id) {
    current = id;
    function swap(text) {
      if (id !== current) return;
      var go = function () {
        if (id) { setStyle(text); root.setAttribute("data-theme", id); }
        else { root.removeAttribute("data-theme"); if (style) style.textContent = ""; }
      };
      var calm = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (doc.startViewTransition && !calm) doc.startViewTransition(go); else go();
    }
    if (id) fetchCss(id, swap); else swap("");
  }

  /* Another tab changed the theme */
  window.addEventListener("storage", function (e) {
    if (e.key === KEY) { var id = e.newValue || ""; if (id !== current && (!id || byId(id))) apply(id); refresh(); }
  });

  /* 3. The menu */
  var btn, menu, items = [];

  function el(tag, cls, text) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  function packName(which) {
    var v = getComputedStyle(root).getPropertyValue("--pack-" + which).replace(/["'\s]/g, "");
    var t = byId(v);
    return t ? t[1] : "";
  }

  function item(id, label, hint, swatch) {
    var b = el("button", "os-theme-item");
    b.type = "button";
    b.setAttribute("role", "menuitemradio");
    b.setAttribute("data-id", id);
    var s = el("span", "os-theme-swatch");
    if (swatch) {
      s.style.background = swatch[3];
      s.style.borderColor = swatch[5];
      var dot = el("span");
      dot.style.background = swatch[4];
      s.appendChild(dot);
    } else {
      s.className += " os-theme-swatch--auto";
    }
    b.appendChild(s);
    var txt = el("span", "os-theme-label", label);
    if (hint) txt.appendChild(el("small", "", hint));
    b.appendChild(txt);
    b.addEventListener("click", function () {
      save(id);
      if (id !== current) apply(id);
      refresh();
      close(true);
    });
    items.push(b);
    return b;
  }

  function build() {
    menu = el("div", "os-theme-menu");
    menu.id = "os-theme-menu";
    menu.setAttribute("role", "menu");
    menu.setAttribute("aria-label", T.title);
    menu.hidden = true;
    var l = packName("light"), d = packName("dark");
    menu.appendChild(item("", T.auto, l && d ? l + " / " + d : T.autoHint, null));
    [["light", T.light], ["dark", T.dark]].forEach(function (g) {
      menu.appendChild(el("div", "os-theme-group", g[1]));
      themes.forEach(function (t) { if (t[2] === g[0]) menu.appendChild(item(t[0], t[1], "", t)); });
    });
    menu.addEventListener("keydown", function (e) {
      var i = items.indexOf(doc.activeElement);
      if (e.key === "Escape") { e.preventDefault(); close(true); }
      else if (e.key === "ArrowDown") { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
      else if (e.key === "Home") { e.preventDefault(); items[0].focus(); }
      else if (e.key === "End") { e.preventDefault(); items[items.length - 1].focus(); }
      else if (e.key === "Tab") close(false);
    });
    doc.body.appendChild(menu);
    refresh();
  }

  function refresh() {
    for (var i = 0; i < items.length; i++) {
      items[i].setAttribute("aria-checked", items[i].getAttribute("data-id") === current ? "true" : "false");
    }
  }

  function place() {
    var r = btn.getBoundingClientRect();
    var w = menu.offsetWidth, vw = root.clientWidth;
    var left = Math.min(Math.max(8, r.right - w), vw - w - 8);
    menu.style.left = Math.max(8, left) + "px";
    menu.style.top = Math.round(r.bottom + 6) + "px";
    menu.style.maxHeight = Math.max(160, window.innerHeight - r.bottom - 18) + "px";
  }

  function open() {
    if (!menu) build();
    menu.hidden = false;
    place();
    btn.setAttribute("aria-expanded", "true");
    var sel = menu.querySelector('[aria-checked="true"]') || items[0];
    sel.focus();
    doc.addEventListener("pointerdown", outside, true);
    window.addEventListener("resize", place);
  }

  function close(refocus) {
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    btn.setAttribute("aria-expanded", "false");
    doc.removeEventListener("pointerdown", outside, true);
    window.removeEventListener("resize", place);
    if (refocus) btn.focus();
  }

  function outside(e) {
    if (!menu.contains(e.target) && !btn.contains(e.target)) close(false);
  }

  function mount() {
    /* Library: top bar. Reader: toolbar. Both have the UI language button. */
    var bar = doc.querySelector(".kiwixNav") || doc.getElementById("kiwixtoolbar");
    if (!bar || doc.getElementById("os-theme-btn")) return;
    var lang = bar.querySelector('a[onclick*="modalUILanguageSelector"]');
    btn = el("a", "os-theme-btn");
    btn.id = "os-theme-btn";
    btn.href = "#";
    btn.setAttribute("role", "button");
    btn.setAttribute("aria-haspopup", "menu");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-controls", "os-theme-menu");
    btn.setAttribute("aria-label", T.btn);
    btn.title = T.btn;
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      menu && !menu.hidden ? close(true) : open();
    });
    if (lang && lang.parentNode === bar) bar.insertBefore(btn, lang); else bar.appendChild(btn);
    root.className += " os-switch";
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
