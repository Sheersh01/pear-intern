// ─── utils/apiHelpers.js ───
// API Stack:
//  • Text/Vision: Google Gemini (free tier, March 2026 verified models)
//  • Image Gen:   Pollinations.ai (completely free, no key needed)
//
// VERIFIED FREE MODELS (March 2026):
//   gemini-2.5-flash       — 10 RPM, 250 RPD  (best quality, supports vision)
//   gemini-2.5-flash-lite  — 15 RPM, 1000 RPD (faster, higher quota)
//
// NOTE: gemini-2.0-flash retired March 3 2026. gemini-1.5-flash-8b not in v1beta.
//
// Strategy: try flash-lite first (higher quota), fall back to flash on 429.

const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY;

// Models in priority order — each has its own independent quota bucket
const MODELS = [{ name: "gemini-2.5-flash", rpm: 10, rpd: 250 }];
const POLLINATIONS_BASE = "https://image.pollinations.ai/prompt";

function geminiUrl(modelName) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_KEY}`;
}

// ─── Daily quota tracking (per model) ────────────────────────────────────────
function getDailyKey(modelName) {
  return `pear_${modelName}_${new Date().toISOString().slice(0, 10)}`;
}
function getDailyCount(modelName) {
  try {
    return parseInt(localStorage.getItem(getDailyKey(modelName)) || "0", 10);
  } catch {
    return 0;
  }
}
function incrementDailyCount(modelName) {
  try {
    localStorage.setItem(
      getDailyKey(modelName),
      String(getDailyCount(modelName) + 1),
    );
  } catch {
    /* ignore */
  }
}

// Export for Navbar quota meter
export function getRateLimitStatus() {
  const totals = MODELS.reduce(
    (acc, m) => ({
      used: acc.used + getDailyCount(m.name),
      limit: acc.limit + m.rpd,
    }),
    { used: 0, limit: 0 },
  );
  return {
    used: totals.used,
    remaining: Math.max(0, totals.limit - totals.used),
    limitPerDay: totals.limit,
    percentUsed: Math.round((totals.used / totals.limit) * 100),
  };
}

// ─── Per-model rate gap enforcement ──────────────────────────────────────────
const lastCallTimes = {};

async function enforceGap(model) {
  const gapMs = Math.ceil(60000 / model.rpm) + 500; // e.g. 15 RPM → 4500ms gap
  const last = lastCallTimes[model.name] || 0;
  const wait = gapMs - (Date.now() - last);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCallTimes[model.name] = Date.now();
}

// ─── Parse Gemini's "retry in Xs" from 429 body ──────────────────────────────
function parseRetryAfterMs(errBody) {
  try {
    const msg = errBody?.error?.message || "";
    const match = msg.match(/retry[^\d]*(\d+(?:\.\d+)?)\s*s/i);
    if (match) return Math.ceil(parseFloat(match[1])) * 1000 + 500;
  } catch {
    /* ignore */
  }
  return 3000; // default 3s between model fallbacks
}

// ─── Core: model fallback chain ───────────────────────────────────────────────
async function callGemini(body) {
  for (const model of MODELS) {
    // Skip if daily quota exhausted for this model
    if (getDailyCount(model.name) >= model.rpd) {
      console.warn(
        `[Pear Media] ${model.name} daily quota exhausted, skipping.`,
      );
      continue;
    }

    await enforceGap(model);
    incrementDailyCount(model.name);

    const res = await fetch(geminiUrl(model.name), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      console.log(`[Pear Media] ✓ ${model.name}`);
      return res.json();
    }

    const errBody = await res.json().catch(() => ({}));

    if (res.status === 429) {
      const waitMs = parseRetryAfterMs(errBody);
      console.warn(
        `[Pear Media] ${model.name} → 429. Waiting ${waitMs}ms, trying next model...`,
      );
      await new Promise((r) => setTimeout(r, Math.min(waitMs, 6000)));
      continue; // try next model
    }

    // Any other error — throw immediately with clean message
    throw new Error(errBody?.error?.message || `Gemini error (${res.status})`);
  }

  throw new Error(
    "All Gemini models are rate-limited. Free tier resets at midnight (Pacific Time). " +
      "Or generate a new key at aistudio.google.com — it takes 30 seconds.",
  );
}

// ─── Workflow A: Enhance a simple text prompt ────────────────────────────────
export async function getEnhancedPrompt(userInput) {
  const data = await callGemini({
    contents: [
      {
        parts: [
          {
            text: `You are an expert visual prompt engineer for AI image generation.
