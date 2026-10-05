import React from "react";
import { createRoot } from "react-dom/client";
import htm from "htm/react";
import { App } from "./App.js";

const html = htm.bind(React.createElement);

const root = createRoot(document.getElementById("root"));
root.render(html`<${App} />`);
