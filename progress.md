# Progress — Jakarta International AI School (JIAIS)

## Ringkasan proyek

Landing page satu halaman untuk sekolah fiktif **Jakarta International AI School (JIAIS)**, jenjang **SD, SMP, dan SMA**.

- **Stack:** HTML + CSS murni, plus JavaScript vanilla khusus untuk widget chat (tanpa framework).
- **Desain:** clean, terang (putih + biru/teal), responsif untuk HP.
- **Kontak:** WhatsApp admin `081200002026` → link `https://wa.me/6281200002026` (dengan pesan pembuka otomatis).

## Struktur file

| File | Isi |
|---|---|
| `index.html` | Header + navigasi, Hero, Tentang, Jenjang (SD/SMP/SMA), Keunggulan, CTA WhatsApp, Footer |
| `chat.js` | Widget chat Asisten JIAIS: buka/tutup, riwayat (localStorage), indikator mengetik, 3 pertanyaan contoh, balasan dummy |
| `style.css` | Variabel warna, layout grid/flex, breakpoint 900px (tablet) dan 720px (HP) |
| `.claude/launch.json` | Konfigurasi preview: `python3 -m http.server 3000` |
| `FAQ.md` | 20 tanya-jawab fiktif: pendaftaran, tes, biaya per jenjang, beasiswa, jam sekolah, seragam, ekskul, antar jemput, kontak |
| `progress.md` | Dokumen ini |

## Menjalankan preview

```bash
python3 -m http.server 3000
```

Lalu buka http://localhost:3000.

## Yang sudah selesai

- [x] Struktur halaman dan konten bahasa Indonesia
- [x] Tiga kartu jenjang SD, SMP, SMA
- [x] Tombol WhatsApp di hero, navigasi, CTA, dan footer
- [x] Menu hamburger HP berbasis checkbox (tanpa JS)
- [x] Dicek di desktop dan viewport HP 375px (tidak ada scroll horizontal)
- [x] Tombol chat melayang (kanan bawah) membuka jendela "Asisten JIAIS": riwayat percakapan tersimpan di browser, indikator "sedang mengetik", 3 pertanyaan contoh, tombol hapus riwayat, tutup dengan Esc

## Catatan / ide berikutnya

- Menu HP tidak otomatis menutup setelah link diklik (keterbatasan pendekatan tanpa JS).
- Belum ada foto/gambar sekolah, form pendaftaran, peta lokasi, atau favicon.
- Balasan chat masih dummy ("Asisten segera hadir"); ganti fungsi `getReply()` di `chat.js` saat backend/AI siap.
- Angka statistik (rasio guru 1:15, dll.) adalah contoh fiktif.

## Riwayat commit

- `Initial landing page JIAIS` — index.html, style.css, preview config, progress.md
- `Add FAQ.md` — 20 tanya-jawab fiktif yang konsisten dengan landing page
- `Add floating chat widget` — widget Asisten JIAIS dengan balasan dummy
