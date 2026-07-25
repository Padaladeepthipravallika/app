import { analyseWound } from "./vision.js";
import { initFirebase, saveAnalysis, firebaseApp } from "./firebase.js";
import { initAuth, watchAuth, emailLogin, emailSignup, googleLogin, signOutUser } from "./auth.js";
import {
  ensurePermission, registerSW, saveReminder,
  getReminder, scheduleNext, testNotification,
} from "./notify.js";
import { HydrogelPredictor } from "./predictor.js";
import { analyzeWithGroq } from "./groq.js";

const $ = (id) => document.getElementById(id);

// ---------- Tabs (sidebar + bottom nav) ----------
const PAGE_META = {
  upload:   { title: "Capture wound photo",     sub: "Upload an image to receive an AI-generated care plan and healing forecast." },
  plan:     { title: "AI care plan",            sub: "Personalised assessment, precautions and OTC product suggestions." },
  timeline: { title: "14-day healing forecast", sub: "Predicted day-by-day progress and milestones for your wound." },
  model:    { title: "3D hydrogel model",       sub: "Interactive crosslink network used in the underlying dressing material." },
  hydrogel: { title: "Hydrogel Lab",            sub: "Predict mechanical, swelling and degradation behaviour from material composition." },
};
const navItems = document.querySelectorAll(".nav-item, .bn-item");
const panels = document.querySelectorAll(".panel");
function showTab(name) {
  navItems.forEach(t => t.classList.toggle("active", t.dataset.tab === name));
  panels.forEach(p => p.classList.toggle("active", p.id === `tab-${name}`));
  const meta = PAGE_META[name];
  if (meta) { $("page-title").textContent = meta.title; $("page-sub").textContent = meta.sub; }
  window.scrollTo({ top: 0, behavior: "smooth" });
}
navItems.forEach(t => t.addEventListener("click", () => showTab(t.dataset.tab)));

// ---------- Image upload ----------
const dropzone = $("dropzone");
const fileInput = $("file-input");
const preview = $("preview");
const btnAnalyse = $("btn-analyse");
let imageDataUrl = null;

["dragenter", "dragover"].forEach(ev =>
  dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.add("drag"); }));
["dragleave", "drop"].forEach(ev =>
  dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.remove("drag"); }));
dropzone.addEventListener("drop", e => {
  const f = e.dataTransfer?.files?.[0];
  if (f) handleFile(f);
});
// Desktop click → open gallery picker (dropzone is now a div, not a label)
dropzone.addEventListener("click", (e) => {
  if (!e.target.closest("button")) fileInput.click();
});
fileInput.addEventListener("change", e => {
  const f = e.target.files?.[0];
  if (f) handleFile(f);
});
// Mobile camera button
const cameraInput = $("camera-input");
cameraInput.addEventListener("change", e => {
  const f = e.target.files?.[0];
  if (f) handleFile(f);
});
$("btn-take-photo").addEventListener("click", (e) => { e.stopPropagation(); cameraInput.click(); });
$("btn-from-gallery").addEventListener("click", (e) => { e.stopPropagation(); fileInput.click(); });

function handleFile(file) {
  if (!file.type.startsWith("image/")) {
    alert("Please choose an image file.");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => resizeImage(reader.result, 1024).then(dataUrl => {
    imageDataUrl = dataUrl;
    preview.src = dataUrl;
    preview.hidden = false;
    btnAnalyse.disabled = false;
  });
  reader.readAsDataURL(file);
}

function resizeImage(dataUrl, maxSide) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (Math.max(width, height) > maxSide) {
        const k = maxSide / Math.max(width, height);
        width = Math.round(width * k);
        height = Math.round(height * k);
      }
      const c = document.createElement("canvas");
      c.width = width; c.height = height;
      c.getContext("2d").drawImage(img, 0, 0, width, height);
      resolve(c.toDataURL("image/jpeg", 0.85));
    };
    img.src = dataUrl;
  });
}

