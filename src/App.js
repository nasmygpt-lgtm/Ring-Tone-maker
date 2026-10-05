import htm from "htm/react";
import React from "react";
import { useRoute } from "./lib/router.js";
import { TopBar } from "./components/TopBar.js";
import { Footer } from "./components/Footer.js";
import { Toaster } from "./components/Toaster.js";
import { CutterPage } from "./pages/CutterPage.js";
import { PreviewPage } from "./pages/PreviewPage.js";
import { SetupPage } from "./pages/SetupPage.js";

const html = htm.bind(React.createElement);

const ROUTES = {
  "/": CutterPage,
  "/preview": PreviewPage,
  "/setup": SetupPage,
};

function NotFound() {
  return html`
    <div class="page">
      <div class="container">
        <div class="card empty">
          <h2>Page not found</h2>
          <p class="hint">That route doesn't exist. Use the top bar to navigate.</p>
        </div>
      </div>
    </div>`;
}

export function App() {
  const path = useRoute();
  const Page = ROUTES[path] || NotFound;
  return html`
    <div class="app-shell">
      <${TopBar} />
      <${Page} />
      <${Footer} />
      <${Toaster} />
    </div>
  `;
}
