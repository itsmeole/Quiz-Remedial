-- SEED DATA & SCHEMA EXPORT FOR QUIZ-APP
-- This file contains everything needed to setup a new Supabase project or local Postgres.

-- 1. Create EXTENSION for UUID (if needed)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create TABLES
CREATE TABLE IF NOT EXISTS public.questions (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'multiple-choice',
    options JSONB NOT NULL,
    subject TEXT NOT NULL,
    correct_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quiz_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    nim TEXT NOT NULL,
    class TEXT NOT NULL,
    subject TEXT NOT NULL,
    score FLOAT NOT NULL,
    passed BOOLEAN NOT NULL,
    correct_count INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    is_violation BOOLEAN DEFAULT FALSE,
    violation_reason TEXT
);

-- 3. ENABLE RLS
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES (Fixing "Akses Diblokir")
-- Allow anyone to read questions
CREATE POLICY "Allow public read questions" 
ON public.questions FOR SELECT 
USING (true);

-- Allow anyone to insert results (for submission)
CREATE POLICY "Allow public insert results" 
ON public.quiz_results FOR INSERT 
WITH CHECK (true);

-- Allow anyone to read results (for Admin Dashboard - simplified for dev)
CREATE POLICY "Allow public read results" 
ON public.quiz_results FOR SELECT 
USING (true);

