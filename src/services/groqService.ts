import type { EssayScoreResult } from '../types';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

async function callGroq(systemPrompt: string, userPrompt: string, maxTokens = 1024): Promise<string> {
    if (!GROQ_API_KEY) throw new Error('VITE_GROQ_API_KEY is not set');

    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: MODEL,
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

function cleanJson(raw: string): string {
    return raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
}

export const groqService = {
    /**
     * Score each essay answer using Groq AI.
     * Returns structured result: score, feedback, strengths, weaknesses, study_suggestions.
     * study_suggestions are used for the overall AI suggestion section.
     */
    async scoreEssayAnswers(
        questions: Array<{ id: number; text: string }>,
        answers: Record<number, string>,
        correctAnswers: Record<number, string> = {}
    ): Promise<EssayScoreResult[]> {
        if (questions.length === 0) return [];

        // Evaluate each essay question individually to keep JSON small and accurate
        const results: EssayScoreResult[] = [];

        for (const q of questions) {
            const studentAnswer = answers[q.id]?.trim() || '(tidak dijawab)';
            const ref = correctAnswers[q.id];
            const hasCorrectAnswer = !!ref;

            const systemPrompt =
                'Kamu adalah dosen yang menilai jawaban essay mahasiswa dengan adil dan objektif. ' +
                (hasCorrectAnswer ? 'Gunakan "Jawaban Kunci" sebagai acuan utama penilaian. ' : '') +
                'Balas HANYA dengan JSON, tanpa markdown, tanpa teks tambahan.';

            const userPrompt =
                `Soal: ${q.text}\n` +
                `Jawaban Mahasiswa: ${studentAnswer}\n` +
                (hasCorrectAnswer ? `Jawaban Kunci: ${ref}\n` : '') +
                `\nBerikan evaluasi dalam format JSON berikut:\n` +
                `{\n` +
                `  "score": <angka 0-100>,\n` +
                `  "feedback": "<komentar 2-3 kalimat tentang kualitas jawaban${hasCorrectAnswer ? ', sebutkan poin mana yang sudah sesuai kunci' : ''}>",\n` +
                `  "strengths": "<apa yang sudah benar dari jawaban mahasiswa, atau '-' jika kosong/tidak relevan>",\n` +
                `  "weaknesses": "<apa yang kurang atau tidak sesuai kunci jawaban>",\n` +
                `  "study_suggestions": ["<saran spesifik 1>", "<saran spesifik 2>", "<saran spesifik 3>"]\n` +
                `}`;

            try {
                const raw = await callGroq(systemPrompt, userPrompt, 600);
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
     * Generate overall study suggestions (string[]) based on:
     * - PG wrong questions (from pg_answers_detail)
     * - Essay study suggestions collected from per-question scoring
     * Returns an array of 4-6 actionable study suggestions.
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
        const subjectName = subject === 'linear-algebra' ? 'Aljabar Linear' : 'Kalkulus';

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
            const raw = await callGroq(systemPrompt, userPrompt, 700);
            const parsed = JSON.parse(cleanJson(raw));
            return Array.isArray(parsed.study_suggestions) ? parsed.study_suggestions : [];
        } catch (e) {
            console.error('Gagal generate suggestions:', e);
            return essayStudySuggestions.length > 0 ? essayStudySuggestions.slice(0, 5) : [];
        }
    },
};
