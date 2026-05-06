import React, { useState } from 'react';
import type { QuizResult } from '../types';
import { supabase } from '../utils/supabaseClient';
import { X, Save, AlertCircle } from 'lucide-react';

interface AdminResultEditorProps {
    result: QuizResult;
    onClose: () => void;
    onSaved: () => void;
}

export const AdminResultEditor: React.FC<AdminResultEditorProps> = ({ result, onClose, onSaved }) => {
    const [name, setName] = useState(result.name);
    const [nim, setNim] = useState(result.nim);
    const [score, setScore] = useState(result.score.toString());
    const [passed, setPassed] = useState(result.passed);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const numScore = parseFloat(score);
        if (isNaN(numScore) || numScore < 0 || numScore > 100) {
            setError('Score must be a number between 0 and 100');
            setLoading(false);
            return;
        }

        if (!supabase) {
            setError('Supabase client not initialized');
            setLoading(false);
            return;
        }

        const { error: updateError } = await supabase
            .from('quiz_results')
            .update({
                name,
                nim,
                score: numScore,
                passed
            })
            .eq('id', result.id);

        setLoading(false);

        if (updateError) {
            setError(updateError.message);
        } else {
            onSaved();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-md w-full shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-gray-900/80">
                    <h2 className="text-xl font-bold text-white">Edit Result</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-xl transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <form onSubmit={handleSave} className="p-5 space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                            <AlertCircle size={20} className="text-red-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-red-300">{error}</p>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-400 uppercase">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-400 uppercase">NIM</label>
                        <input
                            type="text"
                            value={nim}
                            onChange={e => setNim(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-400 uppercase">Final Score</label>
                        <input
                            type="number"
                            step="0.01"
                            value={score}
                            onChange={e => setScore(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            required
                        />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-800 border border-gray-700 rounded-xl">
                        <div>
                            <div className="text-sm font-semibold text-white">Passed Status</div>
                            <div className="text-xs text-gray-400">Tentukan kelulusan manual</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={passed}
                                onChange={e => setPassed(e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-all">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                            <Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
