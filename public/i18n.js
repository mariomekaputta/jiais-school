/* Localization JIAIS (Indonesia / English) — vanilla JS, tanpa library.
 *
 * Cara pakai di HTML:
 *   data-i18n="key"            → mengganti textContent
 *   data-i18n-html="key"       → mengganti innerHTML (hanya untuk teks statis milik kita di kamus ini)
 *   data-i18n-attr="aria-label:key; title:key2"  → mengganti atribut
 *   data-i18n-wa="key"         → href WhatsApp dengan pesan awal dari kamus
 *
 * Dari JS lain: JIAIS_I18N.t("key", {var: nilai}), JIAIS_I18N.lang(), JIAIS_I18N.onChange(fn)
 *
 * Bahasa dipilih dari: ?lang=en|id di URL → pilihan tersimpan → bahasa browser → Indonesia.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "jiais-lang";
  var SUPPORTED = ["id", "en"];
  var DEFAULT_LANG = "id";
  var WA_NUMBER = "6281200002026";

  var dict = {
    id: {
      "meta.title": "Jakarta International AI School (JIAIS)",
      "meta.description":
        "Jakarta International AI School — sekolah SD, SMP, dan SMA dengan kurikulum internasional yang membekali siswa dengan literasi AI sejak dini.",

      "lang.label": "Pilih bahasa",
      "theme.toDark": "Aktifkan mode gelap",
      "theme.toLight": "Aktifkan mode terang",

      "nav.label": "Navigasi utama",
      "nav.toggle": "Buka menu",
      "nav.about": "Tentang",
      "nav.levels": "Jenjang",
      "nav.features": "Keunggulan",
      "nav.contact": "Kontak",
      "nav.register": "Daftar",

      "hero.eyebrow": "Penerimaan Siswa Baru 2027/2028 dibuka",
      "hero.lead":
        "Sekolah jenjang SD, SMP, dan SMA yang memadukan kurikulum internasional dengan literasi kecerdasan buatan — agar anak tumbuh kritis, kreatif, dan berkarakter di era AI.",
      "hero.ctaWa": "Hubungi Admin via WhatsApp",
      "hero.ctaLevels": "Lihat Jenjang",
      "hero.stat1": "Jenjang pendidikan",
      "hero.stat2": "Rasio guru dan siswa",
      "hero.stat3": "Kelas berbasis proyek",

      "about.eyebrow": "Tentang Kami",
      "about.title": "Belajar bersama AI, tetap berpusat pada manusia",
      "about.body":
        "JIAIS percaya teknologi adalah alat, bukan tujuan. Kami mengajarkan siswa memahami cara kerja AI, menggunakannya secara etis, dan tetap mengasah kemampuan dasar: membaca, berhitung, berpikir kritis, serta berkolaborasi.",

      "levels.eyebrow": "Jenjang Pendidikan",
      "levels.title": "Dari SD hingga SMA",
      "levels.sd.title": "Sekolah Dasar",
      "levels.sd.meta": "Kelas 1 – 6",
      "levels.sd.body": "Fondasi literasi, numerasi, dan rasa ingin tahu. Mengenal komputasi lewat permainan dan cerita.",
      "levels.smp.title": "Sekolah Menengah Pertama",
      "levels.smp.meta": "Kelas 7 – 9",
      "levels.smp.body": "Logika pemrograman, sains data dasar, dan proyek kolaboratif untuk memecahkan masalah nyata.",
      "levels.sma.title": "Sekolah Menengah Atas",
      "levels.sma.meta": "Kelas 10 – 12",
      "levels.sma.body": "Pendalaman AI, etika teknologi, riset mandiri, dan persiapan kuliah di dalam maupun luar negeri.",

      "features.eyebrow": "Keunggulan",
      "features.title": "Kenapa memilih JIAIS?",
      "features.f1.title": "Kurikulum Internasional",
      "features.f1.body": "Standar global dengan pengantar bilingual Indonesia–Inggris.",
      "features.f2.title": "Literasi AI Sejak Dini",
      "features.f2.body": "Siswa belajar memakai, memahami, dan mengevaluasi AI secara bertanggung jawab.",
      "features.f3.title": "Pembelajaran Berbasis Proyek",
      "features.f3.body": "Setiap semester ditutup dengan pameran karya siswa.",
      "features.f4.title": "Karakter & Etika",
      "features.f4.body": "Pendidikan nilai, empati, dan kewargaan digital menjadi inti kurikulum.",

      "cta.title": "Siap bergabung dengan JIAIS?",
      "cta.body": "Tanyakan jadwal tur sekolah, biaya, dan pendaftaran langsung ke admin kami.",

      "footer.levels": "<strong>Jakarta International AI School</strong><br>SD · SMP · SMA",
      "footer.admin": "Admin WA:",
      "footer.note": "© 2026 JIAIS. Sekolah fiktif untuk keperluan demo.",

      "wa.register": "Halo Admin JIAIS, saya ingin info pendaftaran.",
      "wa.general": "Halo Admin JIAIS, saya ingin bertanya.",

      "chat.title": "Asisten JIAIS",
      "chat.status": "Online",
      "chat.open": "Buka chat Asisten JIAIS",
      "chat.close": "Tutup chat",
      "chat.closeShort": "Tutup",
      "chat.expand": "Perbesar jendela chat",
      "chat.expandShort": "Perbesar",
      "chat.shrink": "Perkecil jendela chat",
      "chat.shrinkShort": "Perkecil",
      "chat.clear": "Hapus riwayat percakapan",
      "chat.clearShort": "Hapus riwayat",
      "chat.inputLabel": "Tulis pesan",
      "chat.placeholder": "Tulis pertanyaan...",
      "chat.placeholderEmpty": "Kuota tanya AI hari ini habis",
      "chat.send": "Kirim",
      "chat.typing": "Asisten sedang mengetik",
      "chat.greeting":
        "Halo! Saya Asisten JIAIS. Ada yang bisa saya bantu seputar pendaftaran, biaya, atau kegiatan sekolah?",
      "chat.error": "Asisten tidak tersedia, silahkan menunggu beberapa saat.",
      "chat.suggest1": "Kapan pendaftaran dibuka?",
      "chat.suggest2": "Berapa biaya SPP per jenjang?",
      "chat.suggest3": "Apakah ada beasiswa?",
      "chat.adminButton": "Hubungi Admin via WhatsApp",
      "chat.waAsk": "Halo Admin JIAIS, saya ingin bertanya",
      "chat.waAskQuestion": "Halo Admin JIAIS, saya ingin bertanya: {question}",
      "chat.waQuotaEmpty": "Halo Admin JIAIS, kuota tanya Asisten AI saya hari ini sudah habis. Saya ingin bertanya:",
      "chat.quotaLeft": "Sisa kuota hari ini: {left} dari {max} pertanyaan",
      "chat.quotaEmpty": "Kuota hari ini: 0 dari {max} pertanyaan",
      "chat.quotaEmptyNotice": "Kuota tanya AI hari ini habis, silakan hubungi admin",
    },

    en: {
      "meta.title": "Jakarta International AI School (JIAIS)",
      "meta.description":
        "Jakarta International AI School — primary, middle, and high school with an international curriculum that builds AI literacy from an early age.",

      "lang.label": "Choose language",
      "theme.toDark": "Switch to dark mode",
      "theme.toLight": "Switch to light mode",

      "nav.label": "Main navigation",
      "nav.toggle": "Open menu",
      "nav.about": "About",
      "nav.levels": "Programs",
      "nav.features": "Why JIAIS",
      "nav.contact": "Contact",
      "nav.register": "Apply",

      "hero.eyebrow": "Admissions for 2027/2028 are open",
      "hero.lead":
        "A primary, middle, and high school that blends an international curriculum with artificial intelligence literacy — so children grow up critical, creative, and grounded in character in the age of AI.",
      "hero.ctaWa": "Contact Admin on WhatsApp",
      "hero.ctaLevels": "View Programs",
      "hero.stat1": "School levels",
      "hero.stat2": "Teacher-to-student ratio",
      "hero.stat3": "Project-based classes",

      "about.eyebrow": "About Us",
      "about.title": "Learning with AI, staying human-centered",
      "about.body":
        "At JIAIS, technology is a tool, not the goal. We teach students how AI works and how to use it ethically, while still building the fundamentals: reading, math, critical thinking, and collaboration.",

      "levels.eyebrow": "School Levels",
      "levels.title": "From Primary to High School",
      "levels.sd.title": "Primary School",
      "levels.sd.meta": "Grades 1 – 6",
      "levels.sd.body": "Foundations in literacy, numeracy, and curiosity. Discovering computing through games and stories.",
      "levels.smp.title": "Middle School",
      "levels.smp.meta": "Grades 7 – 9",
      "levels.smp.body": "Programming logic, introductory data science, and collaborative projects that solve real problems.",
      "levels.sma.title": "High School",
      "levels.sma.meta": "Grades 10 – 12",
      "levels.sma.body": "Advanced AI, technology ethics, independent research, and preparation for university in Indonesia and abroad.",

      "features.eyebrow": "Why JIAIS",
      "features.title": "Why choose JIAIS?",
      "features.f1.title": "International Curriculum",
      "features.f1.body": "Global standards with bilingual Indonesian–English instruction.",
      "features.f2.title": "Early AI Literacy",
      "features.f2.body": "Students learn to use, understand, and evaluate AI responsibly.",
      "features.f3.title": "Project-Based Learning",
      "features.f3.body": "Every semester ends with an exhibition of student work.",
      "features.f4.title": "Character & Ethics",
      "features.f4.body": "Values, empathy, and digital citizenship are at the heart of the curriculum.",

      "cta.title": "Ready to join JIAIS?",
      "cta.body": "Ask our admin directly about school tours, fees, and admissions.",

      "footer.levels": "<strong>Jakarta International AI School</strong><br>Primary · Middle · High School",
      "footer.admin": "Admin WhatsApp:",
      "footer.note": "© 2026 JIAIS. A fictional school for demo purposes.",

      "wa.register": "Hello JIAIS Admin, I would like information about admissions.",
      "wa.general": "Hello JIAIS Admin, I have a question.",

      "chat.title": "JIAIS Assistant",
      "chat.status": "Online",
      "chat.open": "Open JIAIS Assistant chat",
      "chat.close": "Close chat",
      "chat.closeShort": "Close",
      "chat.expand": "Enlarge chat window",
      "chat.expandShort": "Enlarge",
      "chat.shrink": "Shrink chat window",
      "chat.shrinkShort": "Shrink",
      "chat.clear": "Clear chat history",
      "chat.clearShort": "Clear history",
      "chat.inputLabel": "Write a message",
      "chat.placeholder": "Type your question...",
      "chat.placeholderEmpty": "Today's AI question limit is used up",
      "chat.send": "Send",
      "chat.typing": "Assistant is typing",
      "chat.greeting":
        "Hi! I'm the JIAIS Assistant. How can I help you with admissions, fees, or school activities?",
      "chat.error": "The assistant is unavailable. Please try again in a moment.",
      "chat.suggest1": "When do admissions open?",
      "chat.suggest2": "How much are the monthly fees per level?",
      "chat.suggest3": "Are scholarships available?",
      "chat.adminButton": "Contact Admin on WhatsApp",
      "chat.waAsk": "Hello JIAIS Admin, I have a question",
      "chat.waAskQuestion": "Hello JIAIS Admin, I have a question: {question}",
      "chat.waQuotaEmpty": "Hello JIAIS Admin, I've used up today's AI assistant questions. My question is:",
      "chat.quotaLeft": "Questions left today: {left} of {max}",
      "chat.quotaEmpty": "Questions left today: 0 of {max}",
      "chat.quotaEmptyNotice": "You've used today's AI question limit. Please contact our admin.",
    },
  };

  var current = DEFAULT_LANG;
  var listeners = [];

  function t(key, vars) {
    var s = (dict[current] && dict[current][key]) || dict[DEFAULT_LANG][key] || key;
    if (vars) {
      s = s.replace(/\{(\w+)\}/g, function (m, name) {
        return Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : m;
      });
    }
    return s;
  }

  function waHref(message) {
    return "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(message);
  }

  function apply(root) {
    root = root || document;
    var i, el;

    var textEls = root.querySelectorAll("[data-i18n]");
    for (i = 0; i < textEls.length; i++) {
      el = textEls[i];
      el.textContent = t(el.getAttribute("data-i18n"));
    }

    var htmlEls = root.querySelectorAll("[data-i18n-html]");
    for (i = 0; i < htmlEls.length; i++) {
      el = htmlEls[i];
      el.innerHTML = t(el.getAttribute("data-i18n-html")); // hanya string statis dari kamus di atas
    }

    var attrEls = root.querySelectorAll("[data-i18n-attr]");
    for (i = 0; i < attrEls.length; i++) {
      el = attrEls[i];
      el.getAttribute("data-i18n-attr").split(";").forEach(function (pair) {
        var parts = pair.split(":");
        if (parts.length === 2) el.setAttribute(parts[0].trim(), t(parts[1].trim()));
      });
    }

    var waEls = root.querySelectorAll("[data-i18n-wa]");
    for (i = 0; i < waEls.length; i++) {
      el = waEls[i];
      el.href = waHref(t(el.getAttribute("data-i18n-wa")));
    }

    document.documentElement.lang = current;
    document.title = t("meta.title");
    var desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", t("meta.description"));

    var buttons = document.querySelectorAll("[data-lang]");
    for (i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute("aria-pressed", String(buttons[i].getAttribute("data-lang") === current));
    }
  }

  function setLang(lang, persist) {
    if (SUPPORTED.indexOf(lang) === -1) lang = DEFAULT_LANG;
    current = lang;
    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch (e) {
        /* abaikan */
      }
      // Bila URL memakai ?lang=, samakan agar reload tidak kembali ke bahasa lama.
      try {
        var url = new URL(location.href);
        if (url.searchParams.has("lang")) {
          url.searchParams.set("lang", lang);
          history.replaceState(null, "", url);
        }
      } catch (e) {
        /* abaikan */
      }
    }
    apply();
    listeners.forEach(function (fn) {
      try {
        fn(current);
      } catch (e) {
        /* satu listener error tidak boleh merusak yang lain */
      }
    });
  }

  function detectLang() {
    try {
      var fromUrl = new URLSearchParams(location.search).get("lang");
      if (fromUrl && SUPPORTED.indexOf(fromUrl) !== -1) return fromUrl;
    } catch (e) {
      /* abaikan */
    }
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED.indexOf(saved) !== -1) return saved;
    } catch (e) {
      /* abaikan */
    }
    var nav = (navigator.language || "").toLowerCase();
    return nav.indexOf("en") === 0 ? "en" : DEFAULT_LANG;
  }

  window.JIAIS_I18N = {
    t: t,
    waHref: waHref,
    lang: function () {
      return current;
    },
    setLang: function (lang) {
      setLang(lang, true);
    },
    onChange: function (fn) {
      listeners.push(fn);
    },
  };

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-lang]");
    if (btn) setLang(btn.getAttribute("data-lang"), true);
  });

  setLang(detectLang(), false);
})();
