# Progress — Jakarta International AI School (JIAIS)

## Ringkasan proyek

Landing page satu halaman untuk sekolah fiktif **Jakarta International AI School (JIAIS)**, jenjang **SD, SMP, dan SMA**.

- **Stack:** HTML + CSS murni, JavaScript vanilla untuk widget chat, dan server Node.js tanpa dependensi (`server.js`) sebagai proxy ke Gemini.
- **AI:** model `gemini-3.5-flash-lite`, system prompt di `prompts/system-prompt.md` + data dari `FAQ.md`.
- **Desain:** clean, terang (putih + biru/teal), responsif untuk HP.
- **Kontak:** WhatsApp admin `081200002026` → link `https://wa.me/6281200002026` (dengan pesan pembuka otomatis).

## Struktur file

| File | Isi |
|---|---|
| `index.html` | Header + navigasi, Hero, Tentang, Jenjang (SD/SMP/SMA), Keunggulan, CTA WhatsApp, Footer |
| `chat.js` | Widget chat Asisten JIAIS: buka/tutup, riwayat (localStorage), indikator mengetik, 3 pertanyaan contoh, kirim riwayat ke `/api/chat` |
| `server.js` | Server Node: sajikan file statis (whitelist) + `POST /api/chat` → Gemini. API key hanya di server |
| `prompts/system-prompt.md` | Instruksi Asisten JIAIS (untuk direview) |
| `package.json` | `npm start` → `node server.js` |
| `.env.example` | Contoh `.env` (file `.env` asli di-ignore git) |
| `style.css` | Variabel warna, layout grid/flex, breakpoint 900px (tablet) dan 720px (HP) |
| `.claude/launch.json` | Konfigurasi preview: `node server.js` (port 3000) |
| `FAQ.md` | 20 tanya-jawab fiktif: pendaftaran, tes, biaya per jenjang, beasiswa, jam sekolah, seragam, ekskul, antar jemput, kontak |
| `progress.md` | Dokumen ini |

## Menjalankan preview

1. Salin `.env.example` menjadi `.env`, isi `GEMINI_API_KEY`.
2. Jalankan:

```bash
npm start
```

Lalu buka http://localhost:3000. Server hanya listen di `127.0.0.1` (set `HOST=0.0.0.0` bila perlu diakses dari jaringan).

> Jangan pakai `python3 -m http.server` lagi: server itu menyajikan semua file, termasuk `.env`.

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
- [x] Tombol perbesar/perkecil chat: mode besar minimal setengah lebar layar dan ~85% tinggi layar (desktop/tablet), pilihan diingat browser; disembunyikan di HP karena panel sudah hampir layar penuh

## Catatan / ide berikutnya

- Menu HP tidak otomatis menutup setelah link diklik (keterbatasan pendekatan tanpa JS).
- Belum ada foto/gambar sekolah, form pendaftaran, peta lokasi, atau favicon.
- System prompt menunggu review. Data sekolah diambil dari `FAQ.md`, jadi mengubah FAQ otomatis mengubah jawaban asisten (setelah server di-restart).
- Rate limit masih in-memory; untuk deploy multi-instance perlu store bersama (mis. Redis) dan logging/monitoring biaya token.
- Angka statistik (rasio guru 1:15, dll.) adalah contoh fiktif.

## Riwayat commit

- `Initial landing page JIAIS` — index.html, style.css, preview config, progress.md
- `Add FAQ.md` — 20 tanya-jawab fiktif yang konsisten dengan landing page
- `Add floating chat widget` — widget Asisten JIAIS dengan balasan dummy
- `Use relative path in preview config` — hapus path lokal sebelum repo publik
- `Connect Asisten JIAIS to Gemini via server proxy` — server.js, system prompt, chat.js memanggil /api/chat
- `Add expand toggle to chat widget` — mode besar minimal setengah layar
