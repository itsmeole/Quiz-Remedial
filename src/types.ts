export type QuestionType = 'multiple-choice';

export interface Question {
    id: number;
    text: string;
    type: QuestionType;
    options: string[];
    correctIndex: number;
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
}
