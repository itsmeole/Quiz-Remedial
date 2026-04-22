import React from 'react';
import { ChevronLeft, Send, AlertTriangle, FileText } from 'lucide-react';
import type { Question } from '../types';

interface ReviewScreenProps {
    questions: Question[];
    answers: Record<number, number>;
    essayAnswers: Record<number, string>;
    onBack: () => void;
    onSubmit: () => void;
}

export const ReviewScreen: React.FC<ReviewScreenProps> = ({ questions, answers, essayAnswers, onBack, onSubmit }) => {
    const pgQuestions = questions.filter(q => q.type === 'multiple-choice');
    const essayQuestions = questions.filter(q => q.type === 'essay');

    const pgAnswered = pgQuestions.filter(q => answers[q.id] !== undefined).length;
    const essayAnswered = essayQuestions.filter(q => essayAnswers[q.id]?.trim()).length;
    const totalUnanswered = (pgQuestions.length - pgAnswered) + (essayQuestions.length - essayAnswered);

    return (
        <div className="min-h-screen pt-20 p-6 max-w-5xl mx-auto flex flex-col items-center">
            <div className="glass-panel w-full p-8">
                <h2 className="text-3xl font-bold mb-6 text-center">Review Jawaban</h2>

                {/* Stats */}
                <div className="flex flex-wrap gap-4 justify-center mb-8">
                    <div className="bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-700 flex items-center gap-2">
                        <span className="w-3 h-3 bg-blue-500 rounded-full" />
                        <span className="text-sm">PG: <strong className="text-white">{pgAnswered}/{pgQuestions.length}</strong></span>
                    </div>
                    {essayQuestions.length > 0 && (
                        <div className="bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-700 flex items-center gap-2">
                            <span className="w-3 h-3 bg-purple-500 rounded-full" />
                            <span className="text-sm flex items-center gap-1">
                                <FileText size={12} /> Essay: <strong className="text-white">{essayAnswered}/{essayQuestions.length}</strong>
                            </span>
                        </div>
                    )}
                    <div className="bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-700 flex items-center gap-2">
                        <span className="w-3 h-3 bg-red-500 rounded-full" />
                        <span className="text-sm">Belum: <strong className="text-white">{totalUnanswered}</strong></span>
                    </div>
                </div>

                {totalUnanswered > 0 && (
                    <div className="bg-yellow-500/20 text-yellow-200 border border-yellow-500/50 p-4 rounded-lg mb-8 flex items-center gap-3">
                        <AlertTriangle size={24} className="flex-shrink-0" />
                        <p>Anda memiliki <strong>{totalUnanswered}</strong> soal yang belum terjawab. Apakah Anda yakin ingin mengirim?</p>
                    </div>
                )}

                {/* PG Grid */}
                {pgQuestions.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-blue-300 uppercase tracking-wider mb-3">Pilihan Ganda</h3>
                        <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
                            {pgQuestions.map((q, idx) => {
                                const isAnswered = answers[q.id] !== undefined;
                                return (
                                    <div key={q.id}
                                        className={`aspect-square rounded-lg flex items-center justify-center font-bold border ${isAnswered
                                            ? 'bg-green-500/20 border-green-500 text-green-400'
                                            : 'bg-red-500/20 border-red-500 text-red-400'}`}
                                    >
                                        {idx + 1}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Essay Grid */}
                {essayQuestions.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-purple-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <FileText size={14} /> Essay
                        </h3>
                        <div className="flex flex-col gap-3">
                            {essayQuestions.map((q, idx) => {
                                const text = essayAnswers[q.id]?.trim() ?? '';
                                const isAnswered = text.length > 0;
                                const wordCount = text.split(/\s+/).filter(Boolean).length;
                                return (
                                    <div key={q.id}
                                        className={`rounded-lg p-4 border ${isAnswered
                                            ? 'bg-purple-500/10 border-purple-500/50'
                                            : 'bg-red-500/10 border-red-500/50'}`}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <span className="text-sm font-medium text-gray-300">Essay {idx + 1}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${isAnswered ? 'bg-purple-500/20 text-purple-300' : 'bg-red-500/20 text-red-400'}`}>
                                                {isAnswered ? `${wordCount} kata` : 'Belum dijawab'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-400 line-clamp-1">{q.text}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="flex justify-between mt-8 border-t border-gray-700 pt-8">
                    <button onClick={onBack} className="flex items-center gap-2 px-6 py-3 rounded-lg text-white hover:bg-gray-700/50 transition-colors">
                        <ChevronLeft size={20} /> Kembali ke Quiz
                    </button>
                    <button
                        onClick={onSubmit}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg transform transition-all hover:scale-[1.02] flex items-center gap-2"
                    >
                        Kirim Jawaban <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};
