const ENDPOINT = "/api/groq";
const MODEL = "llama-3.1-8b-instant";

export async function analyzeWithGroq(prompt) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content:
            "You are a biomaterials expert specialising in genipin-crosslinked gelatin hydrogels. " +
            "Answer concisely (max 180 words) with practical wound-healing / tissue-engineering insight.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`HTTP ${res.status}: ${txt}`);
  }
  const data = await res.json();
  return data.choices[0].message.content.trim();
}
