import React from 'react';
import type { QuizResult, EssayScoreResult } from '../types';
import { X, Target, FileText, CheckCircle2, XCircle as XCircleIcon } from 'lucide-react';

interface AdminResultViewerProps {
    result: QuizResult;
    onClose: () => void;
}

export const AdminResultViewer: React.FC<AdminResultViewerProps> = ({ result, onClose }) => {
    const pgAnswers = result.pg_answers_detail || [];
    const essayAnswers = result.essay_answers || {};
    
    let essayDetails: EssayScoreResult[] = [];
    if (result.ai_suggestion) {
        try {
            const parsed = JSON.parse(result.ai_suggestion);
            if (parsed.essayDetails) {
                essayDetails = parsed.essayDetails;
            }
        } catch (e) {
            console.error('Failed to parse AI suggestion:', e);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gray-900/80">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1">
                            Detail Jawaban: {result.name}
                        </h2>
                        <p className="text-sm text-gray-400">
                            {result.nim} • {result.class} • {result.subject}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors">
                        <X size={20} className="text-gray-300" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Final Score</div>
                            <div className={`text-2xl font-bold ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
                                {result.score.toFixed(1)}
                            </div>
                        </div>
                        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">PG Score</div>
                            <div className="text-2xl font-bold text-blue-400">
                                {result.pg_score?.toFixed(1) || '-'}
                            </div>
                        </div>
                        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Essay Score</div>
                            <div className="text-2xl font-bold text-purple-400">
                                {result.essay_score?.toFixed(1) || '-'}
                            </div>
                        </div>
                        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Status</div>
                            <div className={`text-xl font-bold ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
                                {result.passed ? 'PASSED' : 'FAILED'}
                            </div>
                        </div>
                    </div>

                    {/* PG Section */}
                    {pgAnswers.length > 0 && (
                        <div>
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Target size={18} className="text-blue-400" /> Multiple Choice Answers
                            </h3>
                            <div className="grid gap-3">
                                {pgAnswers.map((q, idx) => (
                                    <div key={q.question_id} className={`p-4 rounded-xl border ${q.is_correct ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                                        <div className="flex items-start gap-3">
                                            {q.is_correct ? (
                                                <CheckCircle2 size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
                                            ) : (
                                                <XCircleIcon size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                                            )}
                                            <div>
                                                <span className="text-xs font-bold text-gray-500 mr-2">#{idx + 1}</span>
                                                <span className="text-sm text-gray-200">{q.question_text}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Essay Section */}
                    {Object.keys(essayAnswers).length > 0 && (
                        <div>
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 mt-8">
                                <FileText size={18} className="text-purple-400" /> Essay Answers & AI Review
                            </h3>
                            <div className="space-y-4">
                                {essayDetails.length > 0 ? (
                                    essayDetails.map((detail, idx) => (
                                        <div key={detail.questionId} className="bg-gray-800/40 rounded-xl p-5 border border-purple-500/20">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="font-bold text-purple-300">Essay #{idx + 1}</span>
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${detail.score >= 75 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                    Score: {detail.score}/100
                                                </span>
                                            </div>
                                            <div className="mb-4 bg-gray-900 p-3 rounded-lg border border-gray-700">
                                                <div className="text-xs text-gray-500 mb-1">Jawaban Mahasiswa:</div>
                                                <p className="text-sm text-gray-300 whitespace-pre-wrap">{essayAnswers[detail.questionId] || '(Kosong)'}</p>
                                            </div>
                                            {detail.feedback && (
                                                <p className="text-sm text-gray-400 italic mb-3">" {detail.feedback} "</p>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    // Fallback if no AI details
                                    Object.entries(essayAnswers).map(([qId, ans], idx) => (
                                        <div key={qId} className="bg-gray-800/40 rounded-xl p-5 border border-gray-700">
                                            <span className="font-bold text-gray-400 mb-3 block">Essay #{idx + 1}</span>
                                            <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                                                <p className="text-sm text-gray-300 whitespace-pre-wrap">{ans as string}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
