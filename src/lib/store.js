import React from "react";

/* ---------------- toast store ---------------- */
const toastListeners = new Set();
let toasts = [];
let toastId = 0;

export function pushToast(message, type = "info", ms = 3200) {
  const id = ++toastId;
  toasts = [...toasts, { id, message, type }];
  toastListeners.forEach((fn) => fn(toasts));
  if (ms) setTimeout(() => dismissToast(id), ms);
  return id;
}
export function dismissToast(id) {
  toasts = toasts.filter((t) => t.id !== id);
  toastListeners.forEach((fn) => fn(toasts));
}
export function useToasts() {
  const [state, setState] = React.useState(toasts);
  React.useEffect(() => {
    toastListeners.add(setState);
    return () => toastListeners.delete(setState);
  }, []);
  return state;
}

/* ---------------- shared ringtone handoff ----------------
   Lets the cutter hand a freshly made segment Blob to /preview
   without re-uploading. In-memory only; never persisted/uploaded. */
let sharedRingtone = null; // { name, blob }
const ringtoneListeners = new Set();

export function setSharedRingtone(name, blob) {
  sharedRingtone = { name, blob };
  ringtoneListeners.forEach((fn) => fn(sharedRingtone));
}
export function consumeSharedRingtone() {
  const r = sharedRingtone;
  sharedRingtone = null;
  return r;
}
export function useSharedRingtone() {
  const [state, setState] = React.useState(sharedRingtone);
  React.useEffect(() => {
    ringtoneListeners.add(setState);
    return () => ringtoneListeners.delete(setState);
  }, []);
  return state;
}
