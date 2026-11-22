/* Widget chat "Asisten JIAIS" — vanilla JS, tanpa framework.
   Balasan diambil dari server sendiri (/api/chat), yang meneruskannya ke Gemini.
   API key hanya ada di server; browser tidak pernah mengirim atau menerimanya. */
(function () {
  "use strict";

  var STORAGE_KEY = "jiais-chat-history";
  var API_URL = "/api/chat";
  var ERROR_REPLY = "Asisten tidak tersedia, silahkan menunggu beberapa saat.";
  var GREETING = "Halo! Saya Asisten JIAIS. Ada yang bisa saya bantu seputar pendaftaran, biaya, atau kegiatan sekolah?";
  var MIN_TYPING_MS = 600; // agar indikator mengetik tidak sekadar berkedip
  var REQUEST_TIMEOUT_MS = 25000;
  var MAX_HISTORY_SENT = 20;

  var panel = document.getElementById("chat-panel");
  var toggleBtn = document.getElementById("chat-toggle");
  var closeBtn = document.getElementById("chat-close");
  var clearBtn = document.getElementById("chat-clear");
  var list = document.getElementById("chat-messages");
  var suggestions = document.getElementById("chat-suggestions");
  var form = document.getElementById("chat-form");
  var input = document.getElementById("chat-input");

  var history = loadHistory();
  var busy = false;

  /* ---------- Penyimpanan riwayat (localStorage, aman bila diblokir) ---------- */
  function loadHistory() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function saveHistory() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      /* abaikan: riwayat tetap ada selama halaman terbuka */
    }
  }

  /* ---------- Render ---------- */
  function formatTime(ts) {
    var d = new Date(ts);
    return String(d.getHours()).padStart(2, "0") + "." + String(d.getMinutes()).padStart(2, "0");
  }

  function renderMessage(msg) {
    var row = document.createElement("div");
    row.className = "msg msg-" + msg.role;

    var bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = msg.text; // textContent: aman dari injeksi HTML

    var time = document.createElement("span");
    time.className = "msg-time";
    time.textContent = formatTime(msg.time);

    row.appendChild(bubble);
    row.appendChild(time);
    list.appendChild(row);
  }

  function renderAll() {
    list.innerHTML = "";
    renderMessage({ role: "bot", text: GREETING, time: history.length ? history[0].time : Date.now() });
    history.forEach(renderMessage);
    suggestions.hidden = history.length > 0;
    scrollToBottom();
  }

  function scrollToBottom() {
    list.scrollTop = list.scrollHeight;
  }

  function showTyping() {
    var row = document.createElement("div");
    row.className = "msg msg-bot";
    row.id = "chat-typing";
    row.innerHTML =
      '<div class="bubble typing" aria-label="Asisten sedang mengetik">' +
      "<span></span><span></span><span></span></div>";
    list.appendChild(row);
    scrollToBottom();
  }

  function hideTyping() {
    var el = document.getElementById("chat-typing");
    if (el) el.remove();
  }

  /* ---------- Logika percakapan ---------- */
  function addMessage(role, text, isError) {
    var msg = { role: role, text: text, time: Date.now() };
    if (isError) msg.error = true; // pesan error tidak dikirim ke AI sebagai riwayat
    history.push(msg);
    saveHistory();
    renderMessage(msg);
    scrollToBottom();
  }

  // Riwayat yang dikirim ke server: hanya role + text, tanpa pesan error.
  function historyForRequest() {
    return history
      .filter(function (m) { return !m.error; })
      .slice(-MAX_HISTORY_SENT)
      .map(function (m) { return { role: m.role, text: m.text }; });
  }

  // Selalu resolve (tidak pernah reject): {text, error}
  function getReply() {
    var controller = typeof AbortController === "function" ? new AbortController() : null;
    var timer = setTimeout(function () { if (controller) controller.abort(); }, REQUEST_TIMEOUT_MS);

    return fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: historyForRequest() }),
      signal: controller ? controller.signal : undefined,
    })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (data) {
        if (!data || typeof data.reply !== "string" || !data.reply.trim()) throw new Error("empty");
        return { text: data.reply.trim(), error: false };
      })
      .catch(function () {
        return { text: ERROR_REPLY, error: true };
      })
      .finally(function () {
        clearTimeout(timer);
      });
  }

  function send(text) {
    text = text.trim();
    if (!text || busy) return;

    busy = true;
    suggestions.hidden = true;
    addMessage("user", text);
    input.value = "";
    showTyping();

    var minDelay = new Promise(function (r) { setTimeout(r, MIN_TYPING_MS); });
    Promise.all([getReply(), minDelay])
      .then(function (res) {
        hideTyping();
        addMessage("bot", res[0].text, res[0].error);
      })
      .catch(function () {
        hideTyping();
        addMessage("bot", ERROR_REPLY, true);
      })
      .finally(function () {
        busy = false;
        input.focus();
      });
  }

  /* ---------- Buka / tutup ---------- */
  function setOpen(open) {
    panel.hidden = !open;
    toggleBtn.setAttribute("aria-expanded", String(open));
    toggleBtn.setAttribute("aria-label", open ? "Tutup chat" : "Buka chat Asisten JIAIS");
    document.body.classList.toggle("chat-open", open);
    if (open) {
      scrollToBottom();
      input.focus();
    } else {
      toggleBtn.focus();
    }
  }

  /* ---------- Event ---------- */
  toggleBtn.addEventListener("click", function () { setOpen(panel.hidden); });
  closeBtn.addEventListener("click", function () { setOpen(false); });

  clearBtn.addEventListener("click", function () {
    if (busy) return;
    history = [];
    saveHistory();
    renderAll();
    input.focus();
  });

  suggestions.addEventListener("click", function (e) {
    var chip = e.target.closest(".chip");
    if (chip) send(chip.textContent);
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    send(input.value);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !panel.hidden) setOpen(false);
  });

  renderAll();
})();
