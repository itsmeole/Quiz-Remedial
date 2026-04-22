import React, { useEffect, useState } from 'react';
import {
    RefreshCcw, Download, XCircle, CheckCircle, Clock,
    Brain, Copy, Check, ChevronDown, ChevronUp, FileText, Target, BookOpen,
    CheckCircle2, XCircle as XCircleIcon, ListChecks
} from 'lucide-react';
import { generateCertificate } from '../utils/certificate';
import type { UserData, EssayScoreResult } from '../types';

interface PgAnswerDetail {
    question_id: number;
    question_text: string;
    is_correct: boolean;
}

interface ResultScreenProps {
    finalScore: number;
    pgScore: number;
    essayScore: number;
    pgCorrectCount: number;
    pgTotalQuestions: number;
    essayTotalQuestions: number;
    essayScoreDetails: EssayScoreResult[];
    pgAnswersDetail: PgAnswerDetail[];
    isPassed: boolean;
    userData: UserData;
    onRetry: () => void;
    aiSuggestion: string[];
    isLoadingAI: boolean;
    resultId: string | null;
    pgWeight: number;
    essayWeight: number;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
    finalScore, pgScore, essayScore, pgCorrectCount, pgTotalQuestions,
    essayTotalQuestions, essayScoreDetails, pgAnswersDetail, isPassed, userData, onRetry,
    aiSuggestion, isLoadingAI, resultId, pgWeight, essayWeight
}) => {
    const [canRetry, setCanRetry] = useState(false);
    const [timeLeft, setTimeLeft] = useState(300);
    const [copied, setCopied] = useState(false);
    const [showSuggestion, setShowSuggestion] = useState(true);
    const [showEssayDetails, setShowEssayDetails] = useState(false);
    const [showPgReview, setShowPgReview] = useState(false);

    const hasEssay = essayTotalQuestions > 0;
    const hasPgDetail = pgAnswersDetail.length > 0;
    const resultUrl = resultId ? `${window.location.origin}/result/${resultId}` : null;

    useEffect(() => {
        if (!isPassed) {
            const interval = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) { setCanRetry(true); clearInterval(interval); return 0; }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [isPassed]);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    const handleDownload = async () => { await generateCertificate(userData.name, userData.subject); };
    const handleCopyUrl = () => {
        if (resultUrl) {
            navigator.clipboard.writeText(resultUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const ScoreBar = ({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) => (
        <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-1.5 text-gray-300">{icon}{label}</span>
                <span className={`font-bold ${color}`}>{value.toFixed(1)}</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-1000 ${value >= 75 ? 'bg-gradient-to-r from-green-500 to-green-400' : 'bg-gradient-to-r from-red-500 to-orange-400'}`}
                    style={{ width: `${Math.min(value, 100)}%` }} />
            </div>
        </div>
    );

    // AI Suggestion section shared between passed/failed
    const AISuggestionCard = () => (
        <div className={`glass-panel p-6 border ${isPassed ? 'border-blue-500/20' : 'border-orange-500/20'}`}>
            <button onClick={() => setShowSuggestion(v => !v)} className="w-full flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${isPassed ? 'bg-blue-500/20 border-blue-500/40' : 'bg-orange-500/20 border-orange-500/40'}`}>
                        <Brain size={18} className={isPassed ? 'text-blue-400' : 'text-orange-400'} />
                    </div>
                    <div className="text-left">
                        <div className="font-bold text-white text-sm">Saran Belajar AI</div>
                        <div className="text-xs text-gray-400">Powered by Groq · llama-3.3-70b</div>
                    </div>
                </div>
                {showSuggestion ? <ChevronUp size={18} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />}
            </button>

            {showSuggestion && (
                <div className="mt-4 pt-4 border-t border-gray-700/50">
                    {isLoadingAI ? (
                        <div className="flex flex-col items-center gap-3 py-4">
                            <div className="flex gap-1.5">
                                {[0, 1, 2].map(i => (
                                    <div key={i} className={`w-2 h-2 rounded-full animate-bounce ${isPassed ? 'bg-blue-400' : 'bg-orange-400'}`}
                                        style={{ animationDelay: `${i * 0.15}s` }} />
                                ))}
                            </div>
                            <p className="text-sm text-gray-400">AI sedang menganalisis hasilmu...</p>
                        </div>
                    ) : aiSuggestion.length > 0 ? (
                        <ul className="space-y-2.5">
                            {aiSuggestion.map((s, _i) => (
                                <li key={_i} className="flex items-start gap-3 text-sm text-gray-300">
                                    <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${isPassed ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                        {_i + 1}
                                    </span>
                                    <span className="leading-relaxed">{s}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500 italic">Saran AI tidak tersedia.</p>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center p-6 pt-20 pb-10">
            <div className="max-w-2xl w-full space-y-4">

                {/* ── Main Result Card ── */}
                <div className="glass-panel p-8 text-center relative overflow-hidden">
                    <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-[100px] -z-10 ${isPassed ? 'bg-green-500/20' : 'bg-red-500/20'}`} />

                    <div className="mb-5 flex justify-center">
                        {isPassed
                            ? <CheckCircle size={72} className="text-green-400 drop-shadow-[0_0_20px_rgba(74,222,128,0.5)]" />
                            : <XCircle size={72} className="text-red-400 drop-shadow-[0_0_20px_rgba(248,113,113,0.5)]" />}
                    </div>

                    <h1 className="text-4xl font-bold mb-1">{isPassed ? 'Congratulations! 🎉' : 'Nice Try!'}</h1>
                    <p className="text-lg text-gray-300 mb-6">
                        {isPassed ? 'Kamu telah lulus remedial!' : 'Sayangnya, Anda belum mencapai nilai lulus.'}
                    </p>

                    {/* Final Score */}
                    <div className="bg-gray-800/60 rounded-2xl p-6 mb-6 border border-gray-700">
                        <div className="text-gray-400 text-xs uppercase tracking-widest mb-2">Nilai Akhir</div>
                        <div className={`text-6xl font-black mb-1 ${isPassed ? 'text-green-400' : 'text-red-400'}`}>
                            {finalScore.toFixed(0)}<span className="text-2xl text-gray-500 font-normal">/100</span>
                        </div>
                        <div className="text-xs text-gray-500">{isPassed ? '✅ Lulus (≥75)' : '❌ Belum lulus (< 75)'}</div>
                    </div>

                    {/* Score Breakdown Bars */}
                    <div className="bg-gray-800/40 rounded-xl p-5 border border-gray-700/50 space-y-4 mb-6 text-left">
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Rincian Nilai</h3>
                        <ScoreBar
                            label={`PG — ${pgCorrectCount}/${pgTotalQuestions} benar (bobot ${Math.round(pgWeight * 100)}%)`}
                            value={pgScore}
                            color={pgScore >= 75 ? 'text-green-400' : 'text-red-400'}
                            icon={<Target size={14} />}
                        />
                        {hasEssay && (
                            <ScoreBar
                                label={`Essay — ${essayTotalQuestions} soal (bobot ${Math.round(essayWeight * 100)}%)`}
                                value={essayScore}
                                color={essayScore >= 75 ? 'text-green-400' : 'text-orange-400'}
                                icon={<FileText size={14} />}
                            />
                        )}
                        {hasEssay && (
                            <div className="border-t border-gray-700 pt-3">
                                <ScoreBar label="Nilai Akhir (Gabungan)" value={finalScore}
                                    color={isPassed ? 'text-green-400' : 'text-red-400'}
                                    icon={<BookOpen size={14} />} />
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    {isPassed ? (
                        <button onClick={handleDownload}
                            className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold py-4 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2 transform transition-all active:scale-95 mb-3">
                            <Download size={22} /> Download Sertifikat (PDF)
                        </button>
                    ) : (
                        <div className="space-y-3 mb-3">
                            <button onClick={onRetry} disabled={!canRetry}
                                className={`w-full font-bold py-4 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all ${canRetry ? 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}>
                                {canRetry ? <><RefreshCcw size={22} /> Coba Lagi</> : <><Clock size={22} /> Tunggu {formatTime(timeLeft)}</>}
                            </button>
                            {!canRetry && <p className="text-xs text-gray-500 animate-pulse">Tinjau materi dan baca saran AI di bawah sebelum mencoba lagi!</p>}
                        </div>
                    )}

                    {/* Copy URL */}
                    {resultUrl && (
                        <button onClick={handleCopyUrl}
                            className="w-full flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-xl py-2.5 px-4 transition-all">
                            {copied ? <><Check size={14} className="text-green-400" /> URL Tersalin!</> : <><Copy size={14} /> Salin URL Nilai Ini</>}
                        </button>
                    )}
                </div>

                {/* ── PG Review ── */}
                {hasPgDetail && (
                    <div className="glass-panel p-6 border border-gray-700/50">
                        <button onClick={() => setShowPgReview(v => !v)}
                            className="w-full flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gray-700/60 border border-gray-600 flex items-center justify-center">
                                    <ListChecks size={18} className="text-gray-300" />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-white text-sm">Review Jawaban PG</div>
                                    <div className="text-xs text-gray-400">
                                        {pgCorrectCount} benar · {pgTotalQuestions - pgCorrectCount} salah dari {pgTotalQuestions} soal
                                    </div>
                                </div>
                            </div>
                            {showPgReview ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                        </button>

                        {showPgReview && (
                            <div className="mt-4 pt-4 border-t border-gray-700/50 space-y-2 max-h-96 overflow-y-auto pr-1">
                                {pgAnswersDetail.map((q, i) => (
                                    <div key={q.question_id}
                                        className={`flex items-start gap-3 p-3 rounded-lg border text-sm ${q.is_correct
                                            ? 'bg-green-500/8 border-green-500/25 text-gray-300'
                                            : 'bg-red-500/8 border-red-500/25 text-gray-300'}`}>
                                        <div className="flex-shrink-0 mt-0.5">
                                            {q.is_correct
                                                ? <CheckCircle2 size={16} className="text-green-400" />
                                                : <XCircleIcon size={16} className="text-red-400" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-xs text-gray-500 mr-2">#{i + 1}</span>
                                            <span className="leading-relaxed">{q.question_text}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Essay Detail (per soal) ── */}
                {hasEssay && essayScoreDetails.length > 0 && (
                    <div className="glass-panel p-6 border border-purple-500/20">
                        <button onClick={() => setShowEssayDetails(v => !v)}
                            className="w-full flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
                                    <FileText size={18} className="text-purple-400" />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-white text-sm">Detail Penilaian Essay AI</div>
                                    <div className="text-xs text-gray-400">Feedback · Kelebihan · Kekurangan per soal</div>
                                </div>
                            </div>
                            {showEssayDetails ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                        </button>

                        {showEssayDetails && (
                            <div className="mt-4 pt-4 border-t border-gray-700/50 space-y-4">
                                {essayScoreDetails.map((d, i) => (
                                    <div key={d.questionId} className="bg-gray-800/50 rounded-xl p-5 border border-purple-500/20">
                                        {/* Header */}
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-semibold text-purple-300">Essay {i + 1}</span>
                                            <span className={`text-sm font-bold px-3 py-1 rounded-lg ${d.score >= 75 ? 'bg-green-500/20 text-green-400' : d.score >= 50 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                                                {d.score}/100
                                            </span>
                                        </div>
                                        {/* Score bar */}
                                        <div className="h-1.5 bg-gray-700 rounded-full mb-4 overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-700 ${d.score >= 75 ? 'bg-green-400' : d.score >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                                                style={{ width: `${d.score}%` }} />
                                        </div>
                                        {/* Feedback */}
                                        {d.feedback && (
                                            <p className="text-sm text-gray-300 leading-relaxed mb-3 italic">"{d.feedback}"</p>
                                        )}
                                        {/* Strengths & Weaknesses */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="bg-green-500/8 border border-green-500/20 rounded-lg p-3">
                                                <div className="text-xs font-semibold text-green-400 mb-1 flex items-center gap-1.5">
                                                    <CheckCircle2 size={12} /> Kelebihan
                                                </div>
                                                <p className="text-xs text-gray-400 leading-relaxed">{d.strengths || '-'}</p>
                                            </div>
                                            <div className="bg-red-500/8 border border-red-500/20 rounded-lg p-3">
                                                <div className="text-xs font-semibold text-red-400 mb-1 flex items-center gap-1.5">
                                                    <XCircleIcon size={12} /> Kekurangan
                                                </div>
                                                <p className="text-xs text-gray-400 leading-relaxed">{d.weaknesses || '-'}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── AI Study Suggestions ── */}
                <AISuggestionCard />
            </div>
        </div>
    );
};
