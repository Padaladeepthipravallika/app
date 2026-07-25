// Groq Vision client — sends an image + prompt and returns a structured care plan.
//
// Uses a vision-capable Groq model. We force a JSON-only response so the UI
// can render it reliably.

const ENDPOINT = "/api/groq";
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

const SYSTEM_PROMPT = `You are a wound-care educational assistant.
You are NOT a doctor. Always advise the user to consult a clinician for anything
beyond a minor superficial wound. Look at the wound photo and respond with
ONLY a valid JSON object (no markdown, no prose) in exactly this schema:

{
  "assessment": "1-3 sentence plain-language description of what is visible",
  "wound_type": "abrasion | laceration | puncture | burn | ulcer | surgical | other | unclear",
  "severity": "minor | moderate | severe | unclear",
  "healing_stage": "bleeding | inflammation | proliferation | maturation | unclear",
  "precautions": ["..."],
  "otc_products": [
    {"name": "generic product category, not a brand", "purpose": "..."}
  ],
  "red_flags": ["signs that mean SEE A DOCTOR NOW"],
  "timeline_14d": [
    {"day": 1, "expected": "...", "action": "..."},
    {"day": 2, "expected": "...", "action": "..."},
    ... up to day 14, in sensible steps (1,2,3,5,7,10,14 is fine)
  ],
  "healing_curve": [
    {"day": 0, "score": 0},   // 0 = open wound, 100 = fully healed
    {"day": 14, "score": 90}
  ],
  "disclaimer": "short reminder that this is not medical advice"
}

If the image is unclear, blurry, or not a wound, set fields to "unclear" and
explain in 'assessment'. Never recommend prescription drugs by name. Keep
'otc_products' to generic categories like "saline wound wash", "petroleum
jelly", "non-stick gauze pad", "hydrocolloid dressing".`;

export async function analyseWound(imageDataUrl, userNotes = "", woundDay = 0) {
  const userText =
    `Day of wound (per user): ${woundDay}.\n` +
    `User notes: ${userNotes || "(none)"}.\n` +
    `Return the JSON care plan now.`;

  const body = {
    model: VISION_MODEL,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: userText },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ],
      },
    ],
  };

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content?.trim() || "";

  // Parse — model is asked for pure JSON, but be defensive.
  try {
    return JSON.parse(raw);
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("Could not parse AI response as JSON.");
    return JSON.parse(m[0]);
  }
}
