// Firebase Web SDK — saves wound analysis results to Firestore.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getFirestore, collection, addDoc, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

import { FIREBASE_CONFIG } from "./config.js";

let db = null;
let ready = false;
export let firebaseApp = null;

export function initFirebase() {
  try {
    if (!FIREBASE_CONFIG.apiKey || FIREBASE_CONFIG.apiKey.includes("YOUR_")) {
      console.warn("Firebase config not filled in — cloud sync disabled.");
      return false;
    }
    firebaseApp = initializeApp(FIREBASE_CONFIG);
    db = getFirestore(firebaseApp);
    ready = true;
    return true;
  } catch (e) {
    console.error("Firebase init failed:", e);
    return false;
  }
}

export async function saveAnalysis(plan, meta) {
  if (!ready || !db) return;
  try {
    await addDoc(collection(db, "wound_analyses"), {
      ...meta,
      assessment: plan.assessment || "",
      woundType: plan.wound_type || "",
      severity: plan.severity || "",
      healingStage: plan.healing_stage || "",
      precautions: plan.precautions || [],
      otcProducts: plan.otc_products || [],
      redFlags: plan.red_flags || [],
      timeline14d: plan.timeline_14d || [],
      healingCurve: plan.healing_curve || [],
      timestamp: serverTimestamp(),
    });
  } catch (e) {
    console.error("Firestore save failed:", e);
  }
}
