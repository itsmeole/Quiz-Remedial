import React, { useState } from 'react';
import type { UserData } from '../types';
import { BookOpen, User, CreditCard, Users, ChevronRight } from 'lucide-react';

interface WelcomeScreenProps {
    onStart: (data: UserData) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
    const [name, setName] = useState('');
    const [nim, setNim] = useState('');
    const [kelas, setKelas] = useState('Pagi A');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && nim && kelas) {
            onStart({ name, nim, class: kelas });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass-panel w-full max-w-md p-8 relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-white-500/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-white-500/10 rounded-full translate-x-1/2 translate-y-1/2 blur-2xl"></div>

                <div className="relative z-10">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-500/20 mb-4 text-white-400">
                            <BookOpen size={32} />
                        </div>
                        <h1 className="text-3xl font-bold mb-2">Linear Algebra Quiz</h1>
                        <p className="text-gray-400">Silahkan isi data diri untuk memulai.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                <User size={16} /> Nama Lengkap
                            </label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-gray-900/20 border border-gray-500/50 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white-500 transition-all text-white placeholder-gray-600"
                                placeholder="Masukkan nama anda"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                <CreditCard size={16} /> NIM
                            </label>
                            <input
                                type="text"
                                required
                                value={nim}
                                onChange={(e) => setNim(e.target.value)}
                                className="w-full bg-gray-900/20 border border-gray-500/50 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white-500 transition-all text-white placeholder-gray-600"
                                placeholder="Masukkan NIM anda"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                <Users size={16} /> Kelas
                            </label>
                            <select
                                value={kelas}
                                onChange={(e) => setKelas(e.target.value)}
                                className="w-full bg-gray-900/20 border border-gray-500/50 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white-500 transition-all text-white appearance-none"
                            >
                                <option value="Pagi A">Pagi A</option>
                                <option value="Pagi B">Pagi B</option>
                                <option value="Pagi C">Pagi C</option>
                                <option value="Malam A">Malam A</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            Mulai Quiz <ChevronRight size={20} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
