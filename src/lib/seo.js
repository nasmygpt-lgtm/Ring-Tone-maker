// Per-page SEO. Sets title + description + canonical + OG/Twitter tags at runtime.
const SITE = "Ringtone Maker";

function upsertMeta(selector, attr, name, content) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function applySeo({ title, description, path = "/", image = "og.svg" }) {
  const fullTitle = title.includes(SITE) ? title : `${title} — ${SITE}`;
  document.title = fullTitle;

  // Resolve absolute URLs against the current base so canonical/OG work on any host (root or subpath).
  const base = (window.__BASE_PATH__ || "/").replace(/\/+$/, "/");
  const origin = window.location.origin;
  const canonical = origin + base + "#" + (path.startsWith("/") ? path : "/" + path);
  const imageUrl = /^https?:/.test(image) ? image : origin + base + image.replace(/^\//, "");

  upsertMeta('meta[name="description"]', "name", "description", description);
  upsertLink("canonical", canonical);
  path = canonical; // used for og:url below
  image = imageUrl;

  upsertMeta('meta[property="og:title"]', "property", "og:title", fullTitle);
  upsertMeta('meta[property="og:description"]', "property", "og:description", description);
  upsertMeta('meta[property="og:url"]', "property", "og:url", path);
  upsertMeta('meta[property="og:image"]', "property", "og:image", image);
  upsertMeta('meta[property="og:type"]', "property", "og:type", "website");

  upsertMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
  upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", fullTitle);
  upsertMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
  upsertMeta('meta[name="twitter:image"]', "name", "twitter:image", image);
}
