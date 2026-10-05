import React from "react";
import { createRoot } from "react-dom/client";
import htm from "htm/react";
import { App } from "./App.js";

const html = htm.bind(React.createElement);

try {
  const rootEl = document.getElementById("root");
  // remove the static boot/loading screen now that modules are ready
  const boot = document.getElementById("boot");
  if (boot) boot.remove();
  if (window.__bootTimer) clearTimeout(window.__bootTimer);

  const root = createRoot(rootEl);
  root.render(html`<${App} />`);
} catch (err) {
  if (window.__bootFail) window.__bootFail((err && err.stack) || String(err));
  else throw err;
}
