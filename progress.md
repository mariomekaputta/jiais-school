# Progress — Jakarta International AI School (JIAIS)

## Ringkasan proyek

Landing page satu halaman untuk sekolah fiktif **Jakarta International AI School (JIAIS)**, jenjang **SD, SMP, dan SMA**.

- **Stack:** HTML + CSS murni, JavaScript vanilla untuk widget chat, dan server Node.js tanpa dependensi (`server.js`) sebagai proxy ke Gemini.
- **AI:** model `gemini-3.5-flash-lite`, system prompt per bahasa di `prompts/system-prompt.id.md` dan `prompts/system-prompt.en.md` + data dari `FAQ.md`.
- **Desain:** clean, terang (putih + biru/teal), responsif untuk HP.
- **Kontak:** WhatsApp admin `081200002026` → link `https://wa.me/6281200002026` (dengan pesan pembuka otomatis).

## Struktur file

| File | Isi |
|---|---|
| `public/index.html` | Halaman: header + navigasi, Hero, Tentang, Jenjang (SD/SMP/SMA), Keunggulan, CTA WhatsApp, Footer, widget chat |
| `public/style.css` | Token warna terang/gelap, layout grid/flex, breakpoint 900px (tablet) dan 720px (HP) |
| `public/i18n.js` | Kamus dan logika bahasa Indonesia/English |
| `public/theme.js` | Tombol mode terang/gelap |
| `public/chat.js` | Widget chat Asisten JIAIS: riwayat, indikator mengetik, pertanyaan contoh, kuota harian, tombol WA |
| `lib/chat-core.js` | Logika chat bersama: validasi, prompt per bahasa, rate limit, panggilan Gemini. API key hanya di sini (server) |
| `api/chat.js` | Vercel Serverless Function `POST /api/chat` |
| `server.js` | Server lokal: sajikan `public/` (whitelist) + `POST /api/chat` |
| `vercel.json` | Konfigurasi Vercel: `public/` sebagai output, sertakan prompt + FAQ ke function |
| `prompts/system-prompt.id.md` | Instruksi Asisten JIAIS bahasa Indonesia |
| `prompts/system-prompt.en.md` | Instruksi Asisten JIAIS bahasa Inggris (menerjemahkan data FAQ berbahasa Indonesia) |
| `FAQ.md` | 20 tanya-jawab fiktif; juga dipakai sebagai data asisten |
| `package.json` | `npm start` → `node server.js` |
| `.env.example` | Contoh `.env` (file `.env` asli di-ignore git) |
| `.claude/launch.json` | Konfigurasi preview: `node server.js` (port 3000) |
| `progress.md` | Dokumen ini |

## Menjalankan lokal

1. Salin `.env.example` menjadi `.env`, isi `GEMINI_API_KEY`.
2. Jalankan `npm start`, lalu buka http://localhost:3000.

Server hanya listen di `127.0.0.1` (set `HOST=0.0.0.0` bila perlu diakses dari jaringan).

> Jangan pakai `python3 -m http.server`: server itu menyajikan semua file, termasuk `.env`.

## Deploy ke Vercel

1. Import repo GitHub ke Vercel, Framework Preset: **Other** (tanpa build command).
2. Project Settings → Environment Variables → tambah `GEMINI_API_KEY` (Production, Preview).
3. Redeploy. Vercel menyajikan `public/` sebagai website dan `api/chat.js` sebagai function.

Catatan: rate limit 20 req/menit per IP disimpan di memori per instance function, jadi di Vercel tidak benar-benar global. Untuk produksi, pakai store bersama (mis. Upstash Redis / Vercel KV) dan pasang budget alert di Google Cloud.

## Yang sudah selesai

