import htm from "htm";
import React from "react";
import WaveSurfer from "wavesurfer";
import RegionsPlugin from "wavesurfer/regions";
import { formatTime, MAX_SEGMENT_SECONDS } from "../lib/audio.js";
import { IconPlay, IconPause, IconStop } from "./icons.js";

const html = htm.bind(React.createElement);

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/**
 * Waveform renders the shared waveform + draggable regions.
 * Props:
 *   blobUrl         object URL for the loaded audio
 *   segments        [{id, name, start, end, color}]
 *   onRegionUpdate  (id, start, end) => void   (fired as a region is dragged/resized)
 *   onReady         (durationSeconds) => void
 *   registerApi     (api) => void  — exposes { playRegion, stop } to parent
 */
export function Waveform({ blobUrl, segments, onRegionUpdate, onReady, registerApi, onPlayingSeg }) {
  const hostRef = React.useRef(null);
  const wsRef = React.useRef(null);
  const regionsRef = React.useRef(null);
  const regionMap = React.useRef(new Map()); // segId -> region
  const [isPlaying, setPlayingState] = React.useState(false);
  const isPlayingRef = React.useRef(false);
  const setPlaying = (v) => { isPlayingRef.current = v; setPlayingState(v); };
  const [cursor, setCursor] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const playBoundRef = React.useRef(null); // {end, segId} for region playback
  const playingSegRef = React.useRef(null); // id of the segment currently previewing

  // keep latest callbacks without re-creating wavesurfer
  const cbRef = React.useRef({});
  cbRef.current = { onRegionUpdate, onReady, onPlayingSeg };

  function notifyPlayingSeg(id) {
    playingSegRef.current = id;
    cbRef.current.onPlayingSeg && cbRef.current.onPlayingSeg(id);
  }

  // --- create wavesurfer once per blobUrl ---
  React.useEffect(() => {
    if (!blobUrl || !hostRef.current) return;
    const regions = RegionsPlugin.create();
    const ws = WaveSurfer.create({
      container: hostRef.current,
      height: 128,
      waveColor: cssVar("--wave-color", "#4b5680"),
      progressColor: cssVar("--wave-progress", "#a78bfa"),
      cursorColor: cssVar("--wave-cursor", "#38e0f0"),
      cursorWidth: 2,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      normalize: true,
      plugins: [regions],
    });
    wsRef.current = ws;
    regionsRef.current = regions;

    ws.load(blobUrl);

    ws.on("ready", () => {
      const d = ws.getDuration();
      setDuration(d);
      cbRef.current.onReady && cbRef.current.onReady(d);
    });
    ws.on("timeupdate", (t) => {
      setCursor(t);
      const bound = playBoundRef.current;
      if (bound && t >= bound.end) {
        ws.pause();
        playBoundRef.current = null;
        notifyPlayingSeg(null); // region preview reached its end
      }
    });
    ws.on("play", () => setPlaying(true));
    ws.on("pause", () => { setPlaying(false); notifyPlayingSeg(null); });
    ws.on("finish", () => { setPlaying(false); notifyPlayingSeg(null); });

    // region drag/resize -> clamp to MAX and report up
    regions.on("region-updated", (region) => {
      let start = region.start;
      let end = region.end;
      if (end - start > MAX_SEGMENT_SECONDS) {
        end = start + MAX_SEGMENT_SECONDS;
        region.setOptions({ start, end });
      }
      const segId = region.id;
      cbRef.current.onRegionUpdate && cbRef.current.onRegionUpdate(segId, start, end);
    });

    return () => {
      try { ws.destroy(); } catch {}
      wsRef.current = null;
      regionsRef.current = null;
      regionMap.current = new Map();
    };
  }, [blobUrl]);

  // --- sync segments -> regions ---
  React.useEffect(() => {
    const regions = regionsRef.current;
    const ws = wsRef.current;
    if (!regions || !ws || !duration) return;

    const seen = new Set();
    segments.forEach((seg) => {
      seen.add(seg.id);
      let region = regionMap.current.get(seg.id);
      if (!region) {
        region = regions.addRegion({
          id: seg.id,
          start: seg.start,
          end: seg.end,
          color: seg.color,
          drag: true,
          resize: true,
        });
        regionMap.current.set(seg.id, region);
      } else {
        // update only if changed (avoid feedback loops)
        if (Math.abs(region.start - seg.start) > 0.001 || Math.abs(region.end - seg.end) > 0.001) {
          region.setOptions({ start: seg.start, end: seg.end, color: seg.color });
        } else if (region.color !== seg.color) {
          region.setOptions({ color: seg.color });
        }
      }
    });
    // remove deleted
    for (const [id, region] of regionMap.current.entries()) {
      if (!seen.has(id)) {
        try { region.remove(); } catch {}
        regionMap.current.delete(id);
      }
    }
  }, [segments, duration]);

  // --- expose imperative API to parent (preview a region) ---
  React.useEffect(() => {
    if (!registerApi) return;
    const playRegion = (start, end, segId) => {
      const ws = wsRef.current;
      if (!ws) return;
      playBoundRef.current = { end, segId: segId || null };
      ws.setTime(start);
      ws.play();
      notifyPlayingSeg(segId || null);
    };
    registerApi({
      playRegion,
      // Toggle a specific segment's preview: play it, or pause if it's already the one playing.
      toggleRegion: (start, end, segId) => {
        const ws = wsRef.current;
        if (!ws) return;
        const isThisPlaying = playingSegRef.current === segId && isPlayingRef.current;
        if (isThisPlaying) {
          ws.pause();
          notifyPlayingSeg(null);
        } else {
          playRegion(start, end, segId);
        }
      },
      pause: () => {
        const ws = wsRef.current;
        if (ws && isPlayingRef.current) ws.pause();
        notifyPlayingSeg(null);
      },
      stop: () => {
        const ws = wsRef.current;
        if (ws) { ws.pause(); ws.setTime(0); }
        playBoundRef.current = null;
        notifyPlayingSeg(null);
      },
    });
  }, [registerApi, duration]);

  const togglePlay = () => {
    const ws = wsRef.current;
    if (!ws) return;
    playBoundRef.current = null; // full-track play
    ws.playPause();
  };
  const stop = () => {
    const ws = wsRef.current;
    if (!ws) return;
    ws.pause();
    ws.setTime(0);
    playBoundRef.current = null;
  };

  return html`
    <div class="wave-wrap">
      <div class="wave-host" ref=${hostRef}></div>
      <div class="transport">
        <button class="btn btn-primary btn-sm" onClick=${togglePlay} aria-label=${isPlaying ? "Pause" : "Play"}>
          ${isPlaying ? IconPause({ "aria-hidden": "true" }) : IconPlay({ "aria-hidden": "true" })}
          <span>${isPlaying ? "Pause" : "Play"}</span>
        </button>
        <button class="btn btn-ghost btn-sm" onClick=${stop} aria-label="Stop">
          ${IconStop({ "aria-hidden": "true" })}
        </button>
        <span class="time grow">${formatTime(cursor)} <span class="muted">/ ${formatTime(duration)}</span></span>
      </div>
    </div>
  `;
}