$("btn-clear").addEventListener("click", () => {
  imageDataUrl = null;
  fileInput.value = "";
  preview.hidden = true;
  preview.src = "";
  btnAnalyse.disabled = true;
});

// ---------- Analyse ----------
btnAnalyse.addEventListener("click", async () => {
  if (!imageDataUrl) return;
  btnAnalyse.disabled = true;
  const originalLabel = btnAnalyse.innerHTML;
  btnAnalyse.innerHTML = '<span class="spinner"></span> Analysing…';
  $("plan-status").innerHTML = '<div class="empty-icon"><div class="spinner big"></div></div><h3>Analysing your photo…</h3><p>Groq vision model is generating your care plan.</p>';
  showTab("plan");

  const day = parseInt($("in-day").value, 10) || 0;
  const notes = $("in-notes").value.trim();

  try {
    const plan = await analyseWound(imageDataUrl, notes, day);
    renderPlan(plan);
    renderTimeline(plan);
    saveAnalysis(plan, { woundDay: day, userNotes: notes });
    saveReminder(plan);
    $("plan-status").hidden = true;
    $("plan-actions").hidden = false;
  } catch (e) {
    $("plan-status").innerHTML = `<div class="empty-icon">⚠️</div><h3>AI error</h3><p>${escape(e.message)}</p>`;
  } finally {
    btnAnalyse.disabled = false;
    btnAnalyse.innerHTML = originalLabel;
  }
});

// ---------- Render plan ----------
function renderPlan(plan) {
  $("plan-assessment").textContent = plan.assessment || "(no assessment)";
  $("chip-type").textContent = plan.wound_type || "—";
  $("chip-severity").textContent = plan.severity || "—";
  $("chip-stage").textContent = plan.healing_stage || "—";
  $("card-assessment").hidden = false;

  fillList("plan-precautions", plan.precautions);
  $("card-precautions").hidden = !(plan.precautions?.length);

  const meds = $("plan-meds");
  meds.innerHTML = "";
  (plan.otc_products || []).forEach(m => {
    const li = document.createElement("li");
    li.innerHTML = `<b>${escape(m.name)}</b> — ${escape(m.purpose || "")}`;
    meds.appendChild(li);
  });
  $("card-meds").hidden = !(plan.otc_products?.length);

  fillList("plan-redflags", plan.red_flags);
  $("card-redflags").hidden = !(plan.red_flags?.length);
}

function fillList(id, items) {
  const ul = $(id);
  ul.innerHTML = "";
  (items || []).forEach(s => {
    const li = document.createElement("li");
    li.textContent = s;
    ul.appendChild(li);
  });
}

