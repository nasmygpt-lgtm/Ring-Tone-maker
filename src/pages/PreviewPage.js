import htm from "htm";
import React from "react";
import { applySeo } from "../lib/seo.js";
import { consumeSharedRingtone } from "../lib/store.js";
import { getAudioContext, triggerDownload } from "../lib/audio.js";
import { navigate } from "../lib/router.js";
import {
  IconUpload, IconPlay, IconPause, IconStop, IconLoop, IconVolume, IconDownload,
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

  // The Web Audio graph is built ONLY when the gain boost is enabled. For normal
  // playback we drive the plain <audio> element's .volume, which is always audible.
  // (Calling createMediaElementSource reroutes the element exclusively through the
  // graph — a common cause of silent playback — so we avoid it unless boost is on.)
  async function ensureGraph() {
    const a = audioRef.current;
    if (!a) return false;
    if (!ctxRef.current) {
      try {
        ctxRef.current = getAudioContext();
        srcNodeRef.current = ctxRef.current.createMediaElementSource(a);
        gainRef.current = ctxRef.current.createGain();
        srcNodeRef.current.connect(gainRef.current).connect(ctxRef.current.destination);
      } catch (e) {
        // if the graph can't be built, fall back to element volume
        ctxRef.current = null; gainRef.current = null; srcNodeRef.current = null;
        return false;
      }
    }
    if (ctxRef.current.state === "suspended") await ctxRef.current.resume();
    return true;
  }

  // Apply current volume/boost to whichever output path is active.
  function applyVolume() {
    const a = audioRef.current;
    if (gainRef.current) {
      gainRef.current.gain.value = volume * (boost ? 2.5 : 1);
      if (a) a.volume = 1; // element at unity; gain node controls level
    } else if (a) {
      a.volume = Math.min(1, volume);
    }
  }

  // React to volume/boost changes.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (boost) {
        const ok = await ensureGraph(); // lazily build the graph the first time boost is on
        if (cancelled) return;
        if (!ok) { // graph unavailable -> clamp to element volume
          if (audioRef.current) audioRef.current.volume = Math.min(1, volume);
          return;
        }
      }
      applyVolume();
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line
  }, [volume, boost]);

  // Point the <audio> element at the current blob URL and (re)apply volume.
  React.useEffect(() => {
    const a = audioRef.current;
    if (!a || !url) return;
    a.src = url;
    a.load();
    setPlaying(false);
    applyVolume();
    // eslint-disable-next-line
  }, [url]);

  React.useEffect(() => {
    if (audioRef.current) audioRef.current.loop = loop;
  }, [loop, url]);

  async function togglePlay() {
    const a = audioRef.current;
    if (!a) return;
    if (boost) await ensureGraph();        // only engage Web Audio when boosting
    else if (ctxRef.current && ctxRef.current.state === "suspended") await ctxRef.current.resume();
    applyVolume();
    if (a.paused) {
      try { await a.play(); setPlaying(true); }
      catch (e) { setPlaying(false); }
    } else {
      a.pause();
      setPlaying(false);
    }
  }

  async function play() {
    const a = audioRef.current;
    if (!a || !a.paused) return;
    if (boost) await ensureGraph();
    else if (ctxRef.current && ctxRef.current.state === "suspended") await ctxRef.current.resume();
    applyVolume();
    try { await a.play(); setPlaying(true); } catch (e) { setPlaying(false); }
  }

  function pause() {
    const a = audioRef.current;
    if (a && !a.paused) { a.pause(); setPlaying(false); }
  }

  function stop() {
    const a = audioRef.current;
    if (a) { a.pause(); a.currentTime = 0; setPlaying(false); }
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
                    <button class="call-btn call-decline" aria-label="Stop" onClick=${stop}>
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

                <audio ref=${audioRef}
                  onEnded=${() => !loop && setPlaying(false)} style=${{ display: "none" }}></audio>

                <div class="row" style=${{ gap: "10px", marginBottom: "18px" }}>
                  <button class="btn btn-primary grow" onClick=${play} disabled=${playing} aria-label="Play">
                    ${IconPlay({})}<span>Play</span>
                  </button>
                  <button class="btn btn-ghost grow" onClick=${pause} disabled=${!playing} aria-label="Pause">
                    ${IconPause({})}<span>Pause</span>
                  </button>
                  <button class="btn btn-ghost btn-icon" onClick=${stop} title="Stop" aria-label="Stop">
                    ${IconStop({})}
                  </button>
                  <button class=${"btn btn-icon " + (loop ? "btn-secondary" : "btn-ghost")}
                    aria-pressed=${String(loop)} onClick=${() => setLoop((v) => !v)} title=${loop ? "Loop: on" : "Loop: off"} aria-label="Toggle loop">
                    ${IconLoop({})}
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
