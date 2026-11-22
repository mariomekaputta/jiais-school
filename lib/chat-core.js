/*
 * Logika inti Asisten JIAIS — dipakai bersama oleh:
 *   - server.js     (server lokal: npm start)
 *   - api/chat.js   (Vercel Serverless Function)
 *
 * API key HANYA dibaca di server (environment variable GEMINI_API_KEY,
 * atau file .env saat lokal) dan dikirim ke Google lewat header.
 * Browser tidak pernah melihat key ini.
 */
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const MODEL = "gemini-3.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const LIMITS = {
  bodyBytes: 32 * 1024, // ukuran maksimum request dari browser
  messages: 20, // jumlah pesan riwayat terakhir yang dikirim ke Gemini
  charsPerMessage: 1000,
  timeoutMs: 20000, // batas waktu menunggu Gemini
  requestsPerMinute: 20, // per alamat IP (per instance server)
};

/* ---------- .env loader sederhana (hanya untuk lokal; di Vercel pakai Environment Variables) ---------- */
function loadEnv(file) {
  try {
    const text = fs.readFileSync(file, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m || line.trim().startsWith("#")) continue;
      const value = m[2].replace(/^(['"])(.*)\1$/, "$2");
      if (process.env[m[1]] === undefined) process.env[m[1]] = value;
    }
  } catch {
    /* .env opsional */
  }
}
loadEnv(path.join(ROOT, ".env"));

function apiKey() {
  return process.env.GEMINI_API_KEY || "";
}
if (!apiKey()) {
  console.warn("[peringatan] GEMINI_API_KEY belum diset. Chat akan membalas 'Asisten tidak tersedia'.");
}

/* ---------- System prompt per bahasa = instruksi + data sekolah dari FAQ.md ---------- */
const DEFAULT_LANG = "id";
const DATA_HEADINGS = {
  id: "# DATA RESMI SEKOLAH (sumber kebenaran)",
  en: "# OFFICIAL SCHOOL DATA (source of truth, written in Indonesian)",
};

// PENTING untuk Vercel: path ditulis LITERAL per file (bukan template string dinamis)
// agar Vercel File Trace mendeteksi dan menyertakan file ini ke dalam function.
const FAQ_FILE = path.join(__dirname, "..", "FAQ.md");
const PROMPT_FILES = {
  id: path.join(__dirname, "..", "prompts", "system-prompt.id.md"),
  en: path.join(__dirname, "..", "prompts", "system-prompt.en.md"),
};

function readFile(file) {
  try {
    return fs.readFileSync(file, "utf8").trim();
  } catch {
    return "";
  }
}

function buildSystemPrompts() {
  const faq = readFile(FAQ_FILE);
  if (!faq) console.error("[peringatan] FAQ.md tidak ditemukan");
  const prompts = {};
  for (const lang of Object.keys(DATA_HEADINGS)) {
    const instructions = readFile(PROMPT_FILES[lang]);
    if (!instructions) console.error(`[peringatan] prompts/system-prompt.${lang}.md tidak ditemukan`);
    // Tanpa instruksi atau data, prompt dianggap tidak siap (null) → asisten menolak menjawab.
    prompts[lang] = instructions && faq ? `${instructions}\n\n---\n\n${DATA_HEADINGS[lang]}\n\n${faq}` : null;
  }
  return prompts;
}
const SYSTEM_PROMPTS = buildSystemPrompts();

// Hanya bahasa yang dikenal; selain itu pakai bahasa Indonesia.
function pickLang(value) {
  return Object.prototype.hasOwnProperty.call(SYSTEM_PROMPTS, value) ? value : DEFAULT_LANG;
}

/* ---------- Rate limit sederhana per IP (in-memory, per instance) ---------- */
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  // Bersihkan entri lama secara malas (tanpa setInterval, aman untuk serverless).
  if (hits.size > 5000) {
    for (const [key, times] of hits) if (times.every((t) => now - t >= 60000)) hits.delete(key);
  }
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > LIMITS.requestsPerMinute;
}

/* ---------- Validasi & konversi riwayat ke format Gemini ---------- */
function toGeminiContents(messages) {
  if (!Array.isArray(messages)) return null;

  const cleaned = messages
    .filter((m) => m && (m.role === "user" || m.role === "bot") && typeof m.text === "string")
    .map((m) => ({ role: m.role === "bot" ? "model" : "user", text: m.text.trim().slice(0, LIMITS.charsPerMessage) }))
    .filter((m) => m.text)
    .slice(-LIMITS.messages);

  // Gemini: percakapan harus diawali user, dan peran berturut-turut sebaiknya digabung.
  while (cleaned.length && cleaned[0].role !== "user") cleaned.shift();
  const contents = [];
  for (const m of cleaned) {
    const last = contents[contents.length - 1];
    if (last && last.role === m.role) last.parts[0].text += "\n\n" + m.text;
    else contents.push({ role: m.role, parts: [{ text: m.text }] });
  }

  if (!contents.length || contents[contents.length - 1].role !== "user") return null;
  return contents;
}

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    reply: { type: "STRING", description: "Jawaban untuk pengguna, teks biasa, dalam bahasa yang ditentukan instruksi sistem." },
    perlu_admin: {
      type: "BOOLEAN",
      description: "true jika pertanyaan tidak bisa dijawab tuntas dan pengguna perlu menghubungi admin WhatsApp.",
    },
  },
  required: ["reply", "perlu_admin"],
  propertyOrdering: ["reply", "perlu_admin"],
};