function escape(s) {
  return String(s).replace(/[&<>"]/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

// ---------- Timeline ----------
let healingChart = null;
function renderTimeline(plan) {
  const list = $("timeline-list");
  list.innerHTML = "";
  (plan.timeline_14d || []).forEach(t => {
    const li = document.createElement("li");
    li.innerHTML = `<b>Day ${t.day}:</b> ${escape(t.expected || "")} <em>(${escape(t.action || "")})</em>`;
    list.appendChild(li);
  });

  const curve = (plan.healing_curve && plan.healing_curve.length)
    ? plan.healing_curve
    : (plan.timeline_14d || []).map((t, i, a) => ({
        day: t.day,
        score: Math.round((i / Math.max(1, a.length - 1)) * 100),
      }));

  const ctx = $("chart-healing").getContext("2d");
  if (healingChart) healingChart.destroy();
  const grad = ctx.createLinearGradient(0, 0, 0, 280);
  grad.addColorStop(0, "rgba(99, 102, 241, 0.35)");
  grad.addColorStop(1, "rgba(236, 72, 153, 0.05)");
  healingChart = new Chart(ctx, {
    type: "line",
    data: {
      datasets: [{
        label: "Expected healing %",
        data: curve.map(c => ({ x: c.day, y: c.score })),
        borderColor: "#6366f1",
        backgroundColor: grad,
        borderWidth: 2.5,
        tension: 0.35, fill: true,
        pointRadius: 4, pointBackgroundColor: "#fff",
        pointBorderColor: "#ec4899", pointBorderWidth: 2,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { type: "linear", title: { display: true, text: "Day", color: "#64748b" }, ticks: { color: "#64748b" }, grid: { color: "#e4e9f0" } },
        y: { min: 0, max: 100, title: { display: true, text: "Healing %", color: "#64748b" }, ticks: { color: "#64748b" }, grid: { color: "#e4e9f0" } },
      },
      plugins: { legend: { display: false } },
    },
  });

  $("card-timeline").hidden = false;
  $("timeline-status").hidden = true;
}

// ---------- Notifications ----------
$("btn-enable-notif").addEventListener("click", async () => {
  try {
    await registerSW();
    const ok = await ensurePermission();
    if (ok) {
      $("notif-status").textContent = "✓ Reminders enabled (daily at 09:00 while app is open)";
      await testNotification();
      scheduleNext();
    } else {
      $("notif-status").textContent = "Notifications not granted";
    }
  } catch (e) {
    $("notif-status").textContent = "Notifications: " + e.message;
  }
});

$("btn-print").addEventListener("click", () => window.print());

// ---------- Boot ----------
const fbOk = initFirebase();
const fbPill = $("fb-status");
fbPill.classList.add(fbOk ? "connected" : "disabled");
fbPill.innerHTML = `<span class="dot"></span> ${fbOk ? "Firebase connected" : "Firebase off—fill config.js"}`;

if (typeof Notification !== "undefined" && Notification.permission === "granted") {
  registerSW();
  if (getReminder()) scheduleNext();
  $("notif-status").textContent = "✓ Reminders enabled";
}

// ---------- Auth ----------
const GUEST_KEY = "vulnera_guest";
const authOverlay = $("auth-overlay");

initAuth(firebaseApp);

watchAuth(user => {
  if (user) {
    authOverlay.hidden = true;
    const initial = (user.displayName || user.email || "U").charAt(0).toUpperCase();
    const label = user.displayName || user.email || "User";
    $("user-avatar").textContent = initial;
    $("user-name").textContent = label;
    $("user-pill").hidden = false;
    $("topbar-avatar").textContent = initial;
    $("topbar-user").hidden = false;
  } else if (localStorage.getItem(GUEST_KEY)) {
    authOverlay.hidden = true;
    $("user-pill").hidden = true;
    $("topbar-user").hidden = true;
  } else {
    authOverlay.hidden = false;
    $("user-pill").hidden = true;
    $("topbar-user").hidden = true;
  }
});

// Tab switching
$("tab-btn-login").addEventListener("click", () => {
  $("tab-btn-login").classList.add("active");
  $("tab-btn-signup").classList.remove("active");
  $("form-login").hidden = false;
  $("form-signup").hidden = true;
  $("auth-title").textContent = "Welcome back";
});
$("tab-btn-signup").addEventListener("click", () => {
  $("tab-btn-signup").classList.add("active");
  $("tab-btn-login").classList.remove("active");
  $("form-signup").hidden = false;
  $("form-login").hidden = true;
  $("auth-title").textContent = "Create account";
});

// Login
$("form-login").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = $("btn-login-submit");
  const orig = btn.innerHTML;
  $("login-err").textContent = "";
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Signing in…';
  try {
    await emailLogin($("login-email").value.trim(), $("login-password").value);
  } catch (err) {
    $("login-err").textContent = err.code ? fmtAuthErr(err.code) : err.message;
    btn.disabled = false;
    btn.innerHTML = orig;
  }
});

// Sign up
$("form-signup").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = $("btn-signup-submit");
  const orig = btn.innerHTML;
  $("signup-err").textContent = "";
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Creating…';
  try {
    await emailSignup($("signup-email").value.trim(), $("signup-password").value);
  } catch (err) {
    $("signup-err").textContent = err.code ? fmtAuthErr(err.code) : err.message;
    btn.disabled = false;
    btn.innerHTML = orig;
  }
});

