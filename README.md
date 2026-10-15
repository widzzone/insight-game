# InsightLive V2.2 — Vercel + Supabase + Gemini

Aplikasi presentasi interaktif (berbahasa Indonesia) dengan 7 format pertanyaan, layar presenter, layar peserta dan proyektor. Kode sumber siap untuk diimpor ke GitHub/Vercel; **belum di-deploy** dan memerlukan kredensial pengguna.

## V2.2 — Quiz Battle

Lihat `MULAI_DI_SINI.md` untuk upgrade **dari V2.1 ke V2.2**. Skor Quiz diproses dan divalidasi di Supabase, dan klasemen diakumulasi untuk seluruh Quiz dalam satu room.

## V2.1 — Pembaruan dari V2 (langkah historis)

Jika sebelumnya **sudah menggunakan V2 Supabase di Vercel**, jangan buat database baru dan jangan hapus room lama.

1. Buka **Supabase project yang sudah dipakai** → **SQL Editor**.
2. Jalankan `supabase/upgrade_v2_to_v2_1.sql` (hanya menambah kolom timer; tidak menghapus jawaban).
3. Ganti source code V2 Anda dengan isi paket ini dalam repository GitHub yang terhubung ke Vercel. **Jangan** menimpa `.env.local`/membagikan secret.
4. Deploy ulang di Vercel. **Environment variables lama tetap sama**, tidak perlu Gemini API key baru.
5. Di menu **Pertanyaan**, pilih durasi timer per pertanyaan atau atur timer pertanyaan aktif pada **Kontrol sesi**, lalu klik **Mulai**.
6. Timer juga tampil di **Hasil Langsung**, HP audiens, dan layar proyektor.

Catatan: durasi 0 berarti tanpa timer. Timer yang belum dimulai atau dijeda akan menahan pengiriman jawaban; setelah hitungan mencapai 00:00, server menolak jawaban baru. **Ulangi** mengatur ulang waktu, bukan menghapus jawaban. Saat pindah pertanyaan aktif, timer pertanyaan baru kembali ke posisi siap. Menu **Pertanyaan** untuk penyusunan/aktivasi pertanyaan; **Hasil Langsung** untuk melihat hasil dan analisis.

Label halaman yang menyebut teknologi AI/Gemini dihapus dari antarmuka, tetapi Gemini tetap berjalan di server ketika tombol **Analisis jawaban** ditekan. Pertimbangkan kebijakan privasi Anda karena teks jawaban akan dikirim ke layanan tersebut untuk analisis.

## Fitur

| Format | Jawaban peserta | Hasil |
|---|---|---|
| Insight | Teks bebas | Gemini membentuk 1–6 kelompok makna + ringkasan + insight |
| Word Cloud | 1–6 kata | Awan kata otomatis berdasarkan frekuensi |
| Multiple Choice | Satu / beberapa pilihan (opsional) | Diagram batang, jumlah, persentase |
| Quiz | Satu pilihan | Diagram dan jawaban benar ketika presenter membuka hasil |
| Rating Scale | Nilai 1–5 / 1–10 | Rata-rata & distribusi nilai |
| Open Wall | Teks bebas | Kartu-kartu jawaban |
| Ranking | Urutan pilihan | Skor Borda & peringkat teratas |

- Satu room dapat berisi sampai 50 pertanyaan; presenter bisa mengaktifkan ronde kapan saja.
- Satu jawaban per browser/perangkat untuk tiap pertanyaan (unik menurut `visitor_id`; bukan pencegahan fraud tingkat tinggi).
- Hasil tampil otomatis setelah presenter memilih **Tampilkan hasil**. Data nonpublik tidak diekspos oleh API.
- Data disimpan di Supabase Postgres dan dapat diekspor CSV per pertanyaan aktif.
- 5 tema warna, QR code, kode room, panel proyektor fullscreen, polling setiap 4 detik.
- Gemini API dipanggil **hanya di backend** dan hanya ketika presenter klik **Analisis jawaban** (atau analisis ulang). Tidak ada fallback kata kunci untuk AI Insight.

## 1. Siapkan Supabase