// Ubah teks JSON dari Gemini menjadi {reply, perlu_admin} yang tervalidasi.
function parseStructuredReply(text) {
  try {
    const obj = JSON.parse(text);
    const reply = typeof obj.reply === "string" ? obj.reply.trim() : "";
    if (!reply) throw new Error("gemini_bad_json");
    return { reply, perlu_admin: obj.perlu_admin === true };
  } catch {
    // Model tidak mengikuti format: jangan tampilkan JSON mentah, anggap gagal.
    throw new Error("gemini_bad_json");
  }
}

async function askGemini(contents, lang) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LIMITS.timeoutMs);
  try {
    const r = await fetch(GEMINI_URL, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey() },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPTS[lang] }] },
        contents,
        generationConfig: {
          maxOutputTokens: 1024,
          // Structured output: Gemini wajib membalas JSON {reply, perlu_admin}
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    });
    if (!r.ok) throw new Error(`gemini_http_${r.status}`);
    const data = await r.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const text = parts
      .filter((p) => typeof p.text === "string" && !p.thought)
      .map((p) => p.text)
      .join("")
      .trim();
    if (!text) throw new Error(`gemini_empty_${data?.candidates?.[0]?.finishReason || "unknown"}`);
    return parseStructuredReply(text);
  } finally {
    clearTimeout(timer);
  }
}

/*
 * Proses satu request chat yang sudah di-parse.
 * Input : { body: object|null, ip: string }
 * Output: { status: number, data: object }  — tidak pernah throw.
 */
async function handleChatPayload({ body, ip }) {
  try {
    if (rateLimited(ip || "unknown")) return { status: 429, data: { error: "rate_limited" } };
    if (!apiKey()) {
      console.error("[chat] gagal: GEMINI_API_KEY belum diset");
      return { status: 503, data: { error: "unavailable" } };
    }
    if (!body || typeof body !== "object") return { status: 400, data: { error: "bad_request" } };

    const contents = toGeminiContents(body.messages);
    if (!contents) return { status: 400, data: { error: "bad_request" } };

    const lang = pickLang(body.lang);
    // Jangan pernah memanggil Gemini tanpa instruksi + data sekolah (jawaban bisa ngawur).
    if (!SYSTEM_PROMPTS[lang]) {
      console.error(`[chat] gagal: prompt_missing_${lang}`);
      return { status: 503, data: { error: "unavailable" } };
    }
    const { reply, perlu_admin } = await askGemini(contents, lang);
    return { status: 200, data: { reply, perlu_admin } };
  } catch (e) {
    // Log hanya jenis error, tanpa key dan tanpa isi percakapan.
    console.error(`[chat] gagal: ${e && e.name === "AbortError" ? "timeout" : e && e.message}`);
    return { status: 503, data: { error: "unavailable" } };
  }
}

module.exports = { handleChatPayload, LIMITS, MODEL };
