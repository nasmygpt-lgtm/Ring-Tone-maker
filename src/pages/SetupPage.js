import htm from "htm";
import React from "react";
import { applySeo } from "../lib/seo.js";
import { IconAndroid, IconApple, IconInfo, IconScissors } from "../components/icons.js";
import { navigate } from "../lib/router.js";

const html = htm.bind(React.createElement);

const ANDROID_STEPS = [
  { h: "Download your ringtone", p: "On the Cutter page, export your clip as a 320 kbps MP3. Save it to your phone (or AirDrop/transfer it over)." },
  { h: "Open the Files app", p: "Launch Files by Google (or your phone's file manager) and find the MP3 — usually in the Download folder." },
  { h: "Move it to Ringtones", p: "Long-press the file → Move to → internal storage → the Ringtones folder. If there isn't one, create a folder named Ringtones." },
  { h: "Open Sound settings", p: "Go to Settings → Sound & vibration → Phone ringtone (wording varies by brand: Samsung, Pixel, Xiaomi, etc.)." },
  { h: "Pick your ringtone", p: "Your file now appears in the list. Select it and confirm. Tip: tap the + / 'Add ringtone' option if your phone imports from Files directly." },
  { h: "Set per-contact (optional)", p: "Open a contact → Edit → Ringtone to give specific people their own ringtone." },
];

const IPHONE_STEPS = [
  { h: "Save the MP3 to your iPhone", p: "Export from the Cutter, then save the file to the Files app (iCloud Drive or On My iPhone). AirDrop from a Mac also works." },
  { h: "Open GarageBand", p: "Install GarageBand (free from the App Store) and create a new Audio Recorder track." },
  { h: "Import the file", p: "Tap the Tracks/Loop (loop icon) → Files → Browse items → select your MP3. Drag it onto the timeline." },
  { h: "Trim to 30 seconds", p: "iOS ringtones must be ≤ 30s. Your Ringtone Maker clip is already capped at 30s, so it fits — just make sure the whole clip sits at the start." },
  { h: "Export as a ringtone", p: "Tap the down-arrow / My Songs → long-press the project → Share → Ringtone. Name it and tap Export." },
  { h: "Set it in Settings", p: "Go to Settings → Sounds & Haptics → Ringtone and choose your new tone at the top of the list." },
];

const ANDROID_TROUBLE = [
  "Ringtone not showing? Make sure the file is in the Ringtones folder (not Download), then reboot or re-open Sound settings.",
  "Some phones only scan media on restart — toggle airplane mode or reboot to refresh the media library.",
  "File greyed out? Confirm it's a real MP3 (320 kbps exports from here are standard MPEG audio).",
  "Length limits vary; keeping clips ≤ 30s avoids silent-tail issues on budget devices.",
];
const IPHONE_TROUBLE = [
  "No 'Ringtone' share option? Update GarageBand and make sure the project is ≤ 30 seconds.",
  "'Ringtone must be shorter' error? Trim the GarageBand region so it ends before 30s.",
  "Exported but not in Settings? Fully close Settings and reopen; the new tone appears at the top under Ringtones.",
  "iPhones can't set a ringtone directly from the Files app — the GarageBand export step is required.",
];

export function SetupPage() {
  const [tab, setTab] = React.useState("android");

  React.useEffect(() => {
    applySeo({
      title: "Set Your Ringtone — Android & iPhone Guide",
      description:
        "Step-by-step guide to set a custom MP3 as your default ringtone. Android (Files + Settings) and iPhone (GarageBand export) instructions plus troubleshooting.",
      path: "/setup",
    });
  }, []);

  const steps = tab === "android" ? ANDROID_STEPS : IPHONE_STEPS;
  const trouble = tab === "android" ? ANDROID_TROUBLE : IPHONE_TROUBLE;

  return html`
    <div class="page">
      <div class="container">
        <section class="hero">
          <h1>Set it as your <span class="grad">default ringtone</span></h1>
          <p>You made the clip — here's how to make your phone actually ring with it. Pick your platform below.</p>
        </section>

        <div style=${{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
          <div class="tabs" role="tablist" aria-label="Platform">
            <button class="tab" role="tab" aria-selected=${String(tab === "android")}
              data-active=${String(tab === "android")} onClick=${() => setTab("android")}>
              ${IconAndroid({})} Android
            </button>
            <button class="tab" role="tab" aria-selected=${String(tab === "iphone")}
              data-active=${String(tab === "iphone")} onClick=${() => setTab("iphone")}>
              ${IconApple({})} iPhone
            </button>
          </div>
        </div>

        <div class="card">
          <div class="section-title" style=${{ marginBottom: "6px" }}>
            ${tab === "android" ? IconAndroid({}) : IconApple({})}
            ${tab === "android" ? "Android — Files & Settings" : "iPhone — GarageBand export"}
          </div>
          <p class="hint" style=${{ marginBottom: "8px" }}>
            ${tab === "android"
              ? "Exact wording differs by brand (Pixel, Samsung One UI, Xiaomi MIUI…), but the flow is the same."
              : "iOS doesn't allow setting a ringtone straight from Files — GarageBand is the official route."}
          </p>
          ${steps.map(
            (s, i) => html`
              <div class="step" key=${i}>
                <div class="n">${i + 1}</div>
                <div class="body">
                  <h4>${s.h}</h4>
                  <p>${s.p}</p>
                </div>
              </div>`
          )}
        </div>

        <div class="card">
          <div class="callout">
            <h4>${IconInfo({ style: { width: 15, height: 15, verticalAlign: "-2px", marginRight: 6 } })} Troubleshooting</h4>
            <ul>
              ${trouble.map((t, i) => html`<li key=${i}>${t}</li>`)}
            </ul>
          </div>
        </div>

        <div class="card">
          <div class="row row-between">
            <div>
              <div class="section-title" style=${{ marginBottom: "4px" }}>Need a clip first?</div>
              <p class="hint" style=${{ margin: 0 }}>Head back to the cutter to slice a new 320 kbps ringtone.</p>
            </div>
            <button class="btn btn-primary" onClick=${() => navigate("/")}>${IconScissors({})}<span>Open the Cutter</span></button>
          </div>
        </div>
      </div>
    </div>
  `;
}
