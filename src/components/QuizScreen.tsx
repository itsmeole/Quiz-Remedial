import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, Circle, Clock, AlertCircle, FileText, Pencil } from 'lucide-react';
import type { Question } from '../types';
import { CameraMonitor } from './CameraMonitor';

interface QuizScreenProps {
    questions: Question[];
    answers: Record<number, number>;
    essayAnswers: Record<number, string>;
    onAnswer: (questionId: number, answerIndex: number) => void;
    onEssayAnswer: (questionId: number, text: string) => void;
    onFinish: () => void;
    onAutoSubmit: () => void;
    timeLeft: number;
}

export const QuizScreen: React.FC<QuizScreenProps> = ({
    questions, answers, essayAnswers, onAnswer, onEssayAnswer, onFinish, onAutoSubmit, timeLeft
}) => {
    const [currentIdx, setCurrentIdx] = useState(0);
    const [violation, setViolation] = useState<string | null>(null);
    const [strikeCount, setStrikeCount] = useState(0);
    const [warning, setWarning] = useState<string | null>(null);
    const [modalTimer, setModalTimer] = useState(10);

    const question = questions[currentIdx];

    const autoSubmitRef = React.useRef(onAutoSubmit);
    autoSubmitRef.current = onAutoSubmit;

    // Modal countdown
    React.useEffect(() => {
        let interval: any;
        if (warning || violation) {
            setModalTimer(10);
            interval = setInterval(() => {
                setModalTimer(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        if (violation) autoSubmitRef.current();
                        else if (warning) setWarning(null);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [warning, violation]);

    // Anti-cheat
    React.useEffect(() => {
        const handleViolation = (msg: string) => {
            if (violation) return;
            if (strikeCount === 0) { setWarning(msg); setStrikeCount(1); }
            else setViolation(msg);
        };
        const onVisibility = () => { if (document.hidden) handleViolation('Terdeteksi berpindah tab!'); };
        const onBlur = () => handleViolation('Terdeteksi meninggalkan jendela ujian!');
        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('blur', onBlur);
        return () => {
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('blur', onBlur);
        };
    }, [strikeCount, violation]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleNext = () => {
        if (currentIdx < questions.length - 1) setCurrentIdx(currentIdx + 1);
        else onFinish();
    };
    const handlePrev = () => { if (currentIdx > 0) setCurrentIdx(currentIdx - 1); };

    const isEssay = question?.type === 'essay';
    const currentEssayText = essayAnswers[question?.id] ?? '';
    const wordCount = currentEssayText.trim().split(/\s+/).filter(Boolean).length;

    return (
        <div className="flex flex-col md:flex-row gap-6 p-6 max-w-7xl mx-auto w-full min-h-screen pt-20 pb-20 md:pb-6">
            {/* Main Question Area */}
            <div className="flex-1 flex flex-col gap-6 order-2 md:order-1">
                <div className="glass-panel p-6 md:p-8 flex-1 flex flex-col relative">
                    {/* Header */}
                    <div className="flex flex-col-reverse md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-700/50 pb-4">
                        <div className="flex flex-col gap-1">
                            <span className="font-medium text-white/60 text-sm">
                                Soal {currentIdx + 1} dari {questions.length}
                            </span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full w-fit ${isEssay
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                }`}>
                                {isEssay ? '✍️ Essay' : '📝 Pilihan Ganda'}
                            </span>
                        </div>
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-mono font-bold text-lg transition-all w-full md:w-auto justify-center
                            ${timeLeft < 300 ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' : 'bg-gray-600/50 border-gray-400 text-white'}`}>
                            <Clock size={18} />
                            {formatTime(timeLeft)}
                        </div>
                    </div>

                    <h2 className="text-xl md:text-2xl font-bold mb-8 leading-relaxed">{question?.text}</h2>

                    {/* PG Options */}
                    {!isEssay && (
                        <div className="flex flex-col gap-3">
                            {question?.options.map((option, idx) => {
                                const isSelected = answers[question.id] === idx;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => onAnswer(question.id, idx)}
                                        className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${isSelected
                                            ? 'bg-blue-600/20 border-blue-500 text-white'
                                            : 'bg-gray-500/30 border-white/10 hover:bg-white/10 text-gray-200'}`}
                                    >
                                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-blue-400 bg-blue-500' : 'border-gray-500'}`}>
                                            {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                        </div>
                                        <span className="text-base">{option}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Essay Textarea */}
                    {isEssay && (
                        <div className="flex flex-col gap-3 flex-1">
                            <p className="text-sm text-purple-300/80 flex items-center gap-2">
                                <FileText size={14} />
                                Tuliskan jawaban Anda secara lengkap dan jelas. Jawaban akan dinilai oleh AI.
                            </p>
                            <textarea
                                value={currentEssayText}
                                onChange={e => onEssayAnswer(question.id, e.target.value)}
                                placeholder="Tulis jawaban essay Anda di sini..."
                                rows={10}
                                className="w-full flex-1 bg-gray-800/60 border border-purple-500/30 rounded-xl p-4 text-white placeholder-gray-500 resize-y focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 transition-all text-base leading-relaxed"
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>{wordCount} kata</span>
                                <span>{currentEssayText.length} karakter</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div className="flex justify-between items-center glass-panel p-4">
                    <button
                        onClick={handlePrev}
                        disabled={currentIdx === 0}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${currentIdx === 0 ? 'text-gray-600 cursor-not-allowed' : 'text-white hover:bg-gray-700/50'}`}
                    >
                        <ChevronLeft size={20} /> Prev
                    </button>
                    <button onClick={onFinish} className="md:hidden text-green-400 font-bold hover:text-green-300 transition-colors">
                        Review &amp; Finish
                    </button>
                    <button
                        onClick={handleNext}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 shadow-lg transition-transform active:scale-95"
                    >
                        {currentIdx === questions.length - 1 ? 'Finish' : 'Next'} <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Sidebar */}
            <div className="flex flex-col gap-6 w-full md:w-80 order-1 md:order-2">
                <div className="glass-panel p-2 h-57 md:h-45 flex items-center justify-center">
                    <CameraMonitor onViolation={(msg) => setViolation(msg)} />
                </div>

                <div className="hidden md:flex flex-1 glass-panel p-6 overflow-y-auto flex-col">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Circle size={12} className="fill-blue-500 text-blue-500" /> Question Map
                    </h3>
                    <div className="grid grid-cols-5 gap-2">
                        {questions.map((q, idx) => {
                            const isAnswered = q.type === 'essay'
                                ? !!(essayAnswers[q.id]?.trim())
                                : answers[q.id] !== undefined;
                            const isCurrent = currentIdx === idx;
                            const isEssayQ = q.type === 'essay';
                            return (
                                <button
                                    key={q.id}
                                    onClick={() => setCurrentIdx(idx)}
                                    title={isEssayQ ? `Essay ${idx + 1}` : `PG ${idx + 1}`}
                                    className={`aspect-square flex items-center justify-center rounded-lg text-xs font-bold border transition-all ${isCurrent
                                        ? 'border-blue-400 bg-blue-500/20 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                                        : isAnswered
                                            ? isEssayQ
                                                ? 'bg-purple-600/20 border-purple-500 text-purple-400'
                                                : 'bg-green-500/20 border-green-500 text-green-400'
                                            : isEssayQ
                                                ? 'bg-transparent border-purple-500/50 text-purple-400 hover:border-purple-400 hover:bg-purple-500/10'
                                                : 'bg-gray-600/40 border-gray-700 text-gray-500 hover:border-gray-500'}`}
                                >
                                    {isEssayQ ? <Pencil size={14} fill={isAnswered ? 'currentColor' : 'none'} /> : idx + 1}
                                </button>
                            );
                        })}
                    </div>
                    <div className="mt-4 mb-4 flex flex-col gap-2 text-xs text-gray-400">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 border border-blue-400 bg-blue-500/20 rounded" /> Saat Ini</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500/20 border-green-500 rounded" /> Terjawab</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-transparent border border-purple-500/50 rounded" /> Essay</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-gray-800 border-gray-700 rounded" /> Belum Terjawab</div>
                    </div>
                    <button
                        onClick={onFinish}
                        className="mt-auto w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all"
                    >
                        <CheckCircle size={18} /> Review &amp; Submit
                    </button>
                </div>
            </div>

            {/* Warning Modal */}
            {warning && !violation && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="glass-panel p-8 max-w-md w-full text-center border-yellow-500/50 shadow-[0_0_50px_rgba(234,179,8,0.1)]">
                        <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-yellow-500">
                            <AlertCircle size={32} className="text-yellow-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Peringatan Keamanan</h3>
                        <p className="text-gray-300 mb-6 leading-relaxed">{warning}<br />
                            <span className="text-yellow-400 font-bold">Ini adalah peringatan terakhir.</span> Jika terdeteksi sekali lagi, kuis akan otomatis dikumpulkan.
                        </p>
                        <div className="flex flex-col items-center gap-2">
                            <div className="text-yellow-500 font-mono font-bold text-xl">{modalTimer}s</div>
                            <div className="text-xs text-gray-400 uppercase tracking-widest">Melanjutkan Otomatis...</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Violation Modal */}
            {violation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="glass-panel p-8 max-w-md w-full text-center border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Pelanggaran Terdeteksi!</h3>
                        <p className="text-gray-300 mb-6 leading-relaxed">{violation}<br />Quiz akan otomatis dikumpulkan.</p>
                        <div className="flex flex-col items-center gap-2">
                            <div className="text-red-500 font-mono font-bold text-xl">{modalTimer}s</div>
                            <div className="text-xs text-gray-400 uppercase tracking-widest">Mengumpulkan Otomatis...</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
