# InsightLive V2.1 — Update Vercel + Supabase + Gemini

Ini adalah **revisi V2 yang Anda pilih** (bukan versi Google Sheets). Tampilan aslinya dipertahankan.

## Yang berubah

- **Tidak ada lagi teks AI/Gemini di website**: "AI Insight" menjadi "Insight", "AI Summary" menjadi "Ringkasan Hasil", "Analisis Gemini" menjadi "Analisis jawaban", termasuk landing page, halaman presenter, peserta, dan layar proyektor.
- **Timer per pertanyaan**: pilih 15, 30, 45, 60, 90, 120, 180, 300, atau 600 detik; atau tanpa timer.
- Timer bisa **Mulai**, **Jeda/Lanjutkan**, dan **Ulangi** melalui menu Pertanyaan atau Hasil Langsung.
- Timer tampak di HP peserta dan layar proyektor, diperbarui setiap detik. Status disimpan di server, sehingga waktu tidak kembali ke awal hanya karena refresh.
- Saat belum dimulai, dijeda, atau habis, server **menolak jawaban baru**. Peserta bisa menunggu timer dimulai lagi.
- Menu `Live responses` diganti menjadi **Hasil Langsung** agar lebih jelas.

## Cara upgrade bila V2 sudah deploy

1. **Supabase → SQL Editor**: jalankan isi file `supabase/upgrade_v2_to_v2_1.sql`.
2. **GitHub/Vercel**: ganti project V2 dengan file dari folder project yang baru ini, commit, lalu deploy ulang.
3. **Tidak perlu** membuat database baru dan **tidak perlu mengganti** environment variables. Data yang ada dipertahankan oleh SQL migration.
4. Buka room presenter. Di **Pertanyaan → Kontrol sesi**, pilih durasi timer pada pertanyaan aktif (bahkan jika pertanyaan sudah pernah mendapatkan jawaban), lalu klik **Mulai**.
5. Pengaturan durasi untuk pertanyaan baru juga tersedia di form **Tambah pertanyaan**.

**Bedanya menu:** `Pertanyaan` untuk membuat/mengatur jalannya sesi; `Hasil Langsung` untuk melihat jawaban dan kesimpulan sambil sesi berlangsung. Timer dapat dikontrol dari keduanya.

**Penting:** Gemini API tetap digunakan di backend untuk fitur Insight, walaupun tidak disebut di antarmuka. Data jawaban yang dianalisis tetap dikirim ke layanan Gemini sesuai pemanggilan API. Timer bukan leaderboard; kuis belum memiliki ranking poin.

## Batasan pengujian

Pemeriksaan parse JSX/JS dan tes perhitungan lokal berhasil. Build Next.js/deployment Vercel end-to-end serta uji database Supabase dan Gemini secara nyata masih harus dilakukan di project Anda (akses kredensial tidak tersedia dalam paket ini).
