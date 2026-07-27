// Local browser notifications + daily reminder scheduling.
//
// Limitations of a pure browser app (no backend):
//   • While the tab/PWA is open we can fire notifications via setTimeout.
//   • If the PWA is installed, an active service worker can show reminders
//     when the OS wakes it.
//   • For TRUE background push to a closed app you need Firebase Cloud
//     Messaging + a small server (e.g. Cloud Function) that pushes daily.
//     A starter is documented in README.md.

const STORAGE_KEY = "wound_reminder_v1";

export async function ensurePermission() {
  if (!("Notification" in window)) {
    throw new Error("This browser does not support notifications.");
  }
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") {
    throw new Error("Notifications were blocked. Enable them in browser settings.");
  }
  const p = await Notification.requestPermission();
  return p === "granted";
}

export async function registerSW() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("sw.js");
  } catch (e) {
    console.warn("SW registration failed:", e);
    return null;
  }
}

export function saveReminder(plan) {
  const startedAt = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    startedAt,
    timeline: plan.timeline_14d || [],
    assessment: plan.assessment || "",
  }));
  scheduleNext();
}

export function clearReminder() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getReminder() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); }
  catch { return null; }
}

let timer = null;

/** Schedules the next in-app notification (next 09:00 local, or +24h). */
export function scheduleNext() {
  if (timer) clearTimeout(timer);
  const data = getReminder();
  if (!data) return;

  const now = new Date();
  const next = new Date();
  next.setHours(9, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  const wait = next.getTime() - now.getTime();

  timer = setTimeout(async () => {
    await fireDailyReminder();
    scheduleNext();
  }, wait);
}

async function fireDailyReminder() {
  const data = getReminder();
  if (!data) return;
  const dayNum = Math.floor((Date.now() - data.startedAt) / 86400000);
  const entry = (data.timeline || []).find(t => t.day === dayNum)
    || (data.timeline || []).slice().reverse().find(t => t.day <= dayNum);
  const body = entry
    ? `Day ${dayNum}: ${entry.expected} — ${entry.action}`
    : `Day ${dayNum}: keep the wound clean, dry, and covered. Watch for redness or swelling.`;
  await showNotification("🩹 Wound care check-in", body);
}

export async function showNotification(title, body) {
  const reg = await navigator.serviceWorker?.getRegistration();
  const opts = { body, icon: "icon.svg", badge: "icon.svg", tag: "wound-daily" };
  if (reg) {
    return reg.showNotification(title, opts);
  } else if ("Notification" in window && Notification.permission === "granted") {
    return new Notification(title, opts);
  }
}

export async function testNotification() {
  await showNotification("🩹 Reminders enabled",
    "You'll get a daily wound check-in here. Open the app each day for fresh guidance.");
}