Rewrite the user's idea into a single, grounded image prompt that stays faithful to the original subject.

Rules:
- Keep the same subject and intent from the user input.
- Do not invent a different subject, brand, model number, or unrelated object.
- Expand with visual details such as lighting, camera angle, color palette, mood, and artistic style.
- Write one concise paragraph of about 45-70 words.
- Return only the prompt text with no bullets, labels, quotes, or explanation.

User idea: ${JSON.stringify(userInput)}`,
          },
        ],
      },
    ],
    generationConfig: {
      maxOutputTokens: 200,
      temperature: 0.2,
      topP: 0.8,
      topK: 20,
    },
  });
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || userInput;
}

// ─── Workflow A: Generate image via Pollinations.ai (free, no key) ───────────
export async function generateImageFromPrompt(prompt) {
  if (!String(prompt || "").trim()) {
    throw new Error("Prompt is empty. Please enter or regenerate a prompt.");
  }

  const encoded = encodeURIComponent(prompt);
  const seed = Math.floor(Math.random() * 99999);

  // Return a direct image URL instead of prefetching with fetch();
  // preflight requests can trigger Turnstile checks on free endpoints.
  return `${POLLINATIONS_BASE}/${encoded}?width=768&height=768&seed=${seed}&nologo=true&model=flux`;
}

function normalizeAnalysisShape(parsed) {
  const detailedDescription = String(parsed?.detailedDescription || "").trim();
  const mainSubject = String(parsed?.mainSubject || "").trim();
  const artisticStyle = String(parsed?.artisticStyle || "").trim();
  const lightingStyle = String(parsed?.lightingStyle || "").trim();
  const mood = String(parsed?.mood || "").trim();

  return {
    mainSubject: mainSubject || "the original scene",
    colorPalette: Array.isArray(parsed?.colorPalette)
      ? parsed.colorPalette.map((c) => String(c).trim()).filter(Boolean)
      : [],
    lightingStyle: lightingStyle || "cinematic",
    artisticStyle: artisticStyle || "modern digital art",
    mood: mood || "evocative",
    detailedDescription,
  };
}

function parseImageAnalysis(rawText) {
  const cleaned = String(rawText || "")
    .replace(/```json|```/gi, "")
    .trim();

  const candidates = [cleaned];
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    candidates.push(cleaned.slice(firstBrace, lastBrace + 1));
  }

  for (const candidate of candidates) {
    const repaired = candidate
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/,\s*([}\]])/g, "$1")
      .trim();

    try {
      return normalizeAnalysisShape(JSON.parse(repaired));
    } catch {
      // Try next candidate/repair
    }
  }

  return null;
}

// ─── Workflow B: Analyze image via Gemini Vision ──────────────────────────────
export async function analyzeImageWithGemini(
  base64Data,
  mimeType = "image/jpeg",
) {
  const data = await callGemini({
    contents: [
      {
        parts: [
          { inline_data: { mime_type: mimeType, data: base64Data } },
          {
            text: `Analyze this image and respond ONLY with a JSON object (no markdown, no backticks):
{
  "mainSubject": "...",
  "colorPalette": ["color1", "color2", "color3"],
  "lightingStyle": "...",
  "artisticStyle": "...",
  "mood": "...",
  "detailedDescription": "..."
}`,
          },
        ],
      },
    ],
    generationConfig: {
      maxOutputTokens: 300,
      temperature: 0.1,
      responseMimeType: "application/json",
    },
  });

  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "{}";
  const parsed = parseImageAnalysis(raw);
  if (parsed) return parsed;

  console.warn("[Pear Media] Vision parse failure. Raw response:", raw);
  throw new Error(
    "Could not parse image analysis. Please try another image or retry.",
  );
}

// ─── Workflow B: Build variation prompt ──────────────────────────────────────
export function buildVariationPrompt(analysis) {
  const mainSubject = analysis?.mainSubject || "the original scene";
  const artisticStyle = analysis?.artisticStyle || "modern digital art";
  const lightingStyle = analysis?.lightingStyle || "cinematic";
  const mood = analysis?.mood || "evocative";
  const colors =
    Array.isArray(analysis?.colorPalette) && analysis.colorPalette.length > 0
      ? analysis.colorPalette.join(", ")
      : "balanced, filmic tones";

  return `${artisticStyle} style artwork featuring ${mainSubject}, \
color palette of ${colors}, ${lightingStyle} lighting, \
${mood} mood, highly detailed, professional quality, \
artistic variation with a fresh perspective on the original composition`;
}
