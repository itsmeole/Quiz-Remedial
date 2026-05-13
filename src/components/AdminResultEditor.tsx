import React, { useState, useEffect } from 'react';
import type { QuizResult, EssayScoreResult, Question } from '../types';
import { supabase } from '../utils/supabaseClient';
import { quizService } from '../services/quizService';
import { X, Save, AlertCircle, FileText, RefreshCw } from 'lucide-react';

interface AdminResultEditorProps {
    result: QuizResult;
    onClose: () => void;
    onSaved: () => void;
}

const PG_WEIGHT = 0.7;
const ESSAY_WEIGHT = 0.3;

export const AdminResultEditor: React.FC<AdminResultEditorProps> = ({ result, onClose, onSaved }) => {
    const [name, setName] = useState(result.name);
    const [nim, setNim] = useState(result.nim);

    // Essay scoring state
    const [essayDetails, setEssayDetails] = useState<EssayScoreResult[]>([]);
    const [essayScoreInputs, setEssayScoreInputs] = useState<Record<number, string>>({});
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loadingQuestions, setLoadingQuestions] = useState(true);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Parse AI suggestion to get essay details
    useEffect(() => {
        let details: EssayScoreResult[] = [];
        if (result.ai_suggestion) {
            try {
                const parsed = JSON.parse(result.ai_suggestion);
                if (parsed.essayDetails && Array.isArray(parsed.essayDetails)) {
                    details = parsed.essayDetails;
                }
            } catch (e) {
                console.error('Failed to parse AI suggestion:', e);
            }
        }
        setEssayDetails(details);

        // Init score inputs from parsed details
        const initScores: Record<number, string> = {};
        details.forEach(d => { initScores[d.questionId] = d.score.toString(); });
        setEssayScoreInputs(initScores);
    }, [result.ai_suggestion]);

    // Fetch questions to display essay text
    useEffect(() => {
        setLoadingQuestions(true);
        quizService.getQuestions(result.subject).then(qs => {
            setQuestions(qs || []);
            setLoadingQuestions(false);
        });
    }, [result.subject]);

    // Computed values
    const pgScore = result.pg_score ?? result.score;
    const pgTotal = result.pg_total_questions ?? result.total_questions;
    const hasEssay = essayDetails.length > 0;

    const computedEssayScore = hasEssay
        ? essayDetails.reduce((sum, d) => {
            const edited = parseFloat(essayScoreInputs[d.questionId] ?? d.score.toString());
            return sum + (isNaN(edited) ? d.score : edited);
        }, 0) / essayDetails.length
        : 0;

    const computedFinalScore = hasEssay
        ? (pgScore * PG_WEIGHT) + (computedEssayScore * ESSAY_WEIGHT)
        : pgScore;

    const computedPassed = computedFinalScore >= 75;

    const handleEssayScoreChange = (questionId: number, value: string) => {
        setEssayScoreInputs(prev => ({ ...prev, [questionId]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validate essay scores
        for (const d of essayDetails) {
            const val = parseFloat(essayScoreInputs[d.questionId]);
            if (isNaN(val) || val < 0 || val > 100) {
                setError(`Nilai essay untuk soal #${d.questionId} harus antara 0 - 100.`);
                return;
            }
        }

        setLoading(true);

        if (!supabase) {
            setError('Supabase client not initialized');
            setLoading(false);
            return;
        }

        // Build updated ai_suggestion JSON with new essay scores
        let updatedAiSuggestion = result.ai_suggestion ?? null;
        if (hasEssay) {
            try {
                const parsed = result.ai_suggestion ? JSON.parse(result.ai_suggestion) : {};
                const updatedDetails = essayDetails.map(d => ({
                    ...d,
                    score: parseFloat(essayScoreInputs[d.questionId] ?? d.score.toString()) || 0,
                }));
                updatedAiSuggestion = JSON.stringify({ ...parsed, essayDetails: updatedDetails });
            } catch (e) {
                console.error('Error serializing AI suggestion:', e);
            }
        }

        const { error: updateError } = await supabase.rpc('admin_update_quiz_result', {
            p_id: result.id,
            p_name: name,
            p_nim: nim,
            p_score: parseFloat(computedFinalScore.toFixed(2)),
            p_essay_score: parseFloat(computedEssayScore.toFixed(2)),
            p_passed: computedPassed,
            p_ai_suggestion: updatedAiSuggestion,
        });

        setLoading(false);
        if (updateError) {
            setError(updateError.message);
        } else {
            onSaved();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-800">
                    <div>
                        <h2 className="text-xl font-bold text-white">Edit Hasil Ujian</h2>
                        <p className="text-xs text-gray-500 mt-0.5">{result.name} · {result.nim} · {result.subject}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-xl transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-5 space-y-5 overflow-y-auto flex-1">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                                <AlertCircle size={20} className="text-red-400 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-red-300">{error}</p>
                            </div>
                        )}

                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-400 uppercase">Name</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" required />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-400 uppercase">NIM</label>
                                <input type="text" value={nim} onChange={e => setNim(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" required />
                            </div>
                        </div>

                        {/* Score Summary Cards */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3 text-center">
                                <div className="text-xs text-gray-500 mb-1">PG Score</div>
                                <div className="text-xl font-bold text-blue-400">{pgScore.toFixed(1)}</div>
                                <div className="text-xs text-gray-600">{result.pg_correct_count}/{pgTotal} benar</div>
                            </div>
                            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3 text-center">
                                <div className="text-xs text-gray-500 mb-1">Essay Score</div>
                                <div className="text-xl font-bold text-purple-400">{computedEssayScore.toFixed(1)}</div>
                                <div className="text-xs text-gray-600">{essayDetails.length} soal</div>
                            </div>
                            <div className={`border rounded-xl p-3 text-center ${computedPassed ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                <div className="text-xs text-gray-500 mb-1">Final Score</div>
                                <div className={`text-xl font-bold ${computedPassed ? 'text-green-400' : 'text-red-400'}`}>
                                    {computedFinalScore.toFixed(1)}
                                </div>
                                <div className={`text-xs font-bold ${computedPassed ? 'text-green-500' : 'text-red-500'}`}>
                                    {computedPassed ? 'PASSED ✓' : 'FAILED ✗'}
                                </div>
                            </div>
                        </div>

                        {hasEssay && (
                            <div className="text-xs text-gray-500 text-center -mt-2">
                                Final = (PG × {Math.round(PG_WEIGHT * 100)}%) + (Essay × {Math.round(ESSAY_WEIGHT * 100)}%) — otomatis terhitung
                            </div>
                        )}

                        {/* Essay Editor Section */}
                        {hasEssay && (
                            <div>
                                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                                    <FileText size={16} className="text-purple-400" /> Edit Nilai Essay per Soal
                                </h3>
                                <div className="space-y-4">
                                    {essayDetails.map((d, idx) => {
                                        const q = questions.find(q => q.id === d.questionId);
                                        const essayAnswer = result.essay_answers?.[d.questionId] || '(Kosong)';
                                        const currentScore = parseFloat(essayScoreInputs[d.questionId] ?? '0');
                                        const isValid = !isNaN(currentScore) && currentScore >= 0 && currentScore <= 100;

                                        return (
                                            <div key={d.questionId} className="bg-gray-800/50 border border-purple-500/20 rounded-xl p-4 space-y-3">
                                                {/* Essay Header */}
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1">
                                                        <div className="text-xs text-purple-400 font-bold mb-1">Essay #{idx + 1}</div>
                                                        {loadingQuestions ? (
                                                            <div className="text-xs text-gray-500">Memuat soal...</div>
                                                        ) : (
                                                            <p className="text-sm text-gray-200">{q?.text ?? `Soal ID: ${d.questionId}`}</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Student Answer */}
                                                <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
                                                    <div className="text-xs text-gray-500 mb-1">Jawaban Mahasiswa:</div>
                                                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{essayAnswer}</p>
                                                </div>

                                                {/* AI Feedback (read-only) */}
                                                {d.feedback && (
                                                    <div className="text-xs text-gray-400 italic border-l-2 border-purple-500/40 pl-3">
                                                        "{d.feedback}"
                                                    </div>
                                                )}

                                                {/* Score Input */}
                                                <div className="flex items-center gap-3">
                                                    <label className="text-xs font-semibold text-gray-400 uppercase whitespace-nowrap">
                                                        Nilai (0 - 100)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        step="1"
                                                        value={essayScoreInputs[d.questionId] ?? ''}
                                                        onChange={e => handleEssayScoreChange(d.questionId, e.target.value)}
                                                        className={`w-24 bg-gray-900 border rounded-lg px-3 py-2 text-white text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${isValid ? 'border-gray-600' : 'border-red-500'}`}
                                                    />
                                                    <span className="text-xs text-gray-500">/ 100</span>
                                                    <div className={`ml-auto text-xs font-bold px-2 py-1 rounded ${currentScore >= 75 ? 'bg-green-500/20 text-green-400' : currentScore >= 50 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                                                        {isNaN(currentScore) ? '?' : currentScore >= 75 ? 'Baik' : currentScore >= 50 ? 'Cukup' : 'Kurang'}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Buttons */}
                    <div className="p-4 border-t border-gray-800 flex gap-3">
                        <button type="button" onClick={onClose}
                            className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-all">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading}
                            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                            {loading ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                            {loading ? 'Menyimpan...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