-- 5. FUNCTION: submit_quiz (Server-side Grading)
CREATE OR REPLACE FUNCTION public.submit_quiz(
    p_name TEXT,
    p_nim TEXT,
    p_class TEXT,
    p_subject TEXT,
    p_answers JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_question RECORD;
    v_correct_count INTEGER := 0;
    v_total_questions INTEGER := 0;
    v_score FLOAT;
    v_passed BOOLEAN;
    v_result_id UUID;
BEGIN
    -- Count total questions for the subject
    SELECT COUNT(*) INTO v_total_questions FROM public.questions WHERE subject = p_subject;
    
    -- Grade answers
    FOR v_question IN (SELECT id, correct_index FROM public.questions WHERE subject = p_subject)
    LOOP
        -- p_answers is a JSON object like {"1": 0, "2": 3}
        -- We check if the answer for question_id matches correct_index
        IF (p_answers->>(v_question.id::TEXT))::INTEGER = v_question.correct_index THEN
            v_correct_count := v_correct_count + 1;
        END IF;
    END LOOP;
    
    -- Calculate percentage and pass status (threshold 75%)
    IF v_total_questions > 0 THEN
        v_score := (v_correct_count::FLOAT / v_total_questions::FLOAT) * 100;
    ELSE
        v_score := 0;
    END IF;
    
    v_passed := v_score >= 75;
    
    -- Insert into results table
    INSERT INTO public.quiz_results (name, nim, class, subject, score, passed, correct_count, total_questions)
    VALUES (p_name, p_nim, p_class, p_subject, v_score, v_passed, v_correct_count, v_total_questions)
    RETURNING id INTO v_result_id;
    
    -- Return confirmation to frontend
    RETURN jsonb_build_object(
        'id', v_result_id,
        'score', v_score,
        'passed', v_passed,
        'correct_count', v_correct_count,
        'total_questions', v_total_questions
    );
END;
$$;

-- 6. SEED DATA (Linear Algebra)
INSERT INTO public.questions (text, type, options, subject, correct_index) VALUES
('Manakah operasi berikut yang BUKAN termasuk Operasi Baris Elementer (OBE)?', 'multiple-choice', '["Menukarkan dua baris", "Mengalikan baris dengan konstanta tak nol", "Menambahkan kelipatan satu baris ke baris lain", "Menguadratkan semua elemen dalam satu baris"]', 'linear-algebra', 3),
('Dalam Eliminasi Gauss, tujuan utamanya adalah mengubah matriks menjadi bentuk...', 'multiple-choice', '["Matriks Identitas", "Matriks Segitiga Atas (Eselon Baris)", "Matriks Diagonal", "Matriks Nol"]', 'linear-algebra', 1),
('Apa perbedaan mendasar antara metode eliminasi Gauss dengan Gauss-Jordan?', 'multiple-choice', '["Gauss menghasilkan matriks eselon baris, Gauss-Jordan menghasilkan eselon baris tereduksi", "Gauss lebih lambat dari Gauss-Jordan", "Gauss hanya untuk matriks 2x2, Gauss-Jordan untuk 3x3 ke atas", "Tidak ada perbedaan signifikan"]', 'linear-algebra', 0),
('Syarat utama agar Aturan Cramer dapat digunakan untuk menyelesaikan SPL adalah...', 'multiple-choice', '["Matriks koefisien harus persegi dan determinannya tidak sama dengan nol", "Matriks harus berbentuk segitiga", "Jumlah variabel lebih banyak dari jumlah persamaan", "Elemen diagonal utama harus bernilai 1"]', 'linear-algebra', 0),
('Jika determinan matriks koefisien adalah 0, maka SPL tersebut...', 'multiple-choice', '["Memiliki solusi tunggal", "Tidak memiliki solusi tunggal (bisa tidak ada solusi atau banyak solusi)", "Pasti memiliki banyak solusi", "Dapat diselesaikan dengan Cramer"]', 'linear-algebra', 1),
('Diketahui SPL: 2x + y = 5, x - y = 1. Berapakah nilai determinan utama (D)?', 'multiple-choice', '["3", "-3", "1", "-1"]', 'linear-algebra', 1),
('Dalam bentuk Eselon Baris Tereduksi, elemen pertama tak nol pada setiap baris harus bernilai...', 'multiple-choice', '["0", "1 (Satu Utama)", "Sembarang bilangan bulat", "Bilangan negatif"]', 'linear-algebra', 1),
('Operasi R2 = R2 - 3R1 berarti...', 'multiple-choice', '["Baris 2 dikurangi 3 kali Baris 1", "Baris 1 dikurangi 3 kali Baris 2", "Baris 2 dikalikan -3", "Baris 2 diganti dengan Baris 1"]', 'linear-algebra', 0),
('Matriks yang memiliki invers adalah matriks yang...', 'multiple-choice', '["Singular (Determinan = 0)", "Non-Singular (Determinan ≠ 0)", "Matriks Nol", "Matriks Baris"]', 'linear-algebra', 1),
('Studi Kasus Cloud Computing: Klien A (2 CPU, 1 RAM, 1 Storage) bayar 110k. Klien B (1 CPU, 3 RAM, 2 Storage) bayar 140k. Klien C (3 CPU, 2 RAM, 1 Storage) bayar 160k. Tentukan biaya per unit (CPU, RAM, Storage).', 'multiple-choice', '["CPU=65k, RAM=17.5k, Storage=27.5k", "CPU=60k, RAM=20k, Storage=30k", "CPU=50k, RAM=30k, Storage=30k", "CPU=70k, RAM=15k, Storage=25k"]', 'linear-algebra', 0),
('Panjang vektor v = (3, 4) dalam ruang Euclidean adalah...', 'multiple-choice', '["5", "7", "√25", "12"]', 'linear-algebra', 0),
('Jika u = (1, 2) dan v = (3, -1), maka u • v (dot product) adalah...', 'multiple-choice', '["1", "5", "0", "-1"]', 'linear-algebra', 0),
('Dua vektor dikatakan ortogonal (tegak lurus) jika hasil kali titiknya (dot product) adalah...', 'multiple-choice', '["0", "1", "-1", "∞"]', 'linear-algebra', 0),
('Jarak Euclidean antara titik A(1, 1) dan B(4, 5) adalah...', 'multiple-choice', '["3", "4", "5", "6"]', 'linear-algebra', 2),
('Vektor satuan dari v = (3, 0) adalah...', 'multiple-choice', '["(1, 0)", "(0, 1)", "(3, 1)", "(1, 3)"]', 'linear-algebra', 0),
('Proyeksi ortogonal vektor u pada v dirumuskan sebagai...', 'multiple-choice', '["((u • v) / |v|²) v", "((u • v) / |u|²) u", "(u • v) v", "|u| |v| cos(θ)"]', 'linear-algebra', 0),
('Norm (panjang) dari vektor v = (-1, -1, -1) adalah...', 'multiple-choice', '["√3", "3", "1", "-1"]', 'linear-algebra', 0),
('Ketaksamaan Cauchy-Schwarz menyatakan bahwa |u • v| selalu...', 'multiple-choice', '["≤ |u||v|", "> |u||v|", "= Matriks identitas", "= 0"]', 'linear-algebra', 0),
('Sudut antara dua vektor u and v dapat dicari menggunakan rumus...', 'multiple-choice', '["cos(θ) = (u • v) / (|u||v|)", "sin(θ) = (u • v) / (|u||v|)", "tan(θ) = u / v", "cos(θ) = |u| + |v|"]', 'linear-algebra', 0),
('Jika vektor u = (k, 2) dan v = (2, -6) saling tegak lurus, maka nilai k adalah...', 'multiple-choice', '["6", "3", "-6", "0"]', 'linear-algebra', 0),
('Matriks transisi pada Rantai Markov haruslah merupakan...', 'multiple-choice', '["Matriks Stokastik", "Matriks Identitas", "Matriks Diagonal", "Matriks Simetris"]', 'linear-algebra', 0),
('Sifat utama matriks stokastik kolom adalah...', 'multiple-choice', '["Jumlah elemen dalam setiap kolom adalah 1", "Jumlah elemen dalam setiap baris adalah 1", "Determinannya selalu 1", "Semua elemennya bilangan bulat"]', 'linear-algebra', 0),
('Vektor keadaan (state vector) x(k) pada waktu k dalam Markov Chain dirumuskan sebagai... (P = Matriks Transisi)', 'multiple-choice', '["x(k) = P x(k-1)", "x(k) = x(k-1) P", "x(k) = Pᵏ x(0)", "A dan C benar"]', 'linear-algebra', 3),
('Jika state awal x(0) = [1, 0]ᵀ dan P = [[0.5, 0.5], [0.5, 0.5]], maka x(1) adalah...', 'multiple-choice', '["0.5, 0.5]ᵀ", "[1, 0]ᵀ", "[0, 1]ᵀ", "[0.25, 0.75]ᵀ"]', 'linear-algebra', 0),
('Kondisi Steady State (Keseimbangan) tercapai jika vector x memenuhi...', 'multiple-choice', '["Px = x", "Px = 0", "Px = -x", "Px = 2x"]', 'linear-algebra', 0),
('Sebuah vektor x disebut sebagai vektor eigen dari matriks A jika memenuhi persamaan Ax = λx. Apa arti dari λ dalam persamaan tersebut?', 'multiple-choice', '["Nilai Eigen (Eigenvalue), konstanta skala vektor", "Vektor Eigen", "Matriks Identitas", "Determinan Matriks"]', 'linear-algebra', 0),
('Markov Chain disebut ''Regular'' jika...', 'multiple-choice', '["Salah satu pangkat matriks transisinya memiliki semua entri positif", "Matriks transisinya memiliki entri nol", "Tidak memiliki steady state", "Hanya memiliki 1 state"]', 'linear-algebra', 0),
('Probabilitas transisi Pᵢⱼ merepresentasikan peluang berpindah dari...', 'multiple-choice', '["State j ke State i", "State i ke State j", "State i ke i", "Sembarang state"]', 'linear-algebra', 0),
('Studi Kasus Bison Migrasi: Wilayah A (Tetap 60%, ke B 40%, ke C 30% -> Total 130%). Wilayah B (Total 80%). Wilayah C (Total 120%). Jika dilakukan normalisasi data terlebih dahulu, berapa peluang bison berada di Wilayah C setelah 4 bulan jika awalnya di Wilayah C?', 'multiple-choice', '["30.54%", "25.00%", "40.12%", "Data Tidak Valid"]', 'linear-algebra', 0),
('Studi Kasus Shift Karyawan: Shift Pagi (Total 120%), Shift Sore (Total 90%), Shift Malam (Total 120%). Setelah normalisasi, berapa peluang karyawan yang pada hari ke-0 berada di Shift Pagi berpindah ke Shift Sore dalam waktu 4 hari?', 'multiple-choice', '["34.56%", "50.00%", "28.14%", "Tidak bisa dihitung"]', 'linear-algebra', 0);

-- 7. SEED DATA (Calculus)
INSERT INTO public.questions (text, type, options, subject, correct_index) VALUES
('Nilai dari limit x → 2 untuk fungsi f(x) = 2x + 1 adalah...', 'multiple-choice', '["3", "4", "5", "6"]', 'calculus', 2),
('Tentukan limit x → 3 dari (x² - 9) / (x - 3).', 'multiple-choice', '["0", "3", "6", "Tak terdefinisi"]', 'calculus', 2),
('Limit x → 0 dari sin(x)/x adalah...', 'multiple-choice', '["0", "1", "∞", "Tak terdefinisi"]', 'calculus', 1),
('Jika lim x → a f(x) = L dan lim x → a g(x) = M, maka lim x → a [f(x) + g(x)] adalah...', 'multiple-choice', '["L - M", "L · M", "L + M", "L / M"]', 'calculus', 2),
('Limit x → ∞ untuk 1/x adalah...', 'multiple-choice', '["∞", "1", "0", "-∞"]', 'calculus', 2),
('Nilai limit x → 1 dari (x² + 2x - 3) / (x - 1) adalah...', 'multiple-choice', '["2", "3", "4", "5"]', 'calculus', 2),
('Limit kiri dan limit kanan harus ... agar limit fungsi ada.', 'multiple-choice', '["Berbeda", "Sama", "Nol", "Tak hingga"]', 'calculus', 1),
('Limit x → 0 dari (1 - cos x) / x adalah...', 'multiple-choice', '["0", "1", "-1", "∞"]', 'calculus', 0),
('Fungsi f(x) dikatakan kontinu di titik c jika...', 'multiple-choice', '["f(c) terdefinisi", "Limit x → c f(x) ada", "Limit x → c f(x) = f(c)", "Semua benar"]', 'calculus', 3),
('Limit x → ∞ dari (2x² + 3) / (x² - 1) adalah...', 'multiple-choice', '["1", "2", "0", "∞"]', 'calculus', 1),
('Turunan pertama dari f(x) = 3x² adalah...', 'multiple-choice', '["3", "6x", "x²", "6"]', 'calculus', 1),
('Jika f(x) = sin(x), maka f''(x) adalah...', 'multiple-choice', '["cos(x)", "-cos(x)", "sin(x)", "-sin(x)"]', 'calculus', 0),
('Turunan dari konstanta k adalah...', 'multiple-choice', '["k", "1", "0", "x"]', 'calculus', 2),
('Aturan rantai (Chain Rule) digunakan untuk mencari turunan dari...', 'multiple-choice', '["Fungsi penjumlahan", "Fungsi perkalian", "Fungsi komposisi", "Fungsi pembagian"]', 'calculus', 2),
('Jika f(x) = eˣ, maka f''(x) adalah...', 'multiple-choice', '["x eˣ⁻¹", "eˣ", "e", "ln(x)"]', 'calculus', 1),
('Turunan dari f(x) = ln(x) adalah...', 'multiple-choice', '["1/x", "eˣ", "x", "1"]', 'calculus', 0),
('Jika f(x) = xⁿ. Turunannya adalah...', 'multiple-choice', '["n xⁿ⁺¹", "n xⁿ⁻¹", "xⁿ", "n x"]', 'calculus', 1),
('Turunan kedua dari f(x) = x³ adalah...', 'multiple-choice', '["3x²", "6x", "6", "0"]', 'calculus', 1),
('Gradien garis singgung kurva y = x² di titik x=1 adalah...', 'multiple-choice', '["1", "2", "3", "4"]', 'calculus', 1),
('Titik stasioner dicapai ketika turunan pertama bernilai...', 'multiple-choice', '["1", "0", "Positif", "Negatif"]', 'calculus', 1),
('Integral tak tentu dari ∫ 2x dx adalah...', 'multiple-choice', '["x² + C", "2x² + C", "x + C", "2 + C"]', 'calculus', 0),
('Integral tentu dari 0 sampai 2 untuk ∫ 3x² dx adalah...', 'multiple-choice', '["4", "6", "8", "9"]', 'calculus', 2),
('Integral dari ∫ cos(x) dx adalah...', 'multiple-choice', '["sin(x) + C", "-sin(x) + C", "cos(x) + C", "-cos(x) + C"]', 'calculus', 0),
('Luas daerah di bawah kurva y=x dari x=0 sampai x=4 adalah...', 'multiple-choice', '["4", "8", "16", "2"]', 'calculus', 1),
('Rumus Integral Parsial adalah...', 'multiple-choice', '["∫ u dv = uv - ∫ v du", "∫ u dv = uv + ∫ v du", "∫ u dv = u - v", "∫ u dv = uv"]', 'calculus', 0),
('Integral dari ∫ 1/x dx adalah...', 'multiple-choice', '["ln|x| + C", "-1/x² + C", "eˣ + C", "x + C"]', 'calculus', 0),
('Jika F(x) adalah antiturunan dari f(x), maka ∫ f(x) dx = ...', 'multiple-choice', '["F(x) + C", "f''(x) + C", "f(x)² + C", "F''(x)"]', 'calculus', 0),
('Teorema Dasar Kalkulus menghubungkan...', 'multiple-choice', '["Limit dan Turunan", "Turunan dan Integral", "Limit dan Integral", "Fungsi dan Relasi"]', 'calculus', 1),
('Volume benda putar dapat dihitung menggunakan...', 'multiple-choice', '["Integral", "Turunan", "Limit", "Matriks"]', 'calculus', 0),
('Integral dari ∫ eˣ dx adalah...', 'multiple-choice', '["eˣ + C", "x eˣ + C", "eˣ⁺¹ + C", "ln(x) + C"]', 'calculus', 0);