// Google
$("btn-google-auth").addEventListener("click", async () => {
  const btn = $("btn-google-auth");
  btn.disabled = true;
  try {
    await googleLogin();
  } catch (err) {
    if (err.code !== "auth/popup-closed-by-user") {
      alert(fmtAuthErr(err.code));
    }
    btn.disabled = false;
  }
});

// Skip (guest)
$("btn-skip-auth").addEventListener("click", () => {
  localStorage.setItem(GUEST_KEY, "1");
  authOverlay.hidden = true;
});

// Sign out (sidebar + topbar)
async function handleSignOut() {
  await signOutUser();
  $("user-pill").hidden = true;
  $("topbar-user").hidden = true;
  authOverlay.hidden = false;
}
$("btn-signout").addEventListener("click", handleSignOut);
$("btn-topbar-signout").addEventListener("click", handleSignOut);

function fmtAuthErr(code) {
  return ({
    "auth/user-not-found":        "No account found with that email.",
    "auth/wrong-password":        "Incorrect password.",
    "auth/invalid-credential":    "Invalid email or password.",
    "auth/email-already-in-use":  "Email already registered.",
    "auth/weak-password":         "Password must be at least 6 characters.",
    "auth/invalid-email":         "Invalid email address.",
    "auth/too-many-requests":     "Too many attempts — try again later.",
    "auth/network-request-failed":"Network error. Check your connection.",
    "auth/popup-closed-by-user":  "Sign-in popup was closed.",
  })[code] || "Something went wrong. Please try again.";
}

// ===================================================================
//  HYDROGEL LAB  — material simulation, charts, recommendation, AI
// ===================================================================
const hgCharts = {};
function readHg() {
  return new HydrogelPredictor(
    parseFloat($("hg-gel").value)  || 0,
    parseFloat($("hg-gen").value)  || 0,
    parseFloat($("hg-ph").value)   || 7,
    parseFloat($("hg-temp").value) || 25,
  );
}

async function runHydrogel() {
  const p = readHg();
  const ts = p.tensileStrength();
  const el = p.elasticity();
  const dg = p.degradationDays();
  const sw = p.swellingRatio();
  const st = p.stabilityScore();

  $("kpi-strength").textContent = ts.toFixed(1);
  $("kpi-elastic").textContent  = el.toFixed(1);
  $("kpi-deg").textContent      = dg.toFixed(1);
  $("kpi-sw").textContent       = sw.toFixed(2);
  $("kpi-stab").textContent     = st.toFixed(1) + " / 100";
  $("meter-stab").style.width   = st + "%";

  $("hg-empty").hidden          = true;
  $("hg-card-results").hidden   = false;
  $("hg-card-rec").hidden       = false;
  $("hg-card-ai").hidden        = false;
  $("hg-charts").hidden         = false;

  $("hg-recommendation").textContent = p.recommendation();

  drawHgCharts(p);

  // AI analysis
  const aiOut = $("hg-ai-output");
  aiOut.innerHTML = '<span class="spinner"></span> Asking Groq…';
  try {
    const txt = await analyzeWithGroq(
      `Analyse a genipin-crosslinked gelatin hydrogel with ${p.gelatin}% gelatin, ` +
      `${p.genipin}% genipin, pH ${p.pH}, ${p.temp} °C. Predicted: tensile ${ts.toFixed(1)} kPa, ` +
      `elasticity ${el.toFixed(1)} kPa, degradation ${dg.toFixed(1)} d, swelling ${sw.toFixed(2)} g/g, ` +
      `stability ${st.toFixed(0)}/100. Comment on suitability for wound dressing vs tissue scaffold.`);
    aiOut.innerHTML = renderMarkdown(txt);
  } catch (e) {
    aiOut.textContent = "AI unavailable: " + e.message;
  }
}

