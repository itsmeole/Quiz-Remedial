import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, Circle } from 'lucide-react';
import { questions } from '../data/questions';

interface QuizScreenProps {
    answers: Record<number, number>;
    onAnswer: (questionId: number, answerIndex: number) => void;
    onFinish: () => void;
    onAutoSubmit: () => void;
}

export const QuizScreen: React.FC<QuizScreenProps> = ({ answers, onAnswer, onFinish, onAutoSubmit }) => {
    const [currentIdx, setCurrentIdx] = useState(0);
    const [timeLeft, setTimeLeft] = useState(3600); // 1 hour in seconds
    const [violation, setViolation] = useState<string | null>(null);
    const question = questions[currentIdx];

    // Timer Logic
    React.useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onAutoSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [onAutoSubmit]);

    // Anti-Cheat: Tab Switch / Focus Loss
    React.useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && !violation) {
                setViolation("Terdeteksi berpindah tab!");
            }
        };

        const handleBlur = () => {
            if (!violation) {
                setViolation("Terdeteksi meninggalkan jendela ujian!");
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleBlur);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleBlur);
        };
    }, [onAutoSubmit, violation]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleNext = () => {
        if (currentIdx < questions.length - 1) {
            setCurrentIdx(currentIdx + 1);
        } else {
            onFinish();
        }
    };

    const handlePrev = () => {
        if (currentIdx > 0) {
            setCurrentIdx(currentIdx - 1);
        }
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 p-6 max-w-7xl mx-auto w-full min-h-screen pt-20 pb-20 md:pb-6">
            {/* Main Question Area */}
            <div className="flex-1 flex flex-col gap-6">
                <div className="glass-panel p-6 md:p-8 flex-1 flex flex-col justify-center relative">
                    {/* Timer: Static on mobile, Absolute on Desktop */}
                    <div className={`
                        w-full text-center mb-6 md:mb-0 md:w-auto md:absolute md:top-4 md:right-4 
                        text-xl font-mono font-bold px-4 py-2 rounded-lg border transition-all
                        ${timeLeft < 300 ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' : 'bg-gray-500/30 border-white-800 text-white-300'}
                    `}>
                        {formatTime(timeLeft)}
                    </div>

                    {/* Meta Info */}
                    <div className="mb-6 flex flex-col items-start gap-2 md:flex-row md:justify-between md:items-center text-sm text-gray-400">
                        <span className="font-medium text-white/60">Question {currentIdx + 1} of {questions.length}</span>
                        <span className="bg-white-900/50 text-white-300 px-3 py-1 rounded-full text-xs font-bold border border-gray-500/50 self-start md:self-auto">
                            {question.type === 'multiple-choice' ? 'Multiple Choice' : 'Essay'}
                        </span>
                    </div>

                    <h2 className="text-xl md:text-2xl font-bold mb-8 leading-relaxed">
                        {question.text}
                    </h2>

                    <div className="flex flex-col gap-3">
                        {question.options.map((option, idx) => {
                            const isSelected = answers[question.id] === idx;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => onAnswer(question.id, idx)}
                                    className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${isSelected
                                        ? 'bg-blue-600/20 border-blue-500 text-white'
                                        : 'bg-gray-500/30 border-white-800 hover:bg-white-700/50 text-white-300'
                                        }`}
                                >
                                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-blue-400 bg-blue-500' : 'border-gray-500'
                                        }`}>
                                        {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                    <span className="text-base">{option}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between items-center glass-panel p-4">
                    <button
                        onClick={handlePrev}
                        disabled={currentIdx === 0}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${currentIdx === 0
                            ? 'text-gray-600 cursor-not-allowed'
                            : 'text-white hover:bg-gray-700/50'
                            }`}
                    >
                        <ChevronLeft size={20} /> Prev
                    </button>

                    <button
                        onClick={onFinish}
                        className="md:hidden text-green-400 font-bold hover:text-green-300 transition-colors"
                    >
                        Review & Finish
                    </button>

                    <button
                        onClick={handleNext}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 shadow-lg transition-transform active:scale-95"
                    >
                        {currentIdx === questions.length - 1 ? 'Finish' : 'Next'} <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Navigation Map (Sidebar) */}
            <div className="hidden md:flex flex-col gap-6 w-80 glass-panel p-6 h-full overflow-y-auto">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Circle size={12} className="fill-blue-500 text-blue-500" /> Question Map
                </h3>
                <div className="grid grid-cols-5 gap-2">
                    {questions.map((q, idx) => {
                        const isAnswered = answers[q.id] !== undefined;
                        const isCurrent = currentIdx === idx;
                        return (
                            <button
                                key={q.id}
                                onClick={() => setCurrentIdx(idx)}
                                className={`aspect-square rounded-lg text-sm font-bold border transition-all ${isCurrent
                                    ? 'border-blue-400 bg-blue-500/20 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                                    : isAnswered
                                        ? 'bg-green-500/20 border-green-500 text-green-400'
                                        : 'bg-gray-600/40 border-gray-700 text-gray-500 hover:border-gray-500'
                                    }`}
                            >
                                {idx + 1}
                            </button>
                        );
                    })}
                </div>
                <div className="mt-2 flex flex-col gap-2 text-xs text-gray-400">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border border-blue-400 bg-blue-500/20 rounded"></div> Saat Ini
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500/20 border-green-500 rounded"></div> Terjawab
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gray-800 border-gray-700 rounded"></div> Belum Terjawab
                    </div>
                </div>

                <button
                    onClick={onFinish}
                    className="mt-auto w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all"
                >
                    <CheckCircle size={18} /> Review & Submit
                </button>
            </div>

            {/* Violation Modal */}
            {violation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="glass-panel p-8 max-w-md w-full text-center border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Pelanggaran Terdeteksi!</h3>
                        <p className="text-gray-300 mb-8 leading-relaxed">
                            {violation}
                            <br />
                            Quiz akan otomatis dikumpulkan.
                        </p>
                        <button
                            onClick={onAutoSubmit}
                            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg active:scale-95"
                        >
                            Mengerti & Kumpulkan
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
