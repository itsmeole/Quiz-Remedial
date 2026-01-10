import React, { useEffect, useState } from 'react';
import { RefreshCcw, Download, XCircle, CheckCircle, Clock } from 'lucide-react';
import { generateCertificate } from '../utils/certificate';
import type { UserData } from '../types';

interface ResultScreenProps {
    score: number;
    totalQuestions: number;
    userData: UserData;
    onRetry: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({ score, totalQuestions, userData, onRetry }) => {
    const percentage = Math.round((score / totalQuestions) * 100);
    const isPassed = percentage >= 75;

    // Retry timer logic
    const [canRetry, setCanRetry] = useState(false);
    const [timeLeft, setTimeLeft] = useState(300); // 3 minutes

    useEffect(() => {
        if (!isPassed) {
            const interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        setCanRetry(true);
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [isPassed]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleDownload = async () => {
        await generateCertificate(userData.name, userData.subject);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 pt-20">
            <div className="glass-panel max-w-lg w-full p-8 text-center relative overflow-hidden">
                {/* Ambient Glow */}
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-[100px] -z-10 ${isPassed ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}></div>

                <div className="mb-6 flex justify-center">
                    {isPassed ? (
                        <CheckCircle size={80} className="text-green-400" />
                    ) : (
                        <XCircle size={80} className="text-red-400" />
                    )}
                </div>

                <h1 className="text-4xl font-bold mb-2">
                    {isPassed ? 'Congratulations!' : 'Nice Try!'}
                </h1>
                <p className="text-xl text-gray-300 mb-8">
                    {isPassed ? 'Kamu telah lulus remedial!.' : 'Sayangnya, Anda belum mencapai nilai lulus.'}
                </p>

                <div className="bg-gray-800/50 rounded-xl p-6 mb-8 border border-gray-700">
                    <div className="text-gray-400 text-sm uppercase tracking-wider mb-1">Total Score</div>
                    <div className={`text-5xl font-bold ${isPassed ? 'text-green-400' : 'text-red-400'}`}>
                        {percentage}
                        <span className="text-2xl text-gray-500">/100</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                        Jawaban Benar: {score} / {totalQuestions}
                    </div>
                </div>

                {isPassed ? (
                    <button
                        onClick={handleDownload}
                        className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold py-4 px-6 rounded-lg shadow-lg flex items-center justify-center gap-2 transform transition-all active:scale-95"
                    >
                        <Download size={24} /> Download Sertifikat (PDF)
                    </button>
                ) : (
                    <div className="space-y-4">
                        <button
                            onClick={onRetry}
                            disabled={!canRetry}
                            className={`w-full font-bold py-4 px-6 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all ${canRetry
                                ? 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95'
                                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            {canRetry ? (
                                <>
                                    <RefreshCcw size={24} /> Coba Lagi
                                </>
                            ) : (
                                <>
                                    <Clock size={24} /> Tunggu {formatTime(timeLeft)}
                                </>
                            )}
                        </button>
                        {!canRetry && (
                            <p className="text-xs text-gray-500 animate-pulse">
                                Waktu tunggu aktif. Harap tinjau materi sebelum mencoba lagi. Pastikan anda mempelajarinya juga di internet selain dari materi pembelajaran yg ada di kelas saja.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
