import type { Question } from '../types';

export const linearAlgebraQuestions: Question[] = [
    // 1-10: OBE, Eliminasi Gauss, Gauss-Jordan, Cramer
    {
        id: 1,
        text: "Manakah operasi berikut yang BUKAN termasuk Operasi Baris Elementer (OBE)?",
        type: 'multiple-choice',
        options: [
            "Menukarkan dua baris",
            "Mengalikan baris dengan konstanta tak nol",
            "Menambahkan kelipatan satu baris ke baris lain",
            "Menguadratkan semua elemen dalam satu baris"
        ],
        correctIndex: 3
    },
    {
        id: 2,
        text: "Dalam Eliminasi Gauss, tujuan utamanya adalah mengubah matriks menjadi bentuk...",
        type: 'multiple-choice',
        options: [
            "Matriks Identitas",
            "Matriks Segitiga Atas (Eselon Baris)",
            "Matriks Diagonal",
            "Matriks Nol"
        ],
        correctIndex: 1
    },
    {
        id: 3,
        text: "Apa perbedaan mendasar antara metode eliminasi Gauss dengan Gauss-Jordan?",
        type: 'multiple-choice',
        options: [
            "Gauss menghasilkan matriks eselon baris, Gauss-Jordan menghasilkan eselon baris tereduksi",
            "Gauss lebih lambat dari Gauss-Jordan",
            "Gauss hanya untuk matriks 2x2, Gauss-Jordan untuk 3x3 ke atas",
            "Tidak ada perbedaan signifikan"
        ],
        correctIndex: 0
    },
    {
        id: 4,
        text: "Syarat utama agar Aturan Cramer dapat digunakan untuk menyelesaikan SPL adalah...",
        type: 'multiple-choice',
        options: [
            "Matriks koefisien harus persegi dan determinannya tidak sama dengan nol",
            "Matriks harus berbentuk segitiga",
            "Jumlah variabel lebih banyak dari jumlah persamaan",
            "Elemen diagonal utama harus bernilai 1"
        ],
        correctIndex: 0
    },
    {
        id: 5,
        text: "Jika determinan matriks koefisien adalah 0, maka SPL tersebut...",
        type: 'multiple-choice',
        options: [
            "Memiliki solusi tunggal",
            "Tidak memiliki solusi tunggal (bisa tidak ada solusi atau banyak solusi)",
            "Pasti memiliki banyak solusi",
            "Dapat diselesaikan dengan Cramer"
        ],
        correctIndex: 1
    },
    {
        id: 6,
        text: "Diketahui SPL: 2x + y = 5, x - y = 1. Berapakah nilai determinan utama (D)?",
        type: 'multiple-choice',
        options: [
            "3",
            "-3",
            "1",
            "-1"
        ],
        correctIndex: 1 // |2 1; 1 -1| = -2 - 1 = -3
    },
    {
        id: 7,
        text: "Dalam bentuk Eselon Baris Tereduksi, elemen pertama tak nol pada setiap baris harus bernilai...",
        type: 'multiple-choice',
        options: [
            "0",
            "1 (Satu Utama)",
            "Sembarang bilangan bulat",
            "Bilangan negatif"
        ],
        correctIndex: 1
    },
    {
        id: 8,
        text: "Operasi R2 = R2 - 3R1 berarti...",
        type: 'multiple-choice',
        options: [
            "Baris 2 dikurangi 3 kali Baris 1",
            "Baris 1 dikurangi 3 kali Baris 2",
            "Baris 2 dikalikan -3",
            "Baris 2 diganti dengan Baris 1"
        ],
        correctIndex: 0
    },
    {
        id: 9,
        text: "Matriks yang memiliki invers adalah matriks yang...",
        type: 'multiple-choice',
        options: [
            "Singular (Determinan = 0)",
            "Non-Singular (Determinan ≠ 0)",
            "Matriks Nol",
            "Matriks Baris"
        ],
        correctIndex: 1
    },
    {
        id: 10,
        text: "Studi Kasus Cloud Computing: Klien A (2 CPU, 1 RAM, 1 Storage) bayar 110k. Klien B (1 CPU, 3 RAM, 2 Storage) bayar 140k. Klien C (3 CPU, 2 RAM, 1 Storage) bayar 160k. Tentukan biaya per unit (CPU, RAM, Storage).",
        type: 'multiple-choice',
        options: [
            "CPU=65k, RAM=17.5k, Storage=27.5k",
            "CPU=60k, RAM=20k, Storage=30k",
            "CPU=50k, RAM=30k, Storage=30k",
            "CPU=70k, RAM=15k, Storage=25k"
        ],
        correctIndex: 0 // Solved: x=65, y=17.5, z=27.5
    },
    // 11-20: Vektor & Euclidean
    {
        id: 11,
        text: "Panjang vektor v = (3, 4) dalam ruang Euclidean adalah...",
        type: 'multiple-choice',
        options: [
            "5",
            "7",
            "√25",
            "12"
        ],
        correctIndex: 0
    },
    {
        id: 12,
        text: "Jika u = (1, 2) dan v = (3, -1), maka u • v (dot product) adalah...",
        type: 'multiple-choice',
        options: [
            "1",
            "5",
            "0",
            "-1"
        ],
        correctIndex: 0 // 3 - 2 = 1
    },
    {
        id: 13,
        text: "Dua vektor dikatakan ortogonal (tegak lurus) jika hasil kali titiknya (dot product) adalah...",
        type: 'multiple-choice',
        options: [
            "0",
            "1",
            "-1",
            "∞"
        ],
        correctIndex: 0
    },
    {
        id: 14,
        text: "Jarak Euclidean antara titik A(1, 1) dan B(4, 5) adalah...",
        type: 'multiple-choice',
        options: [
            "3",
            "4",
            "5",
            "6"
        ],
        correctIndex: 2 // sqrt(3^2 + 4^2) = 5
    },
    {
        id: 15,
        text: "Vektor satuan dari v = (3, 0) adalah...",
        type: 'multiple-choice',
        options: [
            "(1, 0)",
            "(0, 1)",
            "(3, 1)",
            "(1, 3)"
        ],
        correctIndex: 0
    },
    {
        id: 16,
        text: "Proyeksi ortogonal vektor u pada v dirumuskan sebagai...",
        type: 'multiple-choice',
        options: [
            "((u • v) / |v|²) v",
            "((u • v) / |u|²) u",
            "(u • v) v",
            "|u| |v| cos(θ)"
        ],
        correctIndex: 0
    },
    {
        id: 17,
        text: "Norm (panjang) dari vektor v = (-1, -1, -1) adalah...",
        type: 'multiple-choice',
        options: [
            "√3",
            "3",
            "1",
            "-√3"
        ],
        correctIndex: 0
    },
    {
        id: 18,
        text: "Ketaksamaan Cauchy-Schwarz menyatakan bahwa |u • v| selalu...",
        type: 'multiple-choice',
        options: [
            "≤ |u||v|",
            "> |u||v|",
            "= Matriks identitas",
            "= 0"
        ],
        correctIndex: 0
    },
    {
        id: 19,
        text: "Sudut antara dua vektor u dan v dapat dicari menggunakan rumus...",
        type: 'multiple-choice',
        options: [
            "cos(θ) = (u • v) / (|u||v|)",
            "sin(θ) = (u • v) / (|u||v|)",
            "tan(θ) = u / v",
            "cos(θ) = |u| + |v|"
        ],
        correctIndex: 0
    },
    {
        id: 20,
        text: "Jika vektor u = (k, 2) dan v = (2, -6) saling tegak lurus, maka nilai k adalah...",
        type: 'multiple-choice',
        options: [
            "6",
            "3",
            "-6",
            "0"
        ],
        correctIndex: 0 // 2k - 12 = 0 -> k=6
    },
    // 21-30: Markov Chain
    {
        id: 21,
        text: "Matriks transisi pada Rantai Markov haruslah merupakan...",
        type: 'multiple-choice',
        options: [
            "Matriks Stokastik",
            "Matriks Identitas",
            "Matriks Diagonal",
            "Matriks Simetris"
        ],
        correctIndex: 0
    },
    {
        id: 22,
        text: "Sifat utama matriks stokastik kolom adalah...",
        type: 'multiple-choice',
        options: [
            "Jumlah elemen dalam setiap kolom adalah 1",
            "Jumlah elemen dalam setiap baris adalah 1",
            "Determinannya selalu 1",
            "Semua elemennya bilangan bulat"
        ],
        correctIndex: 0
    },
    {
        id: 23,
        text: "Vektor keadaan (state vector) x(k) pada waktu k dalam Markov Chain dirumuskan sebagai... (P = Matriks Transisi)",
        type: 'multiple-choice',
        options: [
            "x(k) = P x(k-1)",
            "x(k) = x(k-1) P",
            "x(k) = Pᵏ x(0)",
            "A dan C benar"
        ],
        correctIndex: 3
    },
    {
        id: 24,
        text: "Jika state awal x(0) = [1, 0]ᵀ dan P = [[0.5, 0.5], [0.5, 0.5]], maka x(1) adalah...",
        type: 'multiple-choice',
        options: [
            "[0.5, 0.5]ᵀ",
            "[1, 0]ᵀ",
            "[0, 1]ᵀ",
            "[0.25, 0.75]ᵀ"
        ],
        correctIndex: 0
    },
    {
        id: 25,
        text: "Kondisi Steady State (Keseimbangan) tercapai jika vector x memenuhi...",
        type: 'multiple-choice',
        options: [
            "Px = x",
            "Px = 0",
            "Px = -x",
            "Px = 2x"
        ],
        correctIndex: 0
    },
    {
        id: 26,
        text: "Sebuah vektor x disebut sebagai vektor eigen dari matriks A jika memenuhi persamaan Ax = λx. Apa arti dari λ dalam persamaan tersebut?",
        type: 'multiple-choice',
        options: [
            "Nilai Eigen (Eigenvalue), konstanta skala vektor",
            "Vektor Eigen",
            "Matriks Identitas",
            "Determinan Matriks"
        ],
        correctIndex: 0
    },
    {
        id: 27,
        text: "Markov Chain disebut 'Regular' jika...",
        type: 'multiple-choice',
        options: [
            "Salah satu pangkat matriks transisinya memiliki semua entri positif",
            "Matriks transisinya memiliki entri nol",
            "Tidak memiliki steady state",
            "Hanya memiliki 1 state"
        ],
        correctIndex: 0
    },
    {
        id: 28,
        text: "Probabilitas transisi Pᵢⱼ merepresentasikan peluang berpindah dari...",
        type: 'multiple-choice',
        options: [
            "State j ke State i",
            "State i ke State j",
            "State i ke i",
            "Sembarang state"
        ],
        correctIndex: 0 // Convention Px where P_ij is j to i logic. Often depends on row vs col vector. Usually P_ij is j->i in col logic.
    },
    {
        id: 29,
        text: "Studi Kasus Bison Migrasi: Wilayah A (Tetap 60%, ke B 40%, ke C 30% -> Total 130%). Wilayah B (Total 80%). Wilayah C (Total 120%). Jika dilakukan normalisasi data terlebih dahulu, berapa peluang bison berada di Wilayah C setelah 4 bulan jika awalnya di Wilayah C?",
        type: 'multiple-choice',
        options: [
            "30.54%",
            "25.00%",
            "40.12%",
            "Data Tidak Valid"
        ],
        correctIndex: 0 // Calculated ~0.30538
    },
    {
        id: 30,
        text: "Studi Kasus Shift Karyawan: Shift Pagi (Total 120%), Shift Sore (Total 90%), Shift Malam (Total 120%). Setelah normalisasi, berapa peluang karyawan yang pada hari ke-0 berada di Shift Pagi berpindah ke Shift Sore dalam waktu 4 hari?",
        type: 'multiple-choice',
        options: [
            "34.56%",
            "50.00%",
            "28.14%",
            "Tidak bisa dihitung"
        ],
        correctIndex: 0 // Calculated ~0.34559
    }
];

