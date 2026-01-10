import React from 'react';
import { ChevronLeft, Send, AlertTriangle } from 'lucide-react';
import type { Question } from '../types';

interface ReviewScreenProps {
    questions: Question[];
    answers: Record<number, number>;
    onBack: () => void;
    onSubmit: () => void;
}

export const ReviewScreen: React.FC<ReviewScreenProps> = ({ questions, answers, onBack, onSubmit }) => {
    const answeredCount = Object.keys(answers).length;
    const totalCount = questions.length;
    const unansweredCount = totalCount - answeredCount;

    return (
        <div className="min-h-screen pt-20 p-6 max-w-5xl mx-auto flex flex-col items-center">
            <div className="glass-panel w-full p-8">
                <h2 className="text-3xl font-bold mb-6 text-center">Review Jawaban</h2>

                <div className="flex gap-4 justify-center mb-8">
                    <div className="bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-700 flex items-center gap-2">
                        <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                        <span>Terjawab: {answeredCount}</span>
                    </div>
                    <div className="bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-700 flex items-center gap-2">
                        <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                        <span>Belum Terjawab: {unansweredCount}</span>
                    </div>
                </div>

                {unansweredCount > 0 && (
                    <div className="bg-yellow-500/20 text-yellow-200 border border-yellow-500/50 p-4 rounded-lg mb-8 flex items-center gap-3">
                        <AlertTriangle size={24} />
                        <p>Anda memiliki {unansweredCount} pertanyaan yang belum terjawab. Apakah anda yakin ingin mengirim?</p>
                    </div>
                )}

                <div className="grid grid-cols-5 md:grid-cols-10 gap-3 mb-8">
                    {questions.map((q, idx) => {
                        const isAnswered = answers[q.id] !== undefined;
                        return (
                            <div
                                key={q.id}
                                className={`aspect-square rounded-lg flex items-center justify-center font-bold border transition-all cursor-default ${isAnswered
                                    ? 'bg-green-500/20 border-green-500 text-green-400'
                                    : 'bg-red-500/20 border-red-500 text-red-400'
                                    }`}
                            >
                                {idx + 1}
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-between mt-8 border-t border-gray-700 pt-8">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 px-6 py-3 rounded-lg text-white hover:bg-gray-700/50 transition-colors"
                    >
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
