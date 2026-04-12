PANDUAN SETUP DATABASE UNTUK TEMAN (LOCAL/NEW SUPABASE)

Halo! Jika kamu ingin menjalankan project ini di komputer lokal atau di project Supabase baru, ikuti langkah-langkah berikut untuk memperbaiki error "Akses Diblokir":

---

### OPSI A: SETUP DI PROJECT SUPABASE BARU (PALING MUDAH)
1.  **Dashboard Supabase**:
    - Masuk ke Dashboard Supabase kamu.
    - Pergi ke menu "SQL Editor" di sidebar kiri.
    - Klik "New Query".
    - Copy semua isi file `supabase_dump.sql` dan Paste ke SQL Editor.
    - Klik "Run". (Ini akan membuat tabel, fungsi `submit_quiz`, dan mengisi data).
2.  **Update .env**:
    - Ganti `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` dengan info dari API Settings project barumu.

---

### OPSI B: SETUP DATABASE LOKAL (DENGAN SUPABASE CLI)
Gunakan opsi ini jika ingin benar-benar offline (memerlukan Docker installed):
1.  **Inisialisasi**:
    - Buka terminal di root project.
    - Jalankan: `supabase init`
    - Jalankan: `supabase start`
2.  **Migrasi Data**:
    - Setelah jalan, copy isi `supabase_dump.sql`.
    - Buka dashboard lokal (biasanya `http://localhost:54323`).
    - Masuk ke SQL Editor dan jalankan code yang di-copy tadi.
3.  **Update .env**:
    - Gunakan URL lokal (biasanya `http://127.0.0.1:54321`) dan anon key lokal yang muncul di terminal setelah `supabase start`.

---

### REKOMENDASI: MENGAPA "AKSES DIBLOKIR"?
Error itu terjadi karena dua hal yang sudah diperbaiki di dalam `supabase_dump.sql`:
- **RLS (Row Level Security)**: Sudah ditambahkan `CREATE POLICY` agar akses `anon` bisa membaca soal.
- **Missing RPC**: Fungsi `submit_quiz` sudah disertakan untuk proses penilaian di sisi database.

### CARA MENJALANKAN APLIKASI
1.  `npm install`
2.  `npm run dev`

Semangat ngembanginnya!
