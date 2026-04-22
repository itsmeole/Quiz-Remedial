export type QuestionType = 'multiple-choice' | 'essay';

export interface Question {
    id: number;
    text: string;
    type: QuestionType;
    options: string[];
    correctIndex?: number;
}

export interface UserData {
    name: string;
    nim: string;
    class: string;
    subject: 'linear-algebra' | 'calculus';
}

export type GameState = 'WELCOME' | 'QUIZ' | 'REVIEW' | 'RESULT' | 'ADMIN';

export interface QuizResult {
    id: string;
    created_at: string;
    name: string;
    nim: string;
    class: string;
    score: number;
    passed: boolean;
    subject: string;
    correct_count: number;
    total_questions: number;
    pg_score?: number;
    pg_correct_count?: number;
    pg_total_questions?: number;
    essay_score?: number;
    essay_answers?: Record<number, string>;
    ai_suggestion?: string;
    pg_answers_detail?: PgAnswerDetail[];
    is_violation?: boolean;
    violation_reason?: string;
}

export interface Student {
    id: number;
    name: string;
    nim: string;
    class: string;
}

export interface PgAnswerDetail {
    question_id: number;
    question_text: string;
    is_correct: boolean;
}

export interface EssayScoreResult {
    questionId: number;
    score: number; // 0-100
    feedback: string;
    strengths: string;
    weaknesses: string;
    study_suggestions: string[];
}

export interface SubmitResult {
    id: string;
    score: number;
    passed: boolean;
    pg_score: number;
    essay_score: number;
    correct_count: number;
    total_questions: number;
    pg_answers_detail: PgAnswerDetail[];
}
