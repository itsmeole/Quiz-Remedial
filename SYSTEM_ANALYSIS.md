# Analisis Sistem & Dokumentasi UML (Bahasa Indonesia)

## 1. Gambaran Umum
Aplikasi **Quiz Remedial** adalah aplikasi web berbasis **React + Vite** dengan TypeScript. Front‑end berinteraksi dengan **Supabase** (PostgreSQL + Auth) melalui file utilitas `supabaseClient.ts`. 

- **Komponen utama**: `WelcomeScreen`, `AdminScreen`, `QuizScreen`, `ResultScreen`, dll.
- **Layanan (services)**: `quizService`, `subjectService`, `studentService`, `groqService` (AI). 
- **Tipe data** didefinisikan di `src/types.ts`.
- **Deploy**: Vercel (frontend) + Supabase (backend).

## 2. Diagram Komponen (Component Diagram)
```mermaid
classDiagram
    direction LR
    class App {
        +GameState state
        +render()
    }
    class WelcomeScreen {
        +onStart()
    }
    class QuizScreen {
        +fetchQuestions()
        +submitAnswers()
    }
    class ResultScreen {
        +displayResult()
    }
    class AdminScreen {
        +manageSubjects()
        +editQuestions()
    }
    class CameraMonitor {
        +streamVideo()
    }
    class supabaseClient {
        +supabase
    }
    App --> WelcomeScreen
    App --> QuizScreen
    App --> ResultScreen
    App --> AdminScreen
    QuizScreen --> supabaseClient : uses
    ResultScreen --> supabaseClient : uses
    AdminScreen --> supabaseClient : uses
    CameraMonitor --> supabaseClient : optional
```

## 3. Diagram Kelas / Tipe (Class Diagram) – berdasar `src/types.ts`
```mermaid
classDiagram
    class Question {
        +number id
        +string text
        +QuestionType type
        +string[] options
        +number? correctIndex
        +string? subject
        +string? correct_answer
    }
    class Subject {
        +number id
        +string code
        +string name
    }
    class UserData {
        +string name
        +string nim
        +string class
        +string subject
    }
    class QuizResult {
        +string id
        +string created_at
        +string name
        +string nim
        +string class
        +number score
        +bool passed
        +string subject
        +number correct_count
        +number total_questions
        +number? pg_score
        +number? essay_score
        +string? ai_suggestion
    }
    class PgAnswerDetail {
        +number question_id
        +string question_text
        +bool is_correct
    }
    class SubmitResult {
        +string id
        +number score
        +bool passed
        +number pg_score
        +number essay_score
        +number correct_count
        +number total_questions
        +PgAnswerDetail[] pg_answers_detail
    }
    Question "1" -- "*" QuizResult : contains
    QuizResult "1" -- "*" PgAnswerDetail : detail
    SubmitResult "1" -- "1" QuizResult : returns
``` 

## 4. Diagram Urutan (Sequence Diagram) – Alur Quiz
```mermaid
sequenceDiagram
    participant User as Pengguna
    participant UI as Antarmuka (React)
    participant Service as quizService
    participant Supabase as Supabase API
    
    User->>UI: Buka aplikasi (WelcomeScreen)
    UI->>User: Tampilkan pilihan Subject
    User->>UI: Pilih Subject & Mulai Quiz
    UI->>Service: getQuestions(subject)
    Service->>Supabase: SELECT id, text, type, options, subject FROM questions WHERE subject=subject
    Supabase-->>Service: data (tanpa correctIndex)
    Service-->>UI: List<Question>
    UI->>User: Tampilkan pertanyaan satu per satu
    User->>UI: Kirim jawaban (PG & Essay)
    UI->>Service: submitQuiz(userData, pgAnswers, essayAnswers, ...)
    Service->>Supabase: RPC submit_quiz(...)
    Supabase-->>Service: SubmitResult (score, passed, dll.)
    Service-->>UI: SubmitResult
    UI->>User: Tampilkan ResultScreen (nilai, AI suggestion)
```

