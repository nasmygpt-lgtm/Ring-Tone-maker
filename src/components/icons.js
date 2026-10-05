import htm from "htm";
import React from "react";
const html = htm.bind(React.createElement);

// Lightweight inline icon set (stroke = currentColor), tree-shakeable by use.
const svg = (children, props = {}) =>
  html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round" ...${props}>${children}</svg>`;

export const IconScissors = (p) =>
  svg(html`<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>`, p);
export const IconWave = (p) =>
  svg(html`<path d="M2 12h2l2-7 3 14 3-11 2 6h2l2-4h4"/>`, p);
export const IconPhone = (p) =>
  svg(html`<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>`, p);
export const IconSettings = (p) =>
  svg(html`<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>`, p);
export const IconUpload = (p) =>
  svg(html`<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>`, p);
export const IconLink = (p) =>
  svg(html`<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>`, p);
export const IconPlay = (p) => svg(html`<polygon points="5 3 19 12 5 21 5 3"/>`, p);
export const IconPause = (p) => svg(html`<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>`, p);
export const IconStop = (p) => svg(html`<rect x="5" y="5" width="14" height="14" rx="2"/>`, p);
export const IconDownload = (p) =>
  svg(html`<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>`, p);
export const IconTrash = (p) =>
  svg(html`<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>`, p);
export const IconPlus = (p) => svg(html`<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>`, p);
export const IconZip = (p) =>
  svg(html`<path d="M21 8v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h8z"/><polyline points="13 1 13 9 21 9"/><path d="M10 12h1v1h-1zM10 15h1v1h-1z"/>`, p);
export const IconLoop = (p) =>
  svg(html`<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>`, p);
export const IconVolume = (p) =>
  svg(html`<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/>`, p);
export const IconShield = (p) =>
  svg(html`<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>`, p);
export const IconBolt = (p) =>
  svg(html`<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>`, p);
export const IconCheck = (p) => svg(html`<polyline points="20 6 9 17 4 12"/>`, p);
export const IconX = (p) => svg(html`<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>`, p);
export const IconInfo = (p) => svg(html`<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>`, p);
export const IconAlert = (p) => svg(html`<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`, p);
export const IconApple = (p) =>
  svg(html`<path d="M12 20.5c-1.5 0-2-1-3.5-1s-2.5 1-3.5 0c-1.6-1.6-2.5-5-2.5-7.5 0-3 2-5 4.5-5 1.5 0 2.5 1 3.5 1s2-1 3.5-1c1.3 0 2.6.6 3.4 1.7"/><path d="M12 7c0-2 1.5-3.5 3.5-3.5"/>`, p);
export const IconAndroid = (p) =>
  svg(html`<path d="M6 10v7a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-7"/><path d="M6 10a6 6 0 0 1 12 0"/><line x1="8" y1="4" x2="9.5" y2="6.5"/><line x1="16" y1="4" x2="14.5" y2="6.5"/><line x1="9" y1="9" x2="9" y2="9.01"/><line x1="15" y1="9" x2="15" y2="9.01"/><line x1="4" y1="12" x2="4" y2="16"/><line x1="20" y1="12" x2="20" y2="16"/><line x1="9" y1="18" x2="9" y2="21"/><line x1="15" y1="18" x2="15" y2="21"/>`, p);
export const IconUser = (p) =>
  svg(html`<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`, p);
export const IconMusic = (p) =>
  svg(html`<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>`, p);
