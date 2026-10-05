import htm from "htm/react";
import React from "react";
import { useRoute, navigate, href } from "../lib/router.js";
import { IconScissors, IconPhone, IconSettings, IconMusic } from "./icons.js";

const html = htm.bind(React.createElement);

const LINKS = [
  { to: "/", label: "Cutter", Icon: IconScissors },
  { to: "/preview", label: "Preview", Icon: IconPhone },
  { to: "/setup", label: "Set up", Icon: IconSettings },
];

function go(e, to) {
  e.preventDefault();
  navigate(to);
}

export function TopBar() {
  const path = useRoute();
  return html`
    <header class="topbar">
      <div class="container">
        <a class="brand" href=${href("/")} onClick=${(e) => go(e, "/")} aria-label="Ringtone Maker home">
          <span class="logo">${IconMusic({ "aria-hidden": "true" })}</span>
          <span class="brand-text">Ringtone Maker</span>
        </a>
        <nav class="nav" aria-label="Primary">
          ${LINKS.map(
            ({ to, label, Icon }) => html`
              <a
                key=${to}
                class="nav-link"
                href=${href(to)}
                data-active=${String(path === to)}
                aria-current=${path === to ? "page" : undefined}
                title=${label}
                onClick=${(e) => go(e, to)}
              >
                ${Icon({ "aria-hidden": "true" })}
                <span class="label">${label}</span>
              </a>
            `
          )}
        </nav>
      </div>
    </header>
  `;
}
