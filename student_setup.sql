-- SCRIPT SETUP TABEL MAHASISWA (STUDENTS) --
-- Jalankan script ini di SQL Editor Supabase kamu --

-- 1. Buat Tabel Students
CREATE TABLE IF NOT EXISTS public.students (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    nim TEXT NOT NULL UNIQUE,
    class TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Aktifkan RLS (Row Level Security)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Izinkan publik (anon) untuk membaca data (untuk fitur search/autocomplete)
CREATE POLICY "Allow public read students" 
ON public.students FOR SELECT 
USING (true);

-- 4. Aktifkan Pencarian Cepat (Optional but Recommended)
-- Jalankan perintah ini jika kamu ingin fitur pencarian nama sangat cepat
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX IF NOT EXISTS idx_students_name_trgm ON public.students USING gin (name gin_trgm_ops);

-- CARA IMPORT DATA DARI CSV:
-- 1. Buka Dashboard Supabase > Table Editor.
-- 2. Pilih tabel 'students'.
-- 3. Klik "Insert" > "Import data from CSV".
-- 4. Pilih file 'mahasiswa-2023.csv'.
-- 5. Pastikan kolom Nama -> name, Nim -> nim, Kelas -> class sudah terpetakan dengan benar.
