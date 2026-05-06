import React, { useState, useEffect, useRef } from 'react';
import type { UserData, Student, Subject } from '../types';
import { BookOpen, User, CreditCard, Users, ChevronRight, Search, Loader2, AlertCircle } from 'lucide-react';
import { studentService } from '../services/studentService';
import { subjectService } from '../services/subjectService';

interface WelcomeScreenProps {
    onStart: (data: UserData) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
    const [name, setName] = useState('');
    const [nim, setNim] = useState('');
    const [kelas, setKelas] = useState('Pagi A');
    const [subject, setSubject] = useState<string>('');
    const [subjectsList, setSubjectsList] = useState<Subject[]>([]);
    const [loadingSubjects, setLoadingSubjects] = useState(true);
    
    // Autocomplete states
    const [suggestions, setSuggestions] = useState<Student[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Handle clicking outside of suggestions dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch subjects on mount
    useEffect(() => {
        const fetchSubjects = async () => {
            setLoadingSubjects(true);
            const data = await subjectService.getSubjects();
            setSubjectsList(data);
            if (data.length > 0) {
                setSubject(data[0].code);
            }
            setLoadingSubjects(false);
        };
        fetchSubjects();
    }, []);

    // Effect for searching students as user types name
    useEffect(() => {
        const searchTimer = setTimeout(async () => {
            if (name.length >= 3 && showSuggestions) {
                setIsSearching(true);
                const results = await studentService.searchStudents(name);
                setSuggestions(results);
                setIsSearching(false);
            } else {
                setSuggestions([]);
            }
        }, 300);

        return () => clearTimeout(searchTimer);
    }, [name, showSuggestions]);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/[^a-zA-Z\s]/g, ''); // Hanya huruf dan spasi
        setName(val);
        setShowSuggestions(true);
        setError(null);
    };

    const handleNimChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/[^0-9]/g, ''); // Hanya angka
        setNim(val);
        setError(null);
    };

    const selectStudent = (student: Student) => {
        setName(student.name);
        setNim(student.nim);
        setKelas(student.class);
        setShowSuggestions(false);
        setSuggestions([]);
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name || !nim || !kelas) {
            setError("Harap isi semua data diri.");
            return;
        }

        if (!subject) {
            setError("Harap pilih mata kuliah.");
            return;
        }

        // Verifikasi terakhir: apakah mahasiswa ada di database?
        const student = await studentService.getStudentByNim(nim);
        
        if (!student || student.name.toLowerCase() !== name.toLowerCase()) {
            setError("Data mahasiswa tidak ditemukan.");
            return;
        }

        onStart({ name, nim, class: kelas, subject });
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass-panel w-full max-w-md p-8 relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full translate-x-1/2 translate-y-1/2 blur-2xl"></div>

                <div className="relative z-10">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 mb-4 text-blue-400">
                            <BookOpen size={32} />
                        </div>
                        <h1 className="text-3xl font-bold mb-2">Quiz Anti Cheat</h1>
                        <p className="text-gray-400">Sistem Pengujian Kompetensi Mahasiswa</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg mb-6 flex items-start gap-3 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                            <AlertCircle size={18} className="shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Nama Input Wrapper for Dropdown */}
                        <div className="space-y-2 relative" ref={dropdownRef}>
                            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                <User size={16} /> Nama Lengkap
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={handleNameChange}
                                    className="w-full bg-gray-900/20 border border-gray-500/50 rounded-lg pl-4 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white placeholder-gray-600 uppercase"
                                    placeholder=""
                                    autoComplete="off"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                                    {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                                </div>
                            </div>

                            {/* Suggestions Dropdown */}
                            {showSuggestions && (suggestions.length > 0 || isSearching) && (
                                <div className="absolute z-50 w-full mt-1 bg-[#1a1c1e] border border-gray-700 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl">
                                    {isSearching ? (
                                        <div className="p-4 text-center text-sm text-gray-500 italic">Mencari...</div>
                                    ) : (
                                        <ul className="max-h-60 overflow-y-auto">
                                            {suggestions.map((s) => (
                                                <li key={s.id}>
                                                    <button
                                                        type="button"
                                                        onClick={() => selectStudent(s)}
                                                        className="w-full px-4 py-3 text-left hover:bg-blue-600/10 transition-colors border-b border-gray-800 last:border-0"
                                                    >
                                                        <div className="text-sm font-bold text-white uppercase">{s.name}</div>
                                                        <div className="text-xs text-gray-500 font-mono mt-0.5">{s.nim} • {s.class}</div>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* NIM Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                <CreditCard size={16} /> NIM
                            </label>
                            <input
                                type="text"
                                required
                                value={nim}
                                onChange={handleNimChange}
                                className="w-full bg-gray-900/20 border border-gray-500/50 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white placeholder-gray-600 font-mono"
                                placeholder=""
                            />
                        </div>

                        {/* Kelas Selection */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                <Users size={16} /> Kelas
                            </label>
                            <select
                                value={kelas}
                                onChange={(e) => setKelas(e.target.value)}
                                className="w-full bg-gray-900/20 border border-gray-500/50 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white appearance-none"
                            >
                                <option value="Pagi A">Pagi A</option>
                                <option value="Pagi B">Pagi B</option>
                                <option value="Pagi C">Pagi C</option>
                                <option value="Malam A">Malam A</option>
                                <option value="Malam B">Malam B</option>
                            </select>
                        </div>

                        {/* Mata Kuliah (Subject) - Dropdown */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                <BookOpen size={16} /> Mata Kuliah
                            </label>
                            {loadingSubjects ? (
                                <div className="w-full bg-gray-900/20 border border-gray-500/50 rounded-lg px-4 py-3 text-gray-400">
                                    Memuat mata kuliah...
                                </div>
                            ) : subjectsList.length === 0 ? (
                                <div className="w-full bg-red-900/20 border border-red-500/50 rounded-lg px-4 py-3 text-red-400">
                                    Belum ada mata kuliah yang tersedia.
                                </div>
                            ) : (
                                <select
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full bg-gray-900/20 border border-gray-500/50 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white appearance-none"
                                >
                                    {subjectsList.map((subj) => (
                                        <option key={subj.code} value={subj.code} className="bg-gray-900 text-white">
                                            {subj.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            Konfirmasi & Mulai <ChevronRight size={20} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
