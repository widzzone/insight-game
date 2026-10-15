# InsightLive V2.2 — Upgrade Quiz Battle

**Anda menggunakan InsightLive V2.1 di Vercel + Supabase.** Versi ini tidak memerlukan project Vercel/Supabase baru dan tidak membutuhkan environment variable tambahan.

1. Buka **Supabase → SQL Editor** di project lama.
2. Tempel dan jalankan seluruh isi `supabase/upgrade_v2_1_to_v2_2.sql`. Ini menambahkan perhitungan skor, leaderboard, dan pengecekan waktu pada penyimpanan jawaban. Data lama tidak dihapus.
3. Upload semua source code dari paket V2.2 ke repository GitHub yang digunakan deployment V2.1.
4. Lakukan redeploy di Vercel (biasanya otomatis setelah commit). **Jangan** mempublikasikan `.env.local` maupun kunci rahasia.
5. Buka room, pilih tipe **Quiz**, isi jawaban benar dan durasi timer; aktifkan pertanyaan dan klik **Mulai**.
6. Peserta **wajib memasukkan nama/alias** untuk masuk leaderboard. Di menu **Hasil Langsung** presenter dapat melihat skor; menu **Leaderboard** menampilkan keseluruhan skor semua soal Quiz.
7. Klik **Publikasikan hasil** agar peserta dan layar proyektor melihat jawaban benar beserta klasemen. Nama peserta akan terlihat kepada audiens.

### Aturan skor

- Benar = **1.000 poin**; salah = **0 poin**.
- Jika memakai timer, benar mendapat **bonus 0–500 poin** bergantung sisa waktu pada server: total **1.000–1.500**.
- Tanpa timer, benar mendapat **1.000 poin**.
- Skor Quiz dari berbagai pertanyaan dalam room yang sama diakumulasikan.
- Jika poin sama, jumlah jawaban benar dan rata-rata waktu menjawab dipakai sebagai pemecah seri.
- Jawaban Quiz yang masuk sebelum upgrade mendapat 1.000 poin jika benar tanpa bonus waktu, karena waktu respons aslinya tidak bisa diverifikasi secara penuh.
- Klasemen umum publik hanya menghitung soal Quiz yang **hasilnya sudah dipublikasikan**. Presenter melihat semua skor.

### Catatan penting

- Pastikan **SQL upgrade sudah dijalankan sebelum deployment V2.2**; jika belum, API dapat menampilkan error.
- ID peserta disimpan di browser, sehingga leaderboard bersifat cocok untuk acara internal/semi-formal, **bukan untuk kompetisi hadiah bernilai tinggi**. Peserta dapat mengganti browser untuk membuat identitas lain.
- Menjeda timer menghentikan hitungan mundur; bonus kecepatan bergantung pada sisa timer, bukan wall-clock elapsed time termasuk jeda.
- Proyek belum diuji terhubung ke Supabase/Vercel asli karena tidak memiliki kredensial pengguna. Jalankan pengujian end-to-end dengan minimal 2 peserta sebelum acara.
