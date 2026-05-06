import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { QuestionManager } from './QuestionManager';
import { SubjectManager } from './SubjectManager';
import { AdminLogin } from './AdminLogin';
import { AdminResultViewer } from './AdminResultViewer';
import { AdminResultEditor } from './AdminResultEditor';
import type { QuizResult } from '../types';
import { Download, RefreshCw, BookOpen, List, LogOut, Eye, Edit2, Trash2 } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';

export const AdminScreen: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [results, setResults] = useState<QuizResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showQuestionManager, setShowQuestionManager] = useState(false);
    const [showSubjectManager, setShowSubjectManager] = useState(false);
    const [viewingResult, setViewingResult] = useState<QuizResult | null>(null);
    const [editingResult, setEditingResult] = useState<QuizResult | null>(null);

    const fetchResults = async () => {
        setLoading(true);
        if (!supabase) {
            const url = import.meta.env.VITE_SUPABASE_URL;
            const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
            let msg = "Supabase client not initialized.";
            if (!url) msg += " Missing VITE_SUPABASE_URL.";
            if (!key) msg += " Missing VITE_SUPABASE_ANON_KEY.";

            console.log("Debug Env:", { url, key });
            setError(msg);
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('quiz_results')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
            setError(error.message);
        } else {
            setResults(data || []);
        }
        setLoading(false);
    };

    const handleDeleteResult = async (id: string) => {
        if (!confirm('Are you sure you want to delete this result? This cannot be undone.')) return;
        
        if (!supabase) return;
        const { error } = await supabase.from('quiz_results').delete().eq('id', id);
        if (error) {
            alert('Failed to delete: ' + error.message);
        } else {
            fetchResults();
        }
    };

    // Check auth session
    useEffect(() => {
        if (!supabase) {
            setAuthLoading(false);
            return;
        }

        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setAuthLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (session) {
            fetchResults();
        }
    }, [session]);

    const handleLogout = async () => {
        if (supabase) {
            await supabase.auth.signOut();
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!session) {
        return <AdminLogin onLoginSuccess={() => fetchResults()} />;
    }

    const handleExport = () => {
        const headers = ["Date", "Subject", "Name", "NIM", "Class", "Score", "Result"];
        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + results.map(row => {
                const date = new Date(row.created_at).toLocaleString();
                return `"${date}","${row.subject || '-'}", "${row.name}","${row.nim}","${row.class}","${row.score}","${row.passed ? 'PASSED' : 'FAILED'}"`;
            }).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "quiz_results.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (showSubjectManager) {
        return <SubjectManager onBack={() => setShowSubjectManager(false)} />;
    }

    if (showQuestionManager) {
        return <QuestionManager onBack={() => setShowQuestionManager(false)} />;
    }

    return (
        <div className="min-h-screen pt-20 p-6 max-w-7xl mx-auto flex flex-col">
            <div className="glass-panel p-8 w-full">
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                    <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                            <span className="text-xl">📊</span>
                        </div>
                        Admin Dashboard
                    </h1>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchResults}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-all border border-gray-700 hover:border-gray-600 active:scale-95"
                            title="Refresh Data"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-xl transition-all border border-blue-500/30 hover:border-blue-500/50 active:scale-95"
                            title="Export CSV"
                        >
                            <Download size={18} />
                            <span className="hidden sm:inline">Export</span>
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-xl transition-all border border-red-500/30 hover:border-red-500/50 active:scale-95"
                            title="Logout"
                        >
                            <LogOut size={18} />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                        <button
                            onClick={() => setShowSubjectManager(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow-lg transition-colors"
                        >
                            <BookOpen size={20} /> Manage Subjects
                        </button>
                        <button
                            onClick={() => setShowQuestionManager(true)}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow-lg transition-colors"
                        >
                            <List size={20} /> Manage Questions
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-500/20 border border-red-500 text-red-200 p-4 rounded-lg mb-6">
                        Error: {error}
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-12 text-gray-400">Loading data...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-700 text-gray-400 text-sm uppercase tracking-wider">
                                    <th className="p-4">Time</th>
                                    <th className="p-4">Subject</th>
                                    <th className="p-4">Name</th>
                                    <th className="p-4">NIM</th>
                                    <th className="p-4">Class</th>
                                    <th className="p-4">Score</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-gray-500">
                                            No results found yet.
                                        </td>
                                    </tr>
                                ) : (
                                    results.map((row) => (
                                        <tr key={row.id} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                                            <td className="p-4 text-sm text-gray-300">
                                                {new Date(row.created_at).toLocaleString()}
                                            </td>
                                            <td className="p-4 text-gray-300 font-medium">
                                                {row.subject || '-'}
                                            </td>
                                            <td className="p-4 font-medium text-white">{row.name}</td>
                                            <td className="p-4 text-gray-300">{row.nim}</td>
                                            <td className="p-4 text-gray-300">{row.class}</td>
                                            <td className="p-4">
                                                <span className={`font-bold ${row.score >= 75 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {row.score}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${row.passed
                                                    ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                                                    : 'bg-red-500/20 text-red-400 border border-red-500/50'
                                                    }`}>
                                                    {row.passed ? 'PASSED' : 'FAILED'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => setViewingResult(row)} className="p-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 rounded-lg transition-colors" title="View Details">
                                                        <Eye size={16} />
                                                    </button>
                                                    <button onClick={() => setEditingResult(row)} className="p-2 bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-400 rounded-lg transition-colors" title="Edit Result">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => handleDeleteResult(row.id)} className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-colors" title="Delete Result">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {viewingResult && (
                <AdminResultViewer
                    result={viewingResult}
                    onClose={() => setViewingResult(null)}
                />
            )}

            {editingResult && (
                <AdminResultEditor
                    result={editingResult}
                    onClose={() => setEditingResult(null)}
                    onSaved={() => {
                        setEditingResult(null);
                        fetchResults();
                    }}
                />
            )}
        </div>
    );
};
