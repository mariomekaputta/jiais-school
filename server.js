/*
 * Server JIAIS — Node.js murni, tanpa dependensi.
 *
 * 1. Menyajikan file statis (hanya daftar file yang diizinkan).
 * 2. Endpoint POST /api/chat sebagai proxy ke Gemini.
 *    API key HANYA dibaca di server dari .env dan dikirim ke Google lewat header.
 *    Browser tidak pernah melihat key ini (tidak ada di kode front-end maupun di Network tab).
 */
"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;
// Default hanya bisa diakses dari komputer ini. Set HOST=0.0.0.0 bila perlu diakses dari jaringan.
const HOST = process.env.HOST || "127.0.0.1";
const MODEL = "gemini-3.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const LIMITS = {
  bodyBytes: 32 * 1024, // ukuran maksimum request dari browser
  messages: 20, // jumlah pesan riwayat terakhir yang dikirim ke Gemini
  charsPerMessage: 1000,
  timeoutMs: 20000, // batas waktu menunggu Gemini
  requestsPerMinute: 20, // per alamat IP
};

/* ---------- .env loader sederhana (tanpa library) ---------- */
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
    /* .env opsional; key bisa juga diset lewat environment */
  }
}
loadEnv(path.join(ROOT, ".env"));

const API_KEY = process.env.GEMINI_API_KEY || "";
if (!API_KEY) {
  console.warn("[peringatan] GEMINI_API_KEY belum diset. Chat akan membalas 'Asisten tidak tersedia'.");
}

/* ---------- System prompt = instruksi + data sekolah dari FAQ.md ---------- */
function buildSystemPrompt() {
  const read = (f) => {
    try {
      return fs.readFileSync(path.join(ROOT, f), "utf8");
    } catch {
      return "";
    }
  };
  const instructions = read("prompts/system-prompt.md");
  const faq = read("FAQ.md");
  return `${instructions}\n\n---\n\n# DATA RESMI SEKOLAH (sumber kebenaran)\n\n${faq}`;
}
const SYSTEM_PROMPT = buildSystemPrompt();

/* ---------- File statis: whitelist eksplisit ---------- */
// Hanya file ini yang bisa diakses browser. .env, server.js, prompt, dll. tidak pernah disajikan.
const STATIC_FILES = {
  "/": { file: "index.html", type: "text/html; charset=utf-8" },
  "/index.html": { file: "index.html", type: "text/html; charset=utf-8" },
  "/style.css": { file: "style.css", type: "text/css; charset=utf-8" },
  "/i18n.js": { file: "i18n.js", type: "text/javascript; charset=utf-8" },
  "/chat.js": { file: "chat.js", type: "text/javascript; charset=utf-8" },
};

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Frame-Options": "DENY",
};

function send(res, status, body, type = "application/json; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store", ...SECURITY_HEADERS });
  res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

function serveStatic(req, res) {
  const url = new URL(req.url, "http://localhost");
  const entry = STATIC_FILES[url.pathname];
  if (!entry || (req.method !== "GET" && req.method !== "HEAD")) {
    return send(res, 404, "Not found", "text/plain; charset=utf-8");
  }
  fs.readFile(path.join(ROOT, entry.file), (err, data) => {
    if (err) return send(res, 500, "Server error", "text/plain; charset=utf-8");
    send(res, 200, req.method === "HEAD" ? "" : data, entry.type);
  });
}

/* ---------- Rate limit sederhana per IP (in-memory) ---------- */
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > LIMITS.requestsPerMinute;
}
setInterval(() => {
  const now = Date.now();
  for (const [ip, times] of hits) if (times.every((t) => now - t >= 60000)) hits.delete(ip);
}, 60000).unref();

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

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > LIMITS.bodyBytes) {
        reject(new Error("too_large"));
        req.destroy();
      } else chunks.push(c);
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new Error("bad_json"));
      }
    });
    req.on("error", reject);
  });
}

async function askGemini(contents) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LIMITS.timeoutMs);
  try {
    const r = await fetch(GEMINI_URL, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", "x-goog-api-key": API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
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

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    reply: { type: "STRING", description: "Jawaban untuk pengguna, teks biasa berbahasa Indonesia." },
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

async function handleChat(req, res) {
  const ip = req.socket.remoteAddress || "unknown";
  if (rateLimited(ip)) return send(res, 429, { error: "rate_limited" });
  if (!API_KEY) return send(res, 503, { error: "unavailable" });

  let body;
  try {
    body = await readJson(req);
  } catch (e) {
    return send(res, e.message === "too_large" ? 413 : 400, { error: "bad_request" });
  }

  const contents = toGeminiContents(body && body.messages);
  if (!contents) return send(res, 400, { error: "bad_request" });

  try {
    const { reply, perlu_admin } = await askGemini(contents);
    send(res, 200, { reply, perlu_admin });
  } catch (e) {
    // Log hanya jenis error, tanpa key dan tanpa isi percakapan.
    console.error(`[chat] gagal: ${e.name === "AbortError" ? "timeout" : e.message}`);
    send(res, 503, { error: "unavailable" });
  }
}

/* ---------- Server ---------- */
const server = http.createServer((req, res) => {
  if (req.url === "/api/chat") {
    if (req.method !== "POST") return send(res, 405, { error: "method_not_allowed" });
    return handleChat(req, res).catch(() => send(res, 503, { error: "unavailable" }));
  }
  serveStatic(req, res);
});

server.listen(PORT, HOST, () => {
  console.log(`JIAIS berjalan di http://${HOST}:${PORT} (model: ${MODEL})`);
});
