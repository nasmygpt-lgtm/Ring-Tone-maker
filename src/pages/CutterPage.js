import htm from "htm";
import React from "react";
import JSZip from "jszip";
import { Waveform } from "../components/Waveform.js";
import {
  decodeArrayBuffer, sliceBuffer, encodeMp3, formatTime, clampSegment,
  sanitizeFilename, triggerDownload, MAX_SEGMENT_SECONDS,
} from "../lib/audio.js";
import { applySeo } from "../lib/seo.js";
import { pushToast, setSharedRingtone } from "../lib/store.js";
import { navigate } from "../lib/router.js";
import {
  IconUpload, IconLink, IconScissors, IconPlus, IconTrash, IconDownload,
  IconZip, IconPlay, IconPause, IconBolt, IconMusic, IconPhone,
} from "../components/icons.js";

const html = htm.bind(React.createElement);

const REGION_COLORS = [
  "var(--region-1)", "var(--region-2)", "var(--region-3)", "var(--region-4)", "var(--region-5)",
];
const colorFor = (i) => REGION_COLORS[i % REGION_COLORS.length];

let segCounter = 0;
const newId = () => `seg_${++segCounter}`;

// ----- URL import guards -----
const BLOCKED_HOSTS = [
  "youtube.com", "youtu.be", "spotify.com", "soundcloud.com",
  "vimeo.com", "dailymotion.com", "tiktok.com",
];
const DIRECT_EXT = /\.(mp3|m4a|aac|wav|ogg|oga|opus|flac|webm|mp4)(\?.*)?$/i;

function describeUrl(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (BLOCKED_HOSTS.some((b) => host === b || host.endsWith("." + b))) {
      return { ok: false, reason: "streaming" };
    }
    if (!DIRECT_EXT.test(u.pathname)) return { ok: false, reason: "not-direct" };
    return { ok: true };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}