// Lightweight markdown -> HTML for AI output (handles **bold**, numbered/bulleted
// lists, and paragraph breaks). Escapes HTML first to stay XSS-safe.
function renderMarkdown(src) {
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let text = esc(src).trim();

  // Normalise: ensure each numbered item starts on a new line
  text = text.replace(/\s+(\d+)\.\s+(?=\*\*|[A-Z])/g, "\n$1. ");
  // Same for bullet markers
  text = text.replace(/\s+[-•]\s+(?=[A-Z*])/g, "\n- ");

  const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);
  const html = [];
  let listType = null; // "ol" or "ul"
  const flushList = () => { if (listType) { html.push(`</${listType}>`); listType = null; } };

  for (const line of lines) {
    const ol = line.match(/^(\d+)\.\s+(.*)$/);
    const ul = line.match(/^[-•]\s+(.*)$/);
    if (ol) {
      if (listType !== "ol") { flushList(); html.push('<ol class="md-list">'); listType = "ol"; }
      html.push(`<li>${inline(ol[2])}</li>`);
    } else if (ul) {
      if (listType !== "ul") { flushList(); html.push('<ul class="md-list">'); listType = "ul"; }
      html.push(`<li>${inline(ul[1])}</li>`);
    } else {
      flushList();
      html.push(`<p>${inline(line)}</p>`);
    }
  }
  flushList();
  return html.join("");

  function inline(s) {
    return s
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>");
  }
}

function drawHgCharts(p) {
  // 1. Strength vs Genipin
  const strength = [];
  for (let x = 0.1; x <= 5.0; x += 0.2)
    strength.push({ x: +x.toFixed(2), y: new HydrogelPredictor(p.gelatin, x, p.pH, p.temp).tensileStrength() });

  // 2. Mass remaining vs time
  const deg0 = p.degradationDays();
  const deg = [];
  for (let d = 0; d <= 60; d++) deg.push({ x: d, y: 100 * Math.exp(-d / Math.max(1, deg0)) });

  // 3. Swelling vs pH
  const sw = [];
  for (let x = 3.0; x <= 10.0; x += 0.25)
    sw.push({ x: +x.toFixed(2), y: new HydrogelPredictor(p.gelatin, p.genipin, x, p.temp).swellingRatio() });

  // 4. Strength vs gelatin
  const strengthGel = [];
  for (let g = 2; g <= 20; g += 0.5)
    strengthGel.push({ x: +g.toFixed(1), y: new HydrogelPredictor(g, p.genipin, p.pH, p.temp).tensileStrength() });

  drawHgChart("chart-strength",     strength,    "Tensile (kPa)",   "#6366f1", "Genipin %");
  drawHgChart("chart-degradation",  deg,         "Mass remaining %", "#ec4899", "Days");
  drawHgChart("chart-swelling",     sw,          "Swelling g/g",    "#06b6d4", "pH");
  drawHgChart("chart-strength-gel", strengthGel, "Tensile (kPa)",   "#8b5cf6", "Gelatin %");
}

function drawHgChart(id, data, label, color, xLabel) {
  if (hgCharts[id]) hgCharts[id].destroy();
  const ctx = document.getElementById(id).getContext("2d");
  hgCharts[id] = new Chart(ctx, {
    type: "line",
    data: { datasets: [{ label, data, borderColor: color, backgroundColor: color + "22", borderWidth: 2, tension: 0.3, fill: true, pointRadius: 0 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { type: "linear", title: { display: true, text: xLabel, color: "#64748b" }, ticks: { color: "#64748b" }, grid: { color: "#e4e9f0" } },
        y: { ticks: { color: "#64748b" }, grid: { color: "#e4e9f0" } },
      },
      plugins: { legend: { labels: { color: "#0f172a" } } },
    },
  });
}

$("hg-simulate").addEventListener("click", runHydrogel);
$("hg-reset").addEventListener("click", () => {
  $("hg-gel").value = 10; $("hg-gen").value = 1;
  $("hg-ph").value = 7.4;  $("hg-temp").value = 37;
});
$("hg-pdf").addEventListener("click", () => window.print());
