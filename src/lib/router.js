// Minimal hash-free history router (same route structure as the requested
// TanStack Router setup: "/", "/preview", "/setup"). Uses the History API with
// a graceful fallback for environments served from file:// or subpaths.
import React from "react";

const listeners = new Set();

export function currentPath() {
  // Support both History API paths and ?p= / #/ fallbacks.
  const hash = window.location.hash;
  if (hash.startsWith("#/")) return normalize(hash.slice(1));
  return normalize(window.location.pathname);
}

function normalize(p) {
  if (!p || p === "") return "/";
  // collapse trailing slash (except root)
  if (p.length > 1 && p.endsWith("/")) p = p.replace(/\/+$/, "");
  return p;
}

export function navigate(to) {
  to = normalize(to);
  const usingHash = window.location.protocol === "file:" || window.location.hash.startsWith("#/");
  if (usingHash) {
    window.location.hash = "/" + to.replace(/^\//, "");
  } else {
    try {
      window.history.pushState({}, "", to);
    } catch {
      window.location.hash = "/" + to.replace(/^\//, "");
    }
  }
  emit();
  window.scrollTo(0, 0);
}

function emit() {
  const p = currentPath();
  listeners.forEach((fn) => fn(p));
}

window.addEventListener("popstate", emit);
window.addEventListener("hashchange", emit);

export function useRoute() {
  const [path, setPath] = React.useState(currentPath());
  React.useEffect(() => {
    const fn = (p) => setPath(p);
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);
  return path;
}
