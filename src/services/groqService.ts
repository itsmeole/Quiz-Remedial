import type { EssayScoreResult } from '../types';

// ── Ollama (Local AI) Config ──────────────────────────────────────────
const OLLAMA_URL = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = import.meta.env.VITE_OLLAMA_MODEL || 'qwen2.5:7b';

// ── Groq (Cloud Fallback) Config ──────────────────────────────────────
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

// ── Ollama Call ───────────────────────────────────────────────────────
async function callOllama(systemPrompt: string, userPrompt: string): Promise<string> {
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: OLLAMA_MODEL,
            stream: false,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            options: { temperature: 0.4 },
        }),
    });

    if (!response.ok) throw new Error(`Ollama error ${response.status}`);
    const data = await response.json();
    return data.message?.content as string;
}

// ── Groq Call ─────────────────────────────────────────────────────────
async function callGroq(systemPrompt: string, userPrompt: string, maxTokens = 1024): Promise<string> {
    if (!GROQ_API_KEY) throw new Error('VITE_GROQ_API_KEY is not set');

    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.4,
            max_tokens: maxTokens,
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Groq API error ${response.status}: ${err}`);
    }

    const data = await response.json();
    return data.choices[0].message.content as string;
}

// ── Unified Call: Ollama first, Groq as fallback ──────────────────────
async function callAI(systemPrompt: string, userPrompt: string, maxTokens = 1024): Promise<string> {
    try {
        console.log(`🤖 Trying Ollama (${OLLAMA_MODEL})...`);
        const result = await callOllama(systemPrompt, userPrompt);
        console.log('✅ Ollama responded');
        return result;
    } catch (ollamaErr) {
        console.warn('⚠️ Ollama unavailable, falling back to Groq:', ollamaErr);
        if (!GROQ_API_KEY) throw new Error('Ollama tidak tersedia dan VITE_GROQ_API_KEY tidak di-set.');
        const result = await callGroq(systemPrompt, userPrompt, maxTokens);
        console.log('✅ Groq fallback responded');
        return result;
    }
}

function cleanJson(raw: string): string {
    return raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
}

export const groqService = {
    /**
     * Score each essay answer using AI (Ollama local or Groq fallback).
     * Returns structured result: score, feedback, strengths, weaknesses, study_suggestions.
     */
    async scoreEssayAnswers(
        questions: Array<{ id: number; text: string }>,
        answers: Record<number, string>,
        correctAnswers: Record<number, string> = {}
    ): Promise<EssayScoreResult[]> {
        if (questions.length === 0) return [];

        const results: EssayScoreResult[] = [];

        for (const q of questions) {
            const studentAnswer = answers[q.id]?.trim() || '(tidak dijawab)';
            const ref = correctAnswers[q.id];
            const hasCorrectAnswer = !!ref;

            const systemPrompt = hasCorrectAnswer
                ? 'Kamu adalah dosen yang menilai jawaban essay mahasiswa secara KETAT berdasarkan Jawaban Kunci yang diberikan. ' +
                  'ATURAN WAJIB: ' +
                  '(1) Nilai HANYA berdasarkan kesesuaian dengan Jawaban Kunci — JANGAN tambahkan kriteria, pengetahuan, atau standar lain di luar Jawaban Kunci. ' +
                  '(2) Jika jawaban mahasiswa mencakup semua poin dalam Jawaban Kunci, berikan nilai 95-100. ' +
                  '(3) Kekurangan HANYA boleh disebut jika poin tersebut ada dalam Jawaban Kunci namun tidak disebutkan oleh mahasiswa. ' +
                  '(4) DILARANG mengurangi nilai karena mahasiswa tidak menyebut hal yang tidak ada di Jawaban Kunci. ' +
                  'Balas HANYA dengan JSON, tanpa markdown, tanpa teks tambahan.'
                : 'Kamu adalah dosen yang menilai jawaban essay mahasiswa secara adil dan objektif berdasarkan konten dan relevansi jawaban. ' +
                  'Balas HANYA dengan JSON, tanpa markdown, tanpa teks tambahan.';

            const userPrompt =
                `Soal: ${q.text}\n` +
                `Jawaban Mahasiswa: ${studentAnswer}\n` +
                (hasCorrectAnswer
                    ? `Jawaban Kunci (acuan SATU-SATUNYA untuk penilaian): ${ref}\n\n` +
                      `Instruksi penilaian:\n` +
                      `- Bandingkan Jawaban Mahasiswa dengan Jawaban Kunci secara langsung.\n` +
                      `- Jika jawaban mahasiswa mencakup inti/makna yang sama dengan kunci, nilai harus tinggi (90-100).\n` +
                      `- Kekurangan HANYA dicatat jika poin kunci tidak disebutkan mahasiswa.\n` +
                      `- JANGAN kurangi nilai karena mahasiswa tidak menyebut hal di luar kunci jawaban.\n`
                    : '') +
                `\nBerikan evaluasi dalam format JSON berikut:\n` +
                `{\n` +
                `  "score": <angka 0-100>,\n` +
                `  "feedback": "<komentar 2-3 kalimat tentang kesesuaian jawaban dengan kunci>",\n` +
                `  "strengths": "<poin dari kunci yang sudah terpenuhi dalam jawaban mahasiswa>",\n` +
                `  "weaknesses": "<poin dari kunci yang TIDAK disebutkan mahasiswa, atau '-' jika semua terpenuhi>",\n` +
                `  "study_suggestions": ["<saran spesifik 1>", "<saran spesifik 2>", "<saran spesifik 3>"]\n` +
                `}`;

            try {
                const raw = await callAI(systemPrompt, userPrompt, 600);
                const parsed = JSON.parse(cleanJson(raw));
                results.push({
                    questionId: q.id,
                    score: Number(parsed.score) || 0,
                    feedback: parsed.feedback || '',
                    strengths: parsed.strengths || '-',
                    weaknesses: parsed.weaknesses || '-',
                    study_suggestions: Array.isArray(parsed.study_suggestions) ? parsed.study_suggestions : [],
                });
            } catch (e) {
                console.error(`Gagal nilai essay soal ${q.id}:`, e);
                results.push({
                    questionId: q.id,
                    score: 0,
                    feedback: 'Gagal menilai jawaban.',
                    strengths: '-',
                    weaknesses: '-',
                    study_suggestions: [],
                });
            }
        }

        return results;
    },

    /**
     * Generate overall study suggestions based on PG wrongs + essay suggestions.
     */
    async generateSuggestion(
        pgScore: number,
        essayScore: number,
        finalScore: number,
        subject: string,
        passed: boolean,
        pgAnswersDetail: Array<{ question_id: number; question_text: string; is_correct: boolean }> = [],
        essayStudySuggestions: string[] = []
    ): Promise<string[]> {
        const subjectName = subject === 'linear-algebra' ? 'Aljabar Linear' : subject;

        const systemPrompt =
            'Kamu adalah asisten akademik yang memberi saran belajar personal dan praktis kepada mahasiswa. ' +
            'Balas HANYA dengan JSON, tanpa markdown, tanpa teks tambahan.';

        const hasEssay = essayScore > 0;
        const essayLine = hasEssay ? `- Nilai Essay: ${essayScore.toFixed(1)}/100\n` : '';

        const wrongQuestions = pgAnswersDetail.filter(q => !q.is_correct);
        const wrongBlock = wrongQuestions.length > 0
            ? `\nSoal PG yang salah (${wrongQuestions.length}):\n` +
              wrongQuestions.map((q, idx) => `${idx + 1}. ${q.question_text}`).join('\n')
            : '';

        const essayHintsBlock = essayStudySuggestions.length > 0
            ? `\nSaran dari penilaian essay:\n` +
              essayStudySuggestions.map(s => `- ${s}`).join('\n')
            : '';

        const userPrompt =
            `Mahasiswa menyelesaikan remedial ${subjectName}:\n` +
            `- Nilai PG: ${pgScore.toFixed(1)}/100\n` +
            essayLine +
            `- Nilai Akhir: ${finalScore.toFixed(1)}/100\n` +
            `- Status: ${passed ? 'LULUS' : 'BELUM LULUS'}\n` +
            wrongBlock +
            essayHintsBlock +
            `\n\nBuat 4-6 saran belajar yang spesifik, actionable, dan personal dalam bahasa Indonesia. ` +
            `Gabungkan analisis soal PG yang salah${essayStudySuggestions.length > 0 ? ' dan saran dari essay' : ''} di atas. ` +
            `Kembalikan JSON:\n{"study_suggestions": ["<saran 1>", "<saran 2>", ...]}`;

        try {
            const raw = await callAI(systemPrompt, userPrompt, 700);
            const parsed = JSON.parse(cleanJson(raw));
            return Array.isArray(parsed.study_suggestions) ? parsed.study_suggestions : [];
        } catch (e) {
            console.error('Gagal generate suggestions:', e);
            return essayStudySuggestions.length > 0 ? essayStudySuggestions.slice(0, 5) : [];
        }
    },
};
