// Minimal hash-based router (same route structure as the requested TanStack
// Router setup: "/", "/preview", "/setup").
//
// Hash routing (#/preview) is used so the app works on ANY static host —
// including GitHub Pages served from a subpath, which has no SPA fallback and
// would otherwise 404 on a hard refresh of /preview or /setup. It also works
// from file:// with no server at all.
import React from "react";

const listeners = new Set();

function normalize(p) {
  if (!p || p === "") return "/";
  if (!p.startsWith("/")) p = "/" + p;
  if (p.length > 1 && p.endsWith("/")) p = p.replace(/\/+$/, "");
  return p;
}

export function currentPath() {
  const hash = window.location.hash || "";
  if (hash.startsWith("#/")) return normalize(hash.slice(1));
  if (hash.startsWith("#")) return normalize(hash.slice(1));
  return "/"; // no hash yet -> home
}

export function navigate(to) {
  to = normalize(to);
  const target = "#" + to;
  if (window.location.hash === target) {
    emit(); // same route re-selected; still notify
  } else {
    window.location.hash = to; // triggers hashchange -> emit
  }
  window.scrollTo(0, 0);
}

function emit() {
  const p = currentPath();
  listeners.forEach((fn) => fn(p));
}

window.addEventListener("hashchange", emit);

// If someone deep-links to the clean path (e.g. /Ring-Tone-maker/preview) via a
// server that DID fall back to index.html, translate it to a hash route once.
(function bootstrapCleanPath() {
  if (window.location.hash) return;
  const base = window.__BASE_PATH__ || "/";
  let path = window.location.pathname;
  if (base !== "/" && path.startsWith(base)) path = "/" + path.slice(base.length);
  path = normalize(path);
  if (path !== "/") {
    // reflect it in the hash without adding history noise
    history.replaceState(null, "", (window.__BASE_PATH__ || "") + "#" + path);
  }
})();

// Build an href for an anchor that works with hash routing (copy-link / middle-click safe).
export function href(to) {
  return "#" + normalize(to);
}

export function useRoute() {
  const [path, setPath] = React.useState(currentPath());
  React.useEffect(() => {
    const fn = (p) => setPath(p);
    listeners.add(fn);
    setPath(currentPath()); // sync in case hash changed before mount
    return () => listeners.delete(fn);
  }, []);
  return path;
}
