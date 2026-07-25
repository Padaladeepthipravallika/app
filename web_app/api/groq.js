import https from "https";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Keep only printable ASCII (32-126) to strip any BOM or invisible chars
  const raw = process.env.GROQ_API_KEY || "";
  const apiKey = raw.split("").filter(c => c.charCodeAt(0) >= 32 && c.charCodeAt(0) <= 126).join("");
  if (!apiKey) {
    res.status(500).json({ error: "GROQ_API_KEY not configured on server" });
    return;
  }

  const bodyStr = JSON.stringify(req.body);

  return new Promise((resolve) => {
    const options = {
      hostname: "api.groq.com",
      path: "/openai/v1/chat/completions",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey,
        "Content-Length": Buffer.byteLength(bodyStr),
      },
    };

    const request = https.request(options, (upstream) => {
      let raw = "";
      upstream.on("data", (chunk) => { raw += chunk; });
      upstream.on("end", () => {
        try {
          res.status(upstream.statusCode).json(JSON.parse(raw));
        } catch {
          res.status(500).json({ error: "Failed to parse Groq response" });
        }
        resolve();
      });
    });

    request.on("error", (e) => {
      res.status(500).json({ error: e.message });
      resolve();
    });

    request.write(bodyStr);
    request.end();
  });
}