- [x] Struktur halaman dan konten bahasa Indonesia
- [x] Tiga kartu jenjang SD, SMP, SMA
- [x] Tombol WhatsApp di hero, navigasi, CTA, dan footer
- [x] Menu hamburger HP berbasis checkbox (tanpa JS)
- [x] Dicek di desktop dan viewport HP 375px (tidak ada scroll horizontal)
- [x] Tombol chat melayang (kanan bawah) membuka jendela "Asisten JIAIS": riwayat percakapan tersimpan di browser, indikator "sedang mengetik", 3 pertanyaan contoh, tombol hapus riwayat, tutup dengan Esc
- [x] Chat terhubung ke Gemini lewat proxy server; riwayat dikirim agar bisa tanya lanjutan
- [x] Keamanan: key tidak ada di kode front-end, Network tab, maupun git; whitelist file statis; batas ukuran request, riwayat 20 pesan, timeout 20 dtk, rate limit 20 req/menit per IP
- [x] Error/timeout/server mati → "Asisten tidak tersedia, silahkan menunggu beberapa saat." tanpa crash (pesan error tidak dikirim ulang ke AI)
- [x] Jawaban terstruktur dari Gemini `{reply, perlu_admin}`; bila `perlu_admin: true` (di luar topik, info tidak ada di data, butuh kepastian sekolah, ingin daftar/tur/bayar) atau asisten error, widget menampilkan tombol "Hubungi Admin via WhatsApp" dengan pesan awal berisi pertanyaan pengguna
- [x] Kuota 5 pertanyaan per pengunjung per hari (dihitung di browser via localStorage, reset saat tanggal lokal berganti). Sisa kuota tampil di bawah kotak ketik; saat habis kotak ketik dinonaktifkan dan muncul "Kuota tanya AI hari ini habis, silakan hubungi admin" + tombol WhatsApp. Kuota dikembalikan bila asisten error; hapus riwayat tidak me-reset kuota
- [x] Localization website Indonesia/English: tombol ID/EN di header, pilihan diingat browser, bisa via `?lang=en`, default dari bahasa browser. Teks UI widget chat ikut diterjemahkan; jawaban AI dan prompt belum (masih bahasa Indonesia)
- [x] Dark mode: mengikuti pengaturan sistem, bisa dipaksa lewat tombol ☾/☀ di header (pilihan diingat, tanpa kedip saat load). Semua warna lewat token CSS; kontras teks utama dicek ≥ 4,5:1 (tombol biru & tombol WhatsApp ikut dipekatkan)
- [x] Asisten menjawab sesuai bahasa website: widget mengirim `lang`, server memilih prompt ID/EN (bahasa tidak dikenal → ID)
- [x] Tombol perbesar/perkecil chat: mode besar minimal setengah lebar layar dan ~85% tinggi layar (desktop/tablet), pilihan diingat browser; disembunyikan di HP karena panel sudah hampir layar penuh

## Catatan / ide berikutnya

- Menu HP tidak otomatis menutup setelah link diklik (keterbatasan pendekatan tanpa JS).
- Belum ada foto/gambar sekolah, form pendaftaran, peta lokasi, atau favicon.
- System prompt: asisten hanya menjawab topik JIAIS; topik lain dibalas kalimat penolakan baku. Masih terbuka untuk review. Data sekolah diambil dari `FAQ.md`, jadi mengubah FAQ otomatis mengubah jawaban asisten (setelah server di-restart).
- Gemini cukup sering membalas 503 (server sibuk) saat uji; pertimbangkan retry otomatis 1x di server.
- FAQ.md masih hanya bahasa Indonesia; prompt EN menerjemahkan faktanya. Untuk akurasi istilah, pertimbangkan FAQ.en.md terpisah.
- Kuota harian hanya di browser, mudah dilewati (hapus data situs / mode incognito / panggil API langsung). Batas yang benar-benar melindungi biaya tetap harus di server.
- Rate limit masih in-memory; untuk deploy multi-instance perlu store bersama (mis. Redis) dan logging/monitoring biaya token.
- Angka statistik (rasio guru 1:15, dll.) adalah contoh fiktif.

## Riwayat commit

- `Initial landing page JIAIS` — index.html, style.css, preview config, progress.md
- `Add FAQ.md` — 20 tanya-jawab fiktif yang konsisten dengan landing page
- `Add floating chat widget` — widget Asisten JIAIS dengan balasan dummy
- `Use relative path in preview config` — hapus path lokal sebelum repo publik
- `Connect Asisten JIAIS to Gemini via server proxy` — server.js, system prompt, chat.js memanggil /api/chat
- `Add expand toggle to chat widget` — mode besar minimal setengah layar
- `Restrict assistant to JIAIS topics only` — tolak topik lain (politik, olahraga umum, dll.)
- `Add perlu_admin flag and WhatsApp handoff button` — structured output Gemini + tombol WA di widget
- `Add daily 5-question quota per visitor` — kuota harian di browser + tampilan sisa kuota
- `Add Indonesian/English localization for the website` — i18n.js + tombol ID/EN
- `Add dark mode and per-language assistant prompts` — theme.js, token warna, prompt ID/EN
- `Make project deployable on Vercel` — public/, api/chat.js, lib/chat-core.js, vercel.json
