import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { QuestionForm } from './QuestionForm';
import { subjectService } from '../services/subjectService';
import type { Question, Subject } from '../types';
import { Plus, Edit, Trash2, RefreshCw, ArrowLeft } from 'lucide-react';

interface QuestionManagerProps {
  onBack?: () => void;
}

export const QuestionManager: React.FC<QuestionManagerProps> = ({ onBack }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const fetchSubjects = async () => {
    setLoadingSubjects(true);
    const data = await subjectService.getSubjects();
    setSubjects(data);
    if (data.length > 0 && !selectedSubject) {
      setSelectedSubject(data[0].code);
    }
    setLoadingSubjects(false);
  };

  const fetchQuestions = async (subjectCode: string) => {
    setLoading(true);
    setError(null);
    if (!supabase) { setError('Supabase client not available'); setLoading(false); return; }

    try {
      const { data, error } = await supabase
        .from('questions')
        .select('id, text, type, options, subject, correct_index, correct_answer')
        .eq('subject', subjectCode);

      if (error) {
        setError(error.message);
      } else {
        setQuestions(
          (data || []).map((q: any) => ({ ...q, correctIndex: q.correct_index, correct_answer: q.correct_answer }))
        );
      }
    } catch {
      setError('Failed to fetch questions');
    }
    setLoading(false);
  };

  useEffect(() => { fetchSubjects(); }, []);
  useEffect(() => { if (selectedSubject) fetchQuestions(selectedSubject); }, [selectedSubject]);

  const handleDelete = async (questionId: number) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    if (!supabase) return;

    try {
      const { error } = await supabase.from('questions').delete().eq('id', questionId);
      if (error) setError(error.message);
      else setQuestions(questions.filter(q => q.id !== questionId));
    } catch {
      setError('Failed to delete question');
    }
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingQuestion(null);
    if (selectedSubject) fetchQuestions(selectedSubject);
    fetchSubjects();
  };

  if (showForm) {
    return <QuestionForm question={editingQuestion} onClose={handleFormClose} subjects={subjects} />;
  }

  return (
    <div className="min-h-screen pt-20 p-6 max-w-7xl mx-auto flex flex-col">
      <div className="glass-panel p-8 w-full">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-400 to-gray-400 bg-clip-text text-transparent mb-2">
              Question Manager
            </h2>
            <p className="text-gray-300">Manage quiz questions • <span className="text-green-400">ID auto-generated</span></p>
          </div>
          <div className="flex gap-4 flex-wrap">
            <button onClick={() => selectedSubject && fetchQuestions(selectedSubject)} disabled={!selectedSubject}
              className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors">
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => setShowForm(true)} disabled={subjects.length === 0}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
              <Plus size={16} /> Add Question
            </button>
            {onBack && (
              <button onClick={onBack}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                <ArrowLeft size={16} /> Back to Dashboard
              </button>
            )}
          </div>
        </div>

        {/* Subject Filter */}
        <div className="mb-6">
          {loadingSubjects ? (
            <div className="text-gray-400">Memuat mata kuliah...</div>
          ) : subjects.length === 0 ? (
            <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 px-4 py-3 rounded-lg">
              Belum ada mata kuliah tersedia. Tambahkan subject di panel admin.
            </div>
          ) : (
            <div className="max-w-xs">
              <label className="block text-sm font-medium text-gray-400 mb-2">Pilih Mata Kuliah</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {subjects.map((subjectItem) => (
                  <option key={subjectItem.code} value={subjectItem.code}>
                    {subjectItem.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 p-4 rounded-lg mb-6">
            Error: {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading questions...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-sm uppercase tracking-wider">
                  <th className="p-4">ID</th>
                  <th className="p-4">Question</th>
                  <th className="p-4">Options</th>
                  <th className="p-4">Correct Answer</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      Soal belum dibuat untuk mata kuliah ini.
                    </td>
                  </tr>
                ) : (
                  questions.map((question) => (
                    <tr key={question.id} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                      <td className="p-4">
                        <div className="font-mono text-sm text-gray-400 bg-gray-900/50 px-2 py-1 rounded">{question.id}</div>
                      </td>
                      <td className="p-4 max-w-md">
                        <div className="text-white font-medium truncate" title={question.text}>{question.text}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-gray-300 text-sm">
                          {question.type === 'essay' ? 'Essay' : `${Array.isArray(question.options) ? question.options.length : 0} options`}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-green-400 font-medium truncate max-w-[200px]" title={question.type === 'essay' ? question.correct_answer : ''}>
                          {question.type === 'essay'
                            ? (question.correct_answer || 'N/A')
                            : (Array.isArray(question.options) && question.correctIndex !== undefined
                              ? question.options[question.correctIndex]
                              : 'N/A')}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(question)}
                            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded transition-colors" title="Edit">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDelete(question.id)}
                            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded transition-colors" title="Delete">
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
    </div>
  );
};
