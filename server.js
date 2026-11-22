/*
 * Server lokal JIAIS — Node.js murni, tanpa dependensi. Jalankan: npm start
 *
 * 1. Menyajikan file statis dari folder public/ (hanya daftar file yang diizinkan).
 * 2. Endpoint POST /api/chat → lib/chat-core.js (logika yang sama dengan api/chat.js di Vercel).
 */
"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { handleChatPayload, LIMITS, MODEL } = require("./lib/chat-core");

const PUBLIC_DIR = path.join(__dirname, "public");
const PORT = Number(process.env.PORT) || 3000;
// Default hanya bisa diakses dari komputer ini. Set HOST=0.0.0.0 bila perlu diakses dari jaringan.
const HOST = process.env.HOST || "127.0.0.1";

/* ---------- File statis: whitelist eksplisit dari public/ ---------- */
const STATIC_FILES = {
  "/": { file: "index.html", type: "text/html; charset=utf-8" },
  "/index.html": { file: "index.html", type: "text/html; charset=utf-8" },
  "/style.css": { file: "style.css", type: "text/css; charset=utf-8" },
  "/i18n.js": { file: "i18n.js", type: "text/javascript; charset=utf-8" },
  "/theme.js": { file: "theme.js", type: "text/javascript; charset=utf-8" },
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
  fs.readFile(path.join(PUBLIC_DIR, entry.file), (err, data) => {
    if (err) return send(res, 500, "Server error", "text/plain; charset=utf-8");
    send(res, 200, req.method === "HEAD" ? "" : data, entry.type);
  });
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

async function handleChat(req, res) {
  let body;
  try {
    body = await readJson(req);
  } catch (e) {
    return send(res, e.message === "too_large" ? 413 : 400, { error: "bad_request" });
  }
  const { status, data } = await handleChatPayload({ body, ip: req.socket.remoteAddress });
  send(res, status, data);
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