1. Buat project di [supabase.com](https://supabase.com).
2. Buka **SQL Editor**, salin semua isi `supabase/schema.sql`, dan klik **Run**.
3. Dari halaman **Connect** / **Project Settings → API Keys**, catat `Project URL` dan key **secret** (`sb_secret_...`). Key secret hanya digunakan server, **JANGAN** ditaruh di browser atau di GitHub.
4. Supabase wajib aktif agar polling multi-pengguna di Vercel tersimpan permanen.

## 2. Siapkan Gemini

1. Buat Gemini API key di [Google AI Studio](https://aistudio.google.com/apikey).
2. Catat key tersebut di `GEMINI_API_KEY`.
3. Default model `gemini-3.5-flash-lite`; bisa diganti `GEMINI_MODEL` dengan model yang didukung akun Anda. Penggunaan API dapat terkena kuota/biaya.

## 3. Jalankan di komputer (opsional)

Persyaratan Node.js 20.9+ (disarankan Node.js 22).

```bash
npm install
cp .env.example .env.local
# Edit .env.local: isi 5 variabel rahasia & alamat Supabase
npm run dev
```

Akses <http://localhost:3000>, login dengan `ADMIN_PIN` dan buat sesi.

## 4. Deploy ke Vercel

1. Upload folder ini sebagai repository GitHub baru (jangan upload file `.env.local`).
2. Masuk ke [vercel.com/new](https://vercel.com/new), pilih repository, framework **Next.js**.
3. Pada **Project → Settings → Environment Variables**, tambahkan:

   | Variable | Nilai |
   |---|---|
   | `ADMIN_PIN` | PIN untuk semua presenter (min. 8 karakter) |
   | `COOKIE_SECRET` | Nilai random kuat min. 32 karakter |
   | `SUPABASE_URL` | `https://PROJECT.supabase.co` |
   | `SUPABASE_SECRET_KEY` | `sb_secret_...` |
   | `GEMINI_API_KEY` | API key Gemini |
   | `GEMINI_MODEL` | `gemini-3.5-flash-lite` (opsional) |

4. Klik **Deploy**. Jika variabel environment diubah, lakukan **Redeploy**.
5. Buka URL `.vercel.app`, masuk sebagai presenter → buat room → buat pertanyaan.
6. Bagikan link `/join/ABC123` kepada audiens; buka `/screen/ABC123` di monitor proyektor.

**Penting:** Awalan `NEXT_PUBLIC_` tidak boleh digunakan untuk variabel rahasia ini. Vercel tidak menyimpan jawaban ke file lokal; semua disimpan di Supabase.

## 5. Alur presentasi contoh

1. Presenter membuat sesi "Townhall".
2. Tambah **Word Cloud**: "Satu kata untuk menggambarkan transformasi data?"
3. Presenter membagikan kode room di layar proyektor. Jawaban mulai masuk.
4. Klik **Tampilkan hasil** → awan kata tampil untuk audiens dan proyektor.
5. Tambah **Insight**: "Apa inti dari slide ini?" lalu aktifkan pertanyaannya.
6. Saat jawaban masuk, klik **Analisis jawaban** → **Tampilkan hasil**.
7. Tambahkan Poll/Quiz/Open Wall/Ranking/Scale untuk ronde berikutnya.
8. Di tab **Hasil Langsung**, ekspor CSV jika perlu.

## Keamanan & batasan starter

- Presenter dilindungi `ADMIN_PIN` (pin global) dan cookie HttpOnly bertanda HMAC yang diperiksa **di server**. Cocok untuk tim internal atau pilot. Untuk banyak organisasi/guru, gunakan login per pengguna (misal Supabase Auth) dan kontrol kepemilikan room.
- Key Supabase secret bypass RLS sehingga **semua permintaan database wajib lewat API backend** dengan validasi otorisasi; jangan mengekspos key tersebut.
- Validasi jawaban terjadi di backend; database menegakkan UNIQUE (`question_id`, `visitor_id`). Peserta dapat mengganti browser/ID dan menjawab ulang; untuk event besar pertimbangkan rate limiting, CAPTCHA dan identitas peserta yang terautentikasi.
- Event sudah menggunakan polling 4 detik, **bukan** WebSocket. Skala besar perlu Supabase Realtime/optimasi agregasi server.
- Setiap analisis Gemini memproses maksimal **300 jawaban**, sedangkan halaman mengambil maksimal **1.000** jawaban untuk hasil. Untuk event skala lebih besar tambahkan pagination dan job queue.
- Kategori AI bisa keliru, mohon tinjau sebelum menampilkan hasil. Respons peserta dikirim ke Gemini saat analisis; jangan memasukkan data pribadi yang sensitif.
- Quiz Battle sudah memiliki skor, bonus waktu, dan leaderboard. Identitas berbasis browser tidak mencegah multi-identitas, jadi belum cocok untuk perlombaan berhadiah besar.
- Belum ada pembatasan rate login PIN ataupun endpoint peserta untuk penggunaan publik berskala besar. Tambahkan rate limit (Upstash/Cloudflare) sebelum traffic besar.
- Data nyata/konfigurasi belum diuji end-to-end di Supabase, Gemini, atau Vercel tanpa kredensial yang sah. File disediakan sebagai starter proyek yang dapat dikembangkan.

## Struktur

```text
app/
  page.jsx                     # Landing / buat room / join
  presenter/[code]/page.jsx   # Dashboard presenter
  join/[code]/page.jsx        # Form audiens
  screen/[code]/page.jsx      # Layar proyektor
  api/action/route.js         # POST actions; autentikasi presenter
  api/state/route.js          # GET state, aman untuk publik
components/Results.jsx        # Visualisasi hasil 7 format
lib/server.js                 # Validasi, session, Supabase REST
lib/gemini.js                 # Gemini batch categorization
lib/results.js                # Statistik hasil polling lainnya
supabase/schema.sql           # SQL database
```

## Pengembangan yang disarankan

- Pengembangan Quiz Battle berikutnya: autentikasi peserta, anti-cheat, dan efek transisi peringkat.
- Q&A dengan likes, moderation dan peringkat pertanyaan.
- Preset template pertanyaan, menyimpan draft, urutan drag-drop.
- Grafik export PNG/PDF, laporan AI multi-pertanyaan.
- Auth presenter per-akun dan team workspace.