export function CutterPage() {
  const [fileName, setFileName] = React.useState("");
  const [blobUrl, setBlobUrl] = React.useState("");
  const [audioBuffer, setAudioBuffer] = React.useState(null);
  const [duration, setDuration] = React.useState(0);
  const [segments, setSegments] = React.useState([]);
  const [drag, setDrag] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [importUrl, setImportUrl] = React.useState("");
  const [urlNote, setUrlNote] = React.useState(null); // {type, text}
  const [cutCount, setCutCount] = React.useState(4);
  const [progress, setProgress] = React.useState(null); // {label, pct}
  const [playingSegId, setPlayingSegId] = React.useState(null); // which segment is previewing
  const fileInputRef = React.useRef(null);
  const waveApi = React.useRef(null);

  React.useEffect(() => {
    applySeo({
      title: "Ringtone Maker — Cut MP3 Ringtones in Your Browser",
      description:
        "Free browser-based MP3 cutter. Upload audio, auto-split into equal parts or cut by hand on a waveform, add fades, and download 320 kbps ringtones. 100% local — nothing is uploaded.",
      path: "/",
    });
  }, []);

  React.useEffect(() => () => { if (blobUrl) URL.revokeObjectURL(blobUrl); }, [blobUrl]);

  async function loadArrayBuffer(buf, name) {
    setLoading(true);
    try {
      const decoded = await decodeArrayBuffer(buf);
      const url = URL.createObjectURL(new Blob([buf]));
      setBlobUrl((old) => { if (old) URL.revokeObjectURL(old); return url; });
      setAudioBuffer(decoded);
      setFileName(name);
      setDuration(decoded.duration);
      setSegments([]);
      setCutCount(Math.max(2, Math.min(8, Math.ceil(decoded.duration / MAX_SEGMENT_SECONDS)) || 4));
      pushToast(`Loaded "${name}" (${formatTime(decoded.duration)})`, "success");
    } catch (e) {
      pushToast("Could not decode that audio file. Try MP3, M4A, WAV, or OGG.", "error");
    } finally {
      setLoading(false);
    }
  }

  function handleFiles(files) {
    const file = files && files[0];
    if (!file) return;
    if (!/^audio\/|video\/mp4|\.(mp3|m4a|aac|wav|ogg|oga|opus|flac)$/i.test(file.type + " " + file.name)) {
      // still try — some browsers report empty type for m4a
    }
    const reader = new FileReader();
    reader.onload = () => loadArrayBuffer(reader.result, file.name);
    reader.onerror = () => pushToast("Failed to read file.", "error");
    reader.readAsArrayBuffer(file);
  }

  async function importFromUrl() {
    setUrlNote(null);
    const url = importUrl.trim();
    if (!url) return;
    const check = describeUrl(url);
    if (!check.ok) {
      const msg = {
        streaming:
          "Streaming/download sites (YouTube, Spotify, SoundCloud…) can't be imported. Paste a direct link to an audio file instead (ending in .mp3, .m4a, .wav, …).",
        "not-direct":
          "That doesn't look like a direct audio file link. The URL should end in .mp3, .m4a, .aac, .wav, .ogg, or similar.",
        invalid: "That's not a valid URL.",
      }[check.reason];
      setUrlNote({ type: "warn", text: msg });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(url, { mode: "cors" });
      if (!res.ok) throw new Error("http " + res.status);
      const buf = await res.arrayBuffer();
      const name = decodeURIComponent(url.split("/").pop().split("?")[0]) || "import";
      await loadArrayBuffer(buf, name);
      setImportUrl("");
    } catch (e) {
      setUrlNote({
        type: "error",
        text:
          "Couldn't fetch that file. The server likely blocks cross-origin requests (CORS), or the link is private. " +
          "Also make sure you have the rights to use this audio — only import files you own or are licensed to use.",
      });
    } finally {
      setLoading(false);
    }
  }

  // ----- segment ops -----
  function addSegment(start, end, name) {
    const idx = segments.length;
    const c = clampSegment(start, end, duration);
    setSegments((prev) => [
      ...prev,
      {
        id: newId(),
        name: name || `Ringtone ${idx + 1}`,
        start: c.start,
        end: c.end,
        color: colorFor(idx),
        fadeIn: false,
        fadeOut: false,
      },
    ]);
  }

  function addManualSegment() {
    if (!audioBuffer) return;
    const start = Math.min(duration * 0.1, Math.max(0, duration - 1));
    const end = Math.min(start + Math.min(MAX_SEGMENT_SECONDS, duration), duration);
    addSegment(start, end);
  }

  function autoSplit() {
    if (!audioBuffer) return;
    const n = Math.max(2, Math.min(200, Math.round(cutCount)));
    const part = duration / n;
    const next = [];
    for (let i = 0; i < n; i++) {
      const start = i * part;
      let end = Math.min((i + 1) * part, duration);
      if (end - start > MAX_SEGMENT_SECONDS) end = start + MAX_SEGMENT_SECONDS; // cap each cut at 30s
      next.push({
        id: newId(),
        name: `Part ${i + 1}`,
        start,
        end,
        color: colorFor(i),
        fadeIn: false,
        fadeOut: false,
      });
    }
    setSegments(next);
    const capped = part > MAX_SEGMENT_SECONDS;
    pushToast(
      `Split into ${n} parts` + (capped ? ` — each capped at ${MAX_SEGMENT_SECONDS}s` : ""),
      "success"
    );
  }

  function updateSegment(id, patch) {
    setSegments((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  const onRegionUpdate = React.useCallback((id, start, end) => {
    setSegments((prev) =>
      prev.map((s) => (s.id === id ? { ...s, start, end } : s))
    );
  }, []);

  function removeSegment(id) {
    setSegments((prev) => prev.filter((s) => s.id !== id));
  }

  function playSegment(seg) {
    if (waveApi.current) waveApi.current.playRegion(seg.start, seg.end, seg.id);
  }

  function pausePreview() {
    if (waveApi.current) waveApi.current.pause();
  }

  async function buildBlob(seg) {
    const sliced = sliceBuffer(audioBuffer, seg.start, seg.end, {
      fadeIn: seg.fadeIn,
      fadeOut: seg.fadeOut,
    });
    return await encodeMp3(sliced, {
      onProgress: (p) => setProgress({ label: `Encoding "${seg.name}"`, pct: Math.round(p * 100) }),
    });
  }

  async function downloadOne(seg) {
    if (!audioBuffer) return;
    setProgress({ label: `Encoding "${seg.name}"`, pct: 0 });
    try {
      const blob = await buildBlob(seg);
      triggerDownload(blob, sanitizeFilename(seg.name));
      pushToast(`Downloaded "${sanitizeFilename(seg.name)}"`, "success");
    } catch (e) {
      pushToast("Encoding failed. Try a shorter clip.", "error");
    } finally {
      setProgress(null);
    }
  }

  async function sendToPreview(seg) {
    if (!audioBuffer) return;
    setProgress({ label: `Preparing "${seg.name}"`, pct: 0 });
    try {
      const blob = await buildBlob(seg);
      setSharedRingtone(sanitizeFilename(seg.name), blob);
      setProgress(null);
      navigate("/preview");
    } catch {
      setProgress(null);
      pushToast("Could not prepare preview.", "error");
    }
  }

  async function downloadAllZip() {
    if (!audioBuffer || !segments.length) return;
    const zip = new JSZip();
    const names = new Map();
    try {
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        setProgress({ label: `Encoding ${i + 1}/${segments.length}: "${seg.name}"`, pct: 0 });
        const blob = await buildBlob(seg);
        let fname = sanitizeFilename(seg.name);
        const count = names.get(fname) || 0; // de-dupe identical names
        names.set(fname, count + 1);
        if (count > 0) fname = fname.replace(/\.mp3$/, `_${count + 1}.mp3`);
        zip.file(fname, blob);
      }
      setProgress({ label: "Zipping…", pct: 100 });
      const zipBlob = await zip.generateAsync({ type: "blob" });
      triggerDownload(zipBlob, sanitizeFilename(fileName.replace(/\.[^.]+$/, "")) .replace(/\.mp3$/, "") + "_ringtones.zip");
      pushToast(`Downloaded ${segments.length} ringtones as ZIP`, "success");
    } catch (e) {
      pushToast("ZIP export failed.", "error");
    } finally {
      setProgress(null);
    }
  }

  const hasAudio = !!audioBuffer;

  return html`
    <div class="page">
      <div class="container">
        <section class="hero">
          <h1>Make <span class="grad">phone ringtones</span> in your browser</h1>
          <p>
            Upload a song, slice it into perfect clips on the waveform, add fades, and download
            crisp <b>320 kbps</b> MP3s. Everything runs locally — your audio is never uploaded.
          </p>
          <div class="badge-row">
            <span class="badge">${IconBolt({})} Auto-split 2–200 parts</span>
            <span class="badge">${IconScissors({})} 30s ringtone cap</span>
            <span class="badge">${IconMusic({})} 320 kbps export</span>
          </div>
        </section>

        ${!hasAudio
          ? html`
          <div class="card">
            <div
              class="dropzone"
              data-drag=${String(drag)}
              role="button" tabindex="0"
              onClick=${() => fileInputRef.current && fileInputRef.current.click()}
              onKeyDown=${(e) => (e.key === "Enter" || e.key === " ") && fileInputRef.current.click()}
              onDragOver=${(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave=${() => setDrag(false)}
              onDrop=${(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
            >
              <div class="dz-icon">${loading ? html`<span class="spinner"></span>` : IconUpload({})}</div>
              <h3>${loading ? "Decoding…" : "Drop an audio file here"}</h3>
              <p class="hint">or click to browse — MP3, M4A, AAC, WAV, OGG, FLAC</p>
              <input ref=${fileInputRef} type="file" accept="audio/*,.m4a,.aac,.flac,.ogg,.opus"
                style=${{ display: "none" }}
                onChange=${(e) => handleFiles(e.target.files)} />
              <div class="or">— or import by URL —</div>
              <div class="url-row" onClick=${(e) => e.stopPropagation()}>
                <input
                  class="input"
                  type="url"
                  placeholder="https://example.com/song.mp3"
                  value=${importUrl}
                  onChange=${(e) => setImportUrl(e.target.value)}
                  onKeyDown=${(e) => e.key === "Enter" && importFromUrl()}
                />
                <button class="btn btn-secondary" onClick=${importFromUrl} disabled=${loading}>
                  ${IconLink({})}<span>Import</span>
                </button>
              </div>
              ${urlNote &&
              html`<div class=${"alert " + (urlNote.type === "error" ? "alert-error" : "alert-warn")}
                     onClick=${(e) => e.stopPropagation()}>
                      ${IconLink({})}<span>${urlNote.text}</span>
                   </div>`}
              <div class="alert alert-info" onClick=${(e) => e.stopPropagation()} style=${{ marginTop: "12px" }}>
                ${IconLink({})}
                <span>
                  Direct audio links only — not YouTube/Spotify or download-site pages.
                  Imports may be blocked by the file host's CORS policy. Only use audio you own or are licensed to use.
                </span>
              </div>
            </div>
          </div>`
          : html`
          <!-- loaded: waveform + controls -->
          <div class="card">
            <div class="row row-between" style=${{ marginBottom: "16px" }}>
              <div class="section-title">${IconMusic({})} ${fileName}</div>
              <button class="btn btn-ghost btn-sm" onClick=${() => fileInputRef.current.click()}>
                ${IconUpload({})}<span>Replace</span>
              </button>
              <input ref=${fileInputRef} type="file" accept="audio/*,.m4a,.aac,.flac,.ogg,.opus"
                style=${{ display: "none" }} onChange=${(e) => handleFiles(e.target.files)} />
            </div>
            <${Waveform}
              blobUrl=${blobUrl}
              segments=${segments}
              onRegionUpdate=${onRegionUpdate}
              onReady=${(d) => setDuration(d)}
              onPlayingSeg=${setPlayingSegId}
              registerApi=${(api) => (waveApi.current = api)}
            />
          </div>

          <!-- auto split -->
          <div class="card">
            <div class="section-title" style=${{ marginBottom: "14px" }}>
              <span class="pill-num">1</span> Auto-split into equal parts
            </div>
            <div class="row" style=${{ gap: "20px" }}>
              <div class="field grow" style=${{ minWidth: "220px" }}>
                <label for="cutRange">Number of cuts: <b style=${{ color: "var(--violet-300)" }}>${cutCount}</b></label>
                <input id="cutRange" type="range" min="2" max="200" value=${cutCount}
                  onInput=${(e) => setCutCount(Number(e.target.value))} />
              </div>
              <div class="field">
                <label for="cutNum">Exact</label>
                <input id="cutNum" class="num-input" type="number" min="2" max="200" value=${cutCount}
                  onChange=${(e) => setCutCount(Math.max(2, Math.min(200, Number(e.target.value) || 2)))} />
              </div>
              <button class="btn btn-primary" onClick=${autoSplit} style=${{ alignSelf: "flex-end" }}>
                ${IconScissors({})}<span>Split</span>
              </button>
            </div>
            <p class="hint" style=${{ marginTop: "10px" }}>
              Divides the track into ${cutCount} equal pieces (~${formatTime(duration / cutCount)} each).
              Any piece longer than ${MAX_SEGMENT_SECONDS}s is capped to ${MAX_SEGMENT_SECONDS}s.
            </p>
          </div>

          <!-- segments -->
          <div class="card">
            <div class="row row-between" style=${{ marginBottom: "14px" }}>
              <div class="section-title"><span class="pill-num">2</span> Segments
                ${segments.length ? html`<span class="muted" style=${{ fontWeight: 400 }}>(${segments.length})</span>` : ""}
              </div>
              <div class="row" style=${{ gap: "8px" }}>
                <button class="btn btn-ghost btn-sm" onClick=${addManualSegment}>${IconPlus({})}<span>Add segment</span></button>
                <button class="btn btn-secondary btn-sm" onClick=${downloadAllZip}
                  disabled=${!segments.length || !!progress}>${IconZip({})}<span>Download all (ZIP)</span></button>
              </div>
            </div>

            ${progress &&
            html`<div style=${{ marginBottom: "14px" }}>
                   <div class="row row-between" style=${{ marginBottom: "6px" }}>
                     <span class="hint">${progress.label}</span><span class="time">${progress.pct}%</span>
                   </div>
                   <div class="progress"><div style=${{ width: progress.pct + "%" }}></div></div>
                 </div>`}

            ${!segments.length
              ? html`<div class="empty">
                       ${IconScissors({})}
                       <p>No segments yet. Use <b>Auto-split</b> above or <b>Add segment</b> to start cutting.</p>
                     </div>`
              : html`<div class="seg-list">
                  ${segments.map((seg, i) => {
                    const len = seg.end - seg.start;
                    const over = len > MAX_SEGMENT_SECONDS + 0.01;
                    return html`
                      <div class="seg" key=${seg.id} style=${{ "--seg-color": seg.color }}>
                        <div class="seg-head">
                          <span class="seg-swatch"></span>
                          <input class="seg-name" value=${seg.name}
                            aria-label="Segment name"
                            onChange=${(e) => updateSegment(seg.id, { name: e.target.value })} />
                          <button class="btn btn-ghost btn-icon btn-sm" aria-label="Delete segment"
                            onClick=${() => removeSegment(seg.id)}>${IconTrash({})}</button>
                        </div>
                        <div class="seg-meta">
                          <span class="seg-stat">Start <b>${formatTime(seg.start)}</b></span>
                          <span class="seg-stat">End <b>${formatTime(seg.end)}</b></span>
                          <span class="seg-stat">Length <b style=${over ? { color: "var(--warning)" } : null}>${formatTime(len)}</b></span>
                        </div>
                        <div class="seg-actions">
                          <label class="toggle">
                            <input type="checkbox" checked=${seg.fadeIn}
                              onChange=${(e) => updateSegment(seg.id, { fadeIn: e.target.checked })} />
                            <span class="track"></span> Fade in
                          </label>
                          <label class="toggle">
                            <input type="checkbox" checked=${seg.fadeOut}
                              onChange=${(e) => updateSegment(seg.id, { fadeOut: e.target.checked })} />
                            <span class="track"></span> Fade out
                          </label>
                          <span class="grow"></span>
                          <button class=${"btn btn-sm " + (playingSegId === seg.id ? "btn-secondary" : "btn-ghost")}
                            onClick=${() => playSegment(seg)}
                            aria-label="Preview segment">
                            ${IconPlay({})}<span>Preview</span>
                          </button>
                          <button class="btn btn-ghost btn-sm" onClick=${pausePreview}
                            disabled=${playingSegId !== seg.id}
                            aria-label="Pause preview">
                            ${IconPause({})}<span>Pause</span>
                          </button>
                          <button class="btn btn-ghost btn-sm" onClick=${() => sendToPreview(seg)} title="Open in ringtone preview">${IconPhone({})}<span>Try as ringtone</span></button>
                          <button class="btn btn-primary btn-sm" onClick=${() => downloadOne(seg)} disabled=${!!progress}>${IconDownload({})}<span>MP3</span></button>
                        </div>
                      </div>`;
                  })}
                </div>`}
          </div>`}
      </div>
    </div>
  `;
}
