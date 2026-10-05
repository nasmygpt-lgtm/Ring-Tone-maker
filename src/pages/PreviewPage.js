import htm from "htm/react";
import React from "react";
import { applySeo } from "../lib/seo.js";
import { consumeSharedRingtone } from "../lib/store.js";
import { getAudioContext, triggerDownload } from "../lib/audio.js";
import { navigate } from "../lib/router.js";
import {
  IconUpload, IconPlay, IconPause, IconLoop, IconVolume, IconDownload,
  IconPhone, IconUser, IconX, IconScissors,
} from "../components/icons.js";

const html = htm.bind(React.createElement);

export function PreviewPage() {
  const [name, setName] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [blob, setBlob] = React.useState(null);
  const [playing, setPlaying] = React.useState(false);
  const [loop, setLoop] = React.useState(true);
  const [volume, setVolume] = React.useState(0.8);
  const [boost, setBoost] = React.useState(false); // gain boost beyond 100%
  const fileRef = React.useRef(null);

  const audioRef = React.useRef(null);
  const ctxRef = React.useRef(null);
  const gainRef = React.useRef(null);
  const srcNodeRef = React.useRef(null);

  React.useEffect(() => {
    applySeo({
      title: "Ringtone Preview — Loop & Test Your Ringtone",
      description:
        "Preview and loop your ringtone with a mock incoming-call screen. Adjust volume, apply a gain boost, and download the file. Runs entirely in your browser.",
      path: "/preview",
    });
  }, []);

  // Pick up a ringtone handed over from the cutter, if any.
  React.useEffect(() => {
    const shared = consumeSharedRingtone();
    if (shared) loadBlob(shared.blob, shared.name);
    return () => { if (url) URL.revokeObjectURL(url); };
    // eslint-disable-next-line
  }, []);

  function loadBlob(b, n) {
    setUrl((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(b); });
    setBlob(b);
    setName(n);
    setPlaying(false);
  }

  function handleFiles(files) {
    const f = files && files[0];
    if (!f) return;
    loadBlob(f, f.name);
  }

  // Set up WebAudio graph (for gain boost) once we have an <audio> element.
  function ensureGraph() {
    if (!audioRef.current) return;
    if (!ctxRef.current) {
      ctxRef.current = getAudioContext();
      srcNodeRef.current = ctxRef.current.createMediaElementSource(audioRef.current);
      gainRef.current = ctxRef.current.createGain();
      srcNodeRef.current.connect(gainRef.current).connect(ctxRef.current.destination);
    }
  }

  // Apply volume + boost to the graph / element.
  React.useEffect(() => {
    if (gainRef.current) {
      // boost multiplies up to 2.5x on top of the slider
      gainRef.current.gain.value = volume * (boost ? 2.5 : 1);
    } else if (audioRef.current) {
      audioRef.current.volume = Math.min(1, volume);
    }
  }, [volume, boost]);

  React.useEffect(() => {
    if (audioRef.current) audioRef.current.loop = loop;
  }, [loop, url]);

  async function togglePlay() {
    const a = audioRef.current;
    if (!a) return;
    ensureGraph();
    if (ctxRef.current && ctxRef.current.state === "suspended") await ctxRef.current.resume();
    if (gainRef.current) gainRef.current.gain.value = volume * (boost ? 2.5 : 1);
    else a.volume = Math.min(1, volume);
    if (a.paused) { await a.play(); setPlaying(true); }
    else { a.pause(); setPlaying(false); }
  }

  function download() {
    if (blob) triggerDownload(blob, name || "ringtone.mp3");
  }

  const hasAudio = !!url;

  return html`
    <div class="page">
      <div class="container">
        <section class="hero">
          <h1>Ringtone <span class="grad">preview</span></h1>
          <p>Hear your ringtone the way it'll sound on a call. Loop it, tune the volume, give it a gain boost, and download when it's right.</p>
        </section>

        <div class="grid-2">
          <!-- phone mock -->
          <div class="card">
            <div class="phone-stage">
              <div class="phone">
                <div class="notch"></div>
                <div class="call-top">
                  <div class="call-status">${playing ? "Incoming call" : "Preview"}</div>
                  <div class="caller">${name ? name.replace(/\.[^.]+$/, "") : "Unknown"}</div>
                  <div class="caller-sub">mobile • Ringtone Maker</div>
                </div>
                <div class=${"avatar" + (playing ? " ringing" : "")}>${IconUser({})}</div>
                <div class="call-actions">
                  <div>
                    <button class="call-btn call-decline" aria-label="Stop"
                      onClick=${() => { const a = audioRef.current; if (a) { a.pause(); a.currentTime = 0; setPlaying(false); } }}>
                      ${IconX({})}
                    </button>
                    <div class="call-label">Decline</div>
                  </div>
                  <div>
                    <button class="call-btn call-accept" aria-label=${playing ? "Pause" : "Play"} onClick=${togglePlay}>
                      ${playing ? IconPause({}) : IconPhone({})}
                    </button>
                    <div class="call-label">${playing ? "Ringing…" : "Answer"}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- controls -->
          <div class="card">
            ${!hasAudio
              ? html`
                <div class="section-title" style=${{ marginBottom: "12px" }}>${IconUpload({})} Load a ringtone</div>
                <div class="dropzone" role="button" tabindex="0"
                  onClick=${() => fileRef.current.click()}
                  onKeyDown=${(e) => (e.key === "Enter" || e.key === " ") && fileRef.current.click()}
                  onDragOver=${(e) => e.preventDefault()}
                  onDrop=${(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}>
                  <div class="dz-icon">${IconUpload({})}</div>
                  <h3>Upload a ringtone file</h3>
                  <p class="hint">MP3, M4A, WAV, OGG — or make one on the Cutter page</p>
                </div>
                <input ref=${fileRef} type="file" accept="audio/*,.m4a,.aac,.flac,.ogg"
                  style=${{ display: "none" }} onChange=${(e) => handleFiles(e.target.files)} />
                <button class="btn btn-ghost btn-block" style=${{ marginTop: "14px" }} onClick=${() => navigate("/")}>
                  ${IconScissors({})}<span>Go to the Cutter</span>
                </button>`
              : html`
                <div class="row row-between" style=${{ marginBottom: "16px" }}>
                  <div class="section-title">${IconPhone({})} ${name}</div>
                  <button class="btn btn-ghost btn-sm" onClick=${() => fileRef.current.click()}>${IconUpload({})}<span>Change</span></button>
                  <input ref=${fileRef} type="file" accept="audio/*,.m4a,.aac,.flac,.ogg"
                    style=${{ display: "none" }} onChange=${(e) => handleFiles(e.target.files)} />
                </div>

                <audio ref=${audioRef} src=${url} crossorigin="anonymous"
                  onEnded=${() => !loop && setPlaying(false)} style=${{ display: "none" }}></audio>

                <div class="row" style=${{ gap: "10px", marginBottom: "18px" }}>
                  <button class="btn btn-primary grow" onClick=${togglePlay}>
                    ${playing ? IconPause({}) : IconPlay({})}<span>${playing ? "Pause" : "Play"}</span>
                  </button>
                  <button class=${"btn btn-sm " + (loop ? "btn-secondary" : "btn-ghost")}
                    aria-pressed=${String(loop)} onClick=${() => setLoop((v) => !v)} title="Loop">
                    ${IconLoop({})}<span>Loop</span>
                  </button>
                </div>

                <div class="field" style=${{ marginBottom: "16px" }}>
                  <label>${IconVolume({ style: { width: 15, height: 15, verticalAlign: "-2px", marginRight: 6 } })}
                    Volume — ${Math.round(volume * 100)}%</label>
                  <input type="range" min="0" max="1" step="0.01" value=${volume}
                    onInput=${(e) => setVolume(Number(e.target.value))} />
                </div>

                <label class="toggle" style=${{ fontSize: ".92rem" }}>
                  <input type="checkbox" checked=${boost} onChange=${(e) => setBoost(e.target.checked)} />
                  <span class="track"></span>
                  Gain boost (+2.5×) — louder than the device max
                </label>
                <p class="hint" style=${{ marginTop: "8px" }}>
                  Boost uses the Web Audio API gain node. Very high levels can clip; use sparingly.
                </p>

                <button class="btn btn-primary btn-block" style=${{ marginTop: "18px" }} onClick=${download}>
                  ${IconDownload({})}<span>Download ringtone</span>
                </button>`}
          </div>
        </div>
      </div>
    </div>
  `;
}