export const calculusQuestions: Question[] = [
    // 1-10: Limits (Limit)
    {
        id: 101,
        text: "Nilai dari limit x → 2 untuk fungsi f(x) = 2x + 1 adalah...",
        type: 'multiple-choice',
        options: ["3", "4", "5", "6"],
        correctIndex: 2
    },
    {
        id: 102,
        text: "Tentukan limit x → 3 dari (x² - 9) / (x - 3).",
        type: 'multiple-choice',
        options: ["0", "3", "6", "Tak terdefinisi"],
        correctIndex: 2 // (x-3)(x+3)/(x-3) = 6
    },
    {
        id: 103,
        text: "Limit x → 0 dari sin(x)/x adalah...",
        type: 'multiple-choice',
        options: ["0", "1", "∞", "Tak terdefinisi"],
        correctIndex: 1
    },
    {
        id: 104,
        text: "Jika lim x → a f(x) = L dan lim x → a g(x) = M, maka lim x → a [f(x) + g(x)] adalah...",
        type: 'multiple-choice',
        options: ["L - M", "L · M", "L + M", "L / M"],
        correctIndex: 2
    },
    {
        id: 105,
        text: "Limit x → ∞ untuk 1/x adalah...",
        type: 'multiple-choice',
        options: ["∞", "1", "0", "-∞"],
        correctIndex: 2
    },
    {
        id: 106,
        text: "Nilai limit x → 1 dari (x² + 2x - 3) / (x - 1) adalah...",
        type: 'multiple-choice',
        options: ["2", "3", "4", "5"],
        correctIndex: 2 // (x+3)(x-1)/(x-1) -> 1+3=4
    },
    {
        id: 107,
        text: "Limit kiri dan limit kanan harus ... agar limit fungsi ada.",
        type: 'multiple-choice',
        options: ["Berbeda", "Sama", "Nol", "Tak hingga"],
        correctIndex: 1
    },
    {
        id: 108,
        text: "Limit x → 0 dari (1 - cos x) / x adalah...",
        type: 'multiple-choice',
        options: ["0", "1", "-1", "∞"],
        correctIndex: 0
    },
    {
        id: 109,
        text: "Fungsi f(x) dikatakan kontinu di titik c jika...",
        type: 'multiple-choice',
        options: ["f(c) terdefinisi", "Limit x → c f(x) ada", "Limit x → c f(x) = f(c)", "Semua benar"],
        correctIndex: 3
    },
    {
        id: 110,
        text: "Limit x → ∞ dari (2x² + 3) / (x² - 1) adalah...",
        type: 'multiple-choice',
        options: ["1", "2", "0", "∞"],
        correctIndex: 1
    },

    // 11-20: Derivatives (Turunan)
    {
        id: 111,
        text: "Turunan pertama dari f(x) = 3x² adalah...",
        type: 'multiple-choice',
        options: ["3x", "6x", "x²", "6"],
        correctIndex: 1
    },
    {
        id: 112,
        text: "Jika f(x) = sin(x), maka f'(x) adalah...",
        type: 'multiple-choice',
        options: ["cos(x)", "-cos(x)", "sin(x)", "-sin(x)"],
        correctIndex: 0
    },
    {
        id: 113,
        text: "Turunan dari konstanta k adalah...",
        type: 'multiple-choice',
        options: ["k", "1", "0", "x"],
        correctIndex: 2
    },
    {
        id: 114,
        text: "Aturan rantai (Chain Rule) digunakan untuk mencari turunan dari...",
        type: 'multiple-choice',
        options: ["Fungsi penjumlahan", "Fungsi perkalian", "Fungsi komposisi", "Fungsi pembagian"],
        correctIndex: 2
    },
    {
        id: 115,
        text: "Jika f(x) = eˣ, maka f'(x) adalah...",
        type: 'multiple-choice',
        options: ["x eˣ⁻¹", "eˣ", "e", "ln(x)"],
        correctIndex: 1
    },
    {
        id: 116,
        text: "Turunan dari f(x) = ln(x) adalah...",
        type: 'multiple-choice',
        options: ["1/x", "eˣ", "x", "1"],
        correctIndex: 0
    },
    {
        id: 117,
        text: "Jika f(x) = xⁿ. Turunannya adalah...",
        type: 'multiple-choice',
        options: ["n xⁿ⁺¹", "n xⁿ⁻¹", "xⁿ", "n x"],
        correctIndex: 1
    },
    {
        id: 118,
        text: "Turunan kedua dari f(x) = x³ adalah...",
        type: 'multiple-choice',
        options: ["3x²", "6x", "6", "0"],
        correctIndex: 1
    },
    {
        id: 119,
        text: "Gradien garis singgung kurva y = x² di titik x=1 adalah...",
        type: 'multiple-choice',
        options: ["1", "2", "3", "4"],
        correctIndex: 1 // y'=2x -> 2(1)=2
    },
    {
        id: 120,
        text: "Titik stasioner dicapai ketika turunan pertama bernilai...",
        type: 'multiple-choice',
        options: ["1", "0", "Positif", "Negatif"],
        correctIndex: 1
    },

    // 21-30: Integrals (Integral)
    {
        id: 121,
        text: "Integral tak tentu dari ∫ 2x dx adalah...",
        type: 'multiple-choice',
        options: ["x² + C", "2x² + C", "x + C", "2 + C"],
        correctIndex: 0
    },
    {
        id: 122,
        text: "Integral tentu dari 0 sampai 2 untuk ∫ 3x² dx adalah...",
        type: 'multiple-choice',
        options: ["4", "6", "8", "9"],
        correctIndex: 2 // [x^3]0->2 = 8
    },
    {
        id: 123,
        text: "Integral dari ∫ cos(x) dx adalah...",
        type: 'multiple-choice',
        options: ["sin(x) + C", "-sin(x) + C", "cos(x) + C", "-cos(x) + C"],
        correctIndex: 0
    },
    {
        id: 124,
        text: "Luas daerah di bawah kurva y=x dari x=0 sampai x=4 adalah...",
        type: 'multiple-choice',
        options: ["4", "8", "16", "2"],
        correctIndex: 1 // 1/2 * 4 * 4 = 8
    },
    {
        id: 125,
        text: "Rumus Integral Parsial adalah...",
        type: 'multiple-choice',
        options: ["∫ u dv = uv - ∫ v du", "∫ u dv = uv + ∫ v du", "∫ u dv = u - v", "∫ u dv = uv"],
        correctIndex: 0
    },
    {
        id: 126,
        text: "Integral dari ∫ 1/x dx adalah...",
        type: 'multiple-choice',
        options: ["ln|x| + C", "-1/x² + C", "eˣ + C", "x + C"],
        correctIndex: 0
    },
    {
        id: 127,
        text: "Jika F(x) adalah antiturunan dari f(x), maka ∫ f(x) dx = ...",
        type: 'multiple-choice',
        options: ["F(x) + C", "f'(x) + C", "f(x)² + C", "F'(x)"],
        correctIndex: 0
    },
    {
        id: 128,
        text: "Teorema Dasar Kalkulus menghubungkan...",
        type: 'multiple-choice',
        options: ["Limit dan Turunan", "Turunan dan Integral", "Limit dan Integral", "Fungsi dan Relasi"],
        correctIndex: 1
    },
    {
        id: 129,
        text: "Volume benda putar dapat dihitung menggunakan...",
        type: 'multiple-choice',
        options: ["Integral", "Turunan", "Limit", "Matriks"],
        correctIndex: 0
    },
    {
        id: 130,
        text: "Integral dari ∫ eˣ dx adalah...",
        type: 'multiple-choice',
        options: ["eˣ + C", "x eˣ + C", "eˣ⁺¹ + C", "ln(x) + C"],
        correctIndex: 0
    }
];
