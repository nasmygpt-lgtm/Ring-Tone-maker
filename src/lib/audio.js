// All audio processing is local. Nothing is uploaded anywhere.
import * as lamejsNS from "lamejs";

// esm.sh may expose lamejs as a default export, as named exports, or both.
// Resolve a Mp3Encoder constructor from whatever shape we get.
const lamejs = (() => {
  const ns = lamejsNS || {};
  if (ns.Mp3Encoder) return ns;
  if (ns.default && ns.default.Mp3Encoder) return ns.default;
  if (ns.default) return ns.default;
  return ns;
})();

export const MAX_SEGMENT_SECONDS = 30; // standard ringtone cap
export const FADE_SECONDS = 0.5;
export const EXPORT_BITRATE_KBPS = 320; // high quality

let _ctx = null;
export function getAudioContext() {
  if (!_ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    _ctx = new AC();
  }
  if (_ctx.state === "suspended") _ctx.resume().catch(() => {});
  return _ctx;
}

// Decode an ArrayBuffer into an AudioBuffer.
export async function decodeArrayBuffer(arrayBuffer) {
  const ctx = getAudioContext();
  // decodeAudioData wants its own copy; slice to be safe across browsers.
  const copy = arrayBuffer.slice(0);
  return await new Promise((resolve, reject) => {
    ctx.decodeAudioData(copy, resolve, (e) => reject(e || new Error("Could not decode audio.")));
  });
}

export function formatTime(sec) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const cs = Math.floor((sec * 100) % 100);
  return `${m}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

export function clampSegment(start, end, duration) {
  start = Math.max(0, Math.min(start, duration));
  end = Math.max(0, Math.min(end, duration));
  if (end < start) [start, end] = [end, start];
  if (end - start > MAX_SEGMENT_SECONDS) end = start + MAX_SEGMENT_SECONDS;
  return { start, end };
}

/**
 * Extract [start,end] from an AudioBuffer into a new AudioBuffer,
 * optionally applying a linear fade in/out.
 */
export function sliceBuffer(audioBuffer, start, end, { fadeIn = false, fadeOut = false } = {}) {
  const ctx = getAudioContext();
  const sr = audioBuffer.sampleRate;
  const channels = audioBuffer.numberOfChannels;
  const startSample = Math.floor(start * sr);
  const endSample = Math.min(Math.floor(end * sr), audioBuffer.length);
  const frameCount = Math.max(1, endSample - startSample);

  const out = ctx.createBuffer(channels, frameCount, sr);
  const fadeSamples = Math.min(Math.floor(FADE_SECONDS * sr), Math.floor(frameCount / 2));

  for (let ch = 0; ch < channels; ch++) {
    const src = audioBuffer.getChannelData(ch);
    const dst = out.getChannelData(ch);
    for (let i = 0; i < frameCount; i++) {
      let sample = src[startSample + i] || 0;
      if (fadeIn && i < fadeSamples) sample *= i / fadeSamples;
      if (fadeOut && i >= frameCount - fadeSamples) sample *= (frameCount - i) / fadeSamples;
      dst[i] = sample;
    }
  }
  return out;
}

function floatToInt16(float32) {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    let s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16;
}

/**
 * Encode an AudioBuffer to a 320 kbps MP3 Blob using lamejs.
 * onProgress(0..1) is optional.
 */
export async function encodeMp3(audioBuffer, { bitrate = EXPORT_BITRATE_KBPS, onProgress } = {}) {
  const channels = Math.min(audioBuffer.numberOfChannels, 2);
  const sampleRate = audioBuffer.sampleRate;
  if (!lamejs || typeof lamejs.Mp3Encoder !== "function") {
    throw new Error("MP3 encoder failed to load from CDN. Check your internet connection and try again.");
  }
  const encoder = new lamejs.Mp3Encoder(channels, sampleRate, bitrate);

  const left = floatToInt16(audioBuffer.getChannelData(0));
  const right = channels > 1 ? floatToInt16(audioBuffer.getChannelData(1)) : null;

  const blockSize = 1152;
  const data = [];
  const total = left.length;

  for (let i = 0; i < total; i += blockSize) {
    const l = left.subarray(i, i + blockSize);
    let chunk;
    if (channels > 1) {
      const r = right.subarray(i, i + blockSize);
      chunk = encoder.encodeBuffer(l, r);
    } else {
      chunk = encoder.encodeBuffer(l);
    }
    if (chunk.length > 0) data.push(new Uint8Array(chunk));

    if (onProgress && (i % (blockSize * 64) === 0)) {
      onProgress(Math.min(0.98, i / total));
      // yield to the UI thread so progress is visible on long clips
      await new Promise((r) => setTimeout(r, 0));
    }
  }
  const flush = encoder.flush();
  if (flush.length > 0) data.push(new Uint8Array(flush));
  if (onProgress) onProgress(1);

  return new Blob(data, { type: "audio/mpeg" });
}

export function sanitizeFilename(name) {
  const base = (name || "ringtone").replace(/[^\w\-]+/g, "_").replace(/^_+|_+$/g, "");
  return (base || "ringtone") + ".mp3";
}

export function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
