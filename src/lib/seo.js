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

export function applySeo({ title, description, path = "/", image = "/og.svg" }) {
  const fullTitle = title.includes(SITE) ? title : `${title} — ${SITE}`;
  document.title = fullTitle;

  upsertMeta('meta[name="description"]', "name", "description", description);
  upsertLink("canonical", path);

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
