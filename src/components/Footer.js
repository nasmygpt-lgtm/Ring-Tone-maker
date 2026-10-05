import htm from "htm";
import React from "react";
import { navigate, href } from "../lib/router.js";
import { IconShield } from "./icons.js";

const html = htm.bind(React.createElement);
const go = (e, to) => { e.preventDefault(); navigate(to); };

export function Footer() {
  return html`
    <footer class="footer">
      <div class="container">
        <span class="row" style=${{ gap: "8px" }}>
          ${IconShield({ "aria-hidden": "true", style: { width: 16, height: 16, color: "var(--accent-secondary)" } })}
          100% local — your audio never leaves this device.
        </span>
        <span class="row" style=${{ gap: "14px" }}>
          <a href=${href("/")} onClick=${(e) => go(e, "/")}>Cutter</a>
          <a href=${href("/preview")} onClick=${(e) => go(e, "/preview")}>Preview</a>
          <a href=${href("/setup")} onClick=${(e) => go(e, "/setup")}>Set up</a>
        </span>
      </div>
    </footer>
  `;
}
