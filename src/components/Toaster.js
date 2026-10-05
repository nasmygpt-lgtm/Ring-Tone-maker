import htm from "htm";
import React from "react";
import { useToasts, dismissToast } from "../lib/store.js";
import { IconCheck, IconAlert, IconInfo, IconX } from "./icons.js";

const html = htm.bind(React.createElement);
const ICONS = { success: IconCheck, error: IconAlert, info: IconInfo };

export function Toaster() {
  const toasts = useToasts();
  if (!toasts.length) return null;
  return html`
    <div class="toasts" role="status" aria-live="polite">
      ${toasts.map((t) => {
        const Icon = ICONS[t.type] || IconInfo;
        return html`
          <div key=${t.id} class=${"toast " + t.type}>
            ${Icon({ "aria-hidden": "true" })}
            <span class="grow">${t.message}</span>
            <button class="btn btn-ghost btn-icon btn-sm" aria-label="Dismiss" onClick=${() => dismissToast(t.id)}>
              ${IconX({ "aria-hidden": "true" })}
            </button>
          </div>
        `;
      })}
    </div>
  `;
}
