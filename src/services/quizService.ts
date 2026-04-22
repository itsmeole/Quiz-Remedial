import { supabase } from '../utils/supabaseClient';
import type { Question, UserData, QuizResult, SubmitResult } from '../types';

export const quizService = {
    // Fetch questions WITHOUT correct_index (keamanan: correct_index disembunyikan)
    async getQuestions(subject: 'linear-algebra' | 'calculus'): Promise<Question[] | null> {
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
    async getEssayCorrectAnswers(subject: 'linear-algebra' | 'calculus'): Promise<Record<number, string>> {
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

        const { error } = await supabase
            .from('quiz_results')
            .update({ ai_suggestion: suggestion })
            .eq('id', resultId);

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
};
