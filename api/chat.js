/*
 * Vercel Serverless Function: POST /api/chat
 * Set GEMINI_API_KEY di Vercel → Project Settings → Environment Variables.
 */
"use strict";

const { handleChatPayload, LIMITS } = require("../lib/chat-core");

const SECURITY_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};

function reply(res, status, data) {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.setHeader(k, v);
  res.statusCode = status;
  res.end(JSON.stringify(data));
}

// Vercel mem-parse body JSON otomatis; tetap ditangani bila datang sebagai string/kosong.
function parseBody(req) {
  let body = req.body;
  if (typeof body === "string") {
    if (body.length > LIMITS.bodyBytes) return { tooLarge: true };
    try {
      body = JSON.parse(body);
    } catch {
      return { body: null };
    }
  }
  if (body && JSON.stringify(body).length > LIMITS.bodyBytes) return { tooLarge: true };
  return { body: body || null };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return reply(res, 405, { error: "method_not_allowed" });
  }

  let parsed;
  try {
    parsed = parseBody(req);
  } catch {
    return reply(res, 400, { error: "bad_request" });
  }
  if (parsed.tooLarge) return reply(res, 413, { error: "bad_request" });

  // Vercel mengisi x-forwarded-for dengan IP asli pengunjung.
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";

  const { status, data } = await handleChatPayload({ body: parsed.body, ip });
  return reply(res, status, data);
};