## 5. Layanan (Services) dan Interaksi Supabase
| Service | Fungsi Utama | Metode Supabase yang Dipanggil |
|--------|--------------|--------------------------------|
| `quizService` | Ambil pertanyaan, submit jawaban, dapatkan hasil | `select`, `rpc('submit_quiz')`, `rpc('update_ai_suggestion')`, `select('quiz_results')` |
| `subjectService` | CRUD subject | `.from('subjects')` (select, insert, update, delete) |
| `studentService` | CRUD mahasiswa | `.from('students')` |
| `groqService` | AI generation (menggunakan Groq API, bukan Supabase) | - |

## 6. Alur Data (Data Flow) 
1. **Inisialisasi**: `supabaseClient.ts` membuat singleton `supabase` menggunakan env `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY`.
2. **Pengambilan Data**: Komponen (`QuizScreen`) memanggil `quizService.getQuestions()`, yang mengeksekusi query Supabase dan mengembalikan pertanyaan tanpa `correctIndex`.
3. **Pengiriman Jawaban**: Pada submit, `quizService.submitQuiz()` memanggil RPC `submit_quiz` yang menghitung skor PG & Essay di database dan mengembalikan `SubmitResult`.
4. **Penyimpanan AI Suggestion**: Setelah AI menghasilkan saran, `quizService.updateAiSuggestion()` memanggil RPC `update_ai_suggestion` untuk menyimpan ke tabel `quiz_results`.
5. **Pengambilan Hasil**: `ResultScreen` memanggil `quizService.getResultById(id)` untuk menampilkan detail hasil yang dapat dibagikan lewat URL.

## 7. Diagram Deployment (opsional)
```mermaid
flowchart TB
    subgraph Frontend[Vercel]
        direction LR
        A[React App] --> B[Static Assets]
    end
    subgraph Backend[Supabase]
        C[PostgreSQL]
        D[Auth]
        E[Functions/RPC]
    end
    A -->|API Calls| C
    A -->|Auth Requests| D
    A -->|RPC Calls| E
```

---
**Catatan**: Diagram di atas menggunakan **Mermaid** sehingga dapat dirender secara langsung di platform yang mendukung markdown. Jika Anda memerlukan gambar PNG, beri tahu saya untuk mengekspor diagram.

---

## 8. Diagram Flowmap (High‑level Process Flow)

```mermaid
flowchart TD
    A([Mulai]) --> B[WelcomeScreen]
    B --> C{Login Sebagai?}
    C -->|Mahasiswa| D[Pilih Mata Kuliah]
    C -->|Admin| E[AdminScreen]
    D --> F[QuizScreen]
    F --> G{Selesai Menjawab?}
    G -->|Ya| H[Submit Jawaban]
    H --> I[Supabase: submit_quiz RPC]
    I --> J[Hitung Skor PG & Essay]
    J --> K[ResultScreen]
    K --> L["AI Suggestion (opsional)"]
    L --> M([Selesai])
    E --> N[Kelola Soal / Subject]
    N --> O[Simpan ke Supabase]
    O --> M
```

## 9. Diagram Use Case

```mermaid
graph LR
    Pengguna([Pengguna])
    Admin([Admin])

    UC1((Pilih Mata Kuliah))
    UC2((Mulai Quiz))
    UC3((Jawab Soal PG))
    UC4((Jawab Soal Essay))
    UC5((Submit Jawaban))
    UC6((Lihat Hasil))
    UC7((Bagikan Hasil via URL))

    UC8((Login Admin))
    UC9((Kelola Subject))
    UC10((Tambah / Edit Soal))
    UC11((Lihat Hasil Mahasiswa))
    UC12((Edit Nilai Manual))

    Pengguna --> UC1
    Pengguna --> UC2
    Pengguna --> UC3
    Pengguna --> UC4
    Pengguna --> UC5
    Pengguna --> UC6
    Pengguna --> UC7

    Admin --> UC8
    Admin --> UC9
    Admin --> UC10
    Admin --> UC11
    Admin --> UC12
```

---
*Dokumen ini dibuat untuk menjadi acuan pengembangan selanjutnya, sehingga tim tidak perlu melakukan pemindaian ulang kode sumber.*
