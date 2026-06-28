import { supabase } from '../utils/supabaseClient';
import type { Question, UserData, QuizResult, SubmitResult } from '../types';

export const quizService = {
    // Fetch questions WITHOUT correct_index (keamanan: correct_index disembunyikan)
    async getQuestions(subject: string): Promise<Question[] | null> {
        if (!supabase) return null;

        const { data, error } = await supabase
            .from('questions')
            .select('id, text, type, options, subject')
            .eq('subject', subject);

        if (error) {
            console.error('Error fetching questions:', error);
            return null;
        }

        return data as any as Question[];
    },

    // Fetch correct_answer for essay questions only (for AI scoring reference)
    async getEssayCorrectAnswers(subject: string): Promise<Record<number, string>> {
        if (!supabase) return {};

        const { data, error } = await supabase
            .from('questions')
            .select('id, correct_answer')
            .eq('subject', subject)
            .eq('type', 'essay')
            .not('correct_answer', 'is', null);

        if (error) {
            console.error('Error fetching essay correct answers:', error);
            return {};
        }

        const map: Record<number, string> = {};
        for (const row of data ?? []) {
            if (row.correct_answer) map[row.id] = row.correct_answer;
        }
        return map;
    },

    // Submit answers for server-side grading (PG + Essay)
    async submitQuiz(
        userData: UserData,
        pgAnswers: Record<number, number>,
        essayAnswers: Record<number, string>,
        essayScore: number,
        pgWeight: number,
        essayWeight: number
    ): Promise<SubmitResult | null> {
        if (!supabase) return null;

        const { data, error } = await supabase.rpc('submit_quiz', {
            p_name: userData.name,
            p_nim: userData.nim,
            p_class: userData.class,
            p_subject: userData.subject,
            p_answers: pgAnswers,
            p_essay_answers: essayAnswers,
            p_essay_score: essayScore,
            p_pg_weight: pgWeight,
            p_essay_weight: essayWeight,
        });

        if (error) {
            console.error('Error submitting quiz:', error);
            throw error;
        }

        return data as SubmitResult;
    },

    // Save AI suggestion after generation
    async updateAiSuggestion(resultId: string, suggestion: string): Promise<void> {
        if (!supabase) return;

        const { error } = await supabase.rpc('update_ai_suggestion', {
            p_id: resultId,
            p_suggestion: suggestion
        });

        if (error) {
            console.error('Error saving AI suggestion:', error);
        }
    },

    // Fetch a single result by ID (for URL persistence)
    async getResultById(id: string): Promise<QuizResult | null> {
        if (!supabase) return null;

        const { data, error } = await supabase
            .from('quiz_results')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching result:', error);
            return null;
        }

        return data as QuizResult;
    },

    // ── Session management (server-side, replaces localStorage) ──────────────

    /** Buat atau timpa sesi ujian untuk NIM ini di Supabase */
    async saveSession(
        userData: UserData,
        questions: Question[],
        essayCorrectAnswers: Record<number, string>
    ): Promise<string | null> {
        if (!supabase) return null;

        const { data, error } = await supabase
            .from('quiz_sessions')
            .upsert({
                nim: userData.nim,
                name: userData.name,
                class: userData.class,
                subject: userData.subject,
                started_at: new Date().toISOString(),
                questions: questions,
                answers: {},
                essay_answers: {},
                essay_correct_answers: essayCorrectAnswers,
            }, { onConflict: 'nim' })
            .select('id')
            .single();

        if (error) {
            console.error('Error saving session:', error);
            return null;
        }

        return data?.id ?? null;
    },

    /** Update jawaban PG dan essay secara real-time */
    async updateSessionAnswers(
        nim: string,
        answers: Record<number, number>,
        essayAnswers: Record<number, string>
    ): Promise<void> {
        if (!supabase) return;

        const { error } = await supabase
            .from('quiz_sessions')
            .update({ answers, essay_answers: essayAnswers })
            .eq('nim', nim);

        if (error) {
            console.error('Error updating session answers:', error);
        }
    },

    /** Ambil sesi aktif berdasarkan NIM. Kembalikan null jika tidak ada / sudah expired. */
    async getActiveSession(nim: string, quizDurationSeconds: number): Promise<{
        userData: UserData;
        questions: Question[];
        answers: Record<number, number>;
        essayAnswers: Record<number, string>;
        essayCorrectAnswers: Record<number, string>;
        timeLeftSeconds: number;
    } | null> {
        if (!supabase) return null;

        const { data, error } = await supabase
            .from('quiz_sessions')
            .select('*')
            .eq('nim', nim)
            .single();

        if (error || !data) return null;

        // Hitung sisa waktu berdasarkan started_at di server
        const startedAt = new Date(data.started_at).getTime();
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - startedAt) / 1000);
        const timeLeftSeconds = quizDurationSeconds - elapsedSeconds;

        if (timeLeftSeconds <= 0) {
            // Sesi sudah expired, hapus
            await supabase.from('quiz_sessions').delete().eq('nim', nim);
            return null;
        }

        return {
            userData: {
                name: data.name,
                nim: data.nim,
                class: data.class,
                subject: data.subject,
            },
            questions: data.questions as Question[],
            answers: (data.answers as Record<number, number>) ?? {},
            essayAnswers: (data.essay_answers as Record<number, string>) ?? {},
            essayCorrectAnswers: (data.essay_correct_answers as Record<number, string>) ?? {},
            timeLeftSeconds,
        };
    },

    /** Hapus sesi setelah submit atau retry */
    async deleteSession(nim: string): Promise<void> {
        if (!supabase) return;

        const { error } = await supabase
            .from('quiz_sessions')
            .delete().eq('nim', nim);

        if (error) {
            console.error('Error deleting session:', error);
        }
    },
};
