import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import type { QuizResult } from '../types';
import { Download, RefreshCw } from 'lucide-react';

export const AdminScreen: React.FC = () => {
    const [results, setResults] = useState<QuizResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchResults = async () => {
        setLoading(true);
        if (!supabase) {
            const url = import.meta.env.VITE_SUPABASE_URL;
            const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
            let msg = "Supabase client not initialized.";
            if (!url) msg += " Missing VITE_SUPABASE_URL.";
            if (!key) msg += " Missing VITE_SUPABASE_ANON_KEY.";

            console.log("Debug Env:", { url, key }); // For user to check console
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

    useEffect(() => {
        fetchResults();
    }, []);

    const handleExport = () => {
        // Simple CSV export
        const headers = ["Date", "Name", "NIM", "Class", "Score", "Result"];
        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + results.map(row => {
                const date = new Date(row.created_at).toLocaleString();
                return `"${date}","${row.name}","${row.nim}","${row.class}","${row.score}","${row.passed ? 'PASSED' : 'FAILED'}"`;
            }).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "quiz_results.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen pt-20 p-6 max-w-7xl mx-auto flex flex-col">
            <div className="glass-panel p-8 w-full">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-400 to-gray-400 bg-clip-text text-transparent">
                        Admin Dashboard
                    </h2>
                    <div className="flex gap-4">
                        <button
                            onClick={fetchResults}
                            className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors"
                        >
                            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <button
                            onClick={handleExport}
                            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow-lg"
                        >
                            <Download size={20} /> Export CSV
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
                                    <th className="p-4">Name</th>
                                    <th className="p-4">NIM</th>
                                    <th className="p-4">Class</th>
                                    <th className="p-4">Score</th>
                                    <th className="p-4">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-500">
                                            No results found yet.
                                        </td>
                                    </tr>
                                ) : (
                                    results.map((row) => (
                                        <tr key={row.id} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                                            <td className="p-4 text-sm text-gray-300">
                                                {new Date(row.created_at).toLocaleString()}
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
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
