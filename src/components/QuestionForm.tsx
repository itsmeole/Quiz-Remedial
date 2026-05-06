import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import type { Question, Subject } from '../types';
import { Save, X, Plus, Trash2 } from 'lucide-react';

interface QuestionFormProps {
  question?: Question | null;
  subjects: Subject[];
  onClose: () => void;
}

export const QuestionForm: React.FC<QuestionFormProps> = ({ question, subjects, onClose }) => {
  const [text, setText] = useState('');
  const [type, setType] = useState<'multiple-choice' | 'essay'>('multiple-choice');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (question) {
      setText(question.text);
      setType(question.type || 'multiple-choice');
      setOptions(Array.isArray(question.options) ? question.options : ['', '', '', '']);
      setCorrectIndex(question.correctIndex || 0);
      setCorrectAnswer(question.correct_answer || '');
      setSubject(question.subject || '');
    }
  }, [question]);

  useEffect(() => {
    if (!question && subjects.length > 0) {
      setSubject((prev) => prev || subjects[0].code);
    }
  }, [subjects, question]);

  const handleAddOption = () => setOptions([...options, '']);

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      if (correctIndex >= newOptions.length) setCorrectIndex(newOptions.length - 1);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!text.trim()) { setError('Question text is required'); setLoading(false); return; }
    if (!subject) { setError('Please choose a subject.'); setLoading(false); return; }

    if (type === 'multiple-choice') {
      const validOptions = options.filter(opt => opt.trim() !== '');
      if (validOptions.length < 2) { setError('At least 2 options are required'); setLoading(false); return; }
      if (correctIndex >= validOptions.length) { setError('Please select a valid correct answer'); setLoading(false); return; }
    } else if (type === 'essay') {
      if (!correctAnswer.trim()) { setError('Reference answer is required for essay questions'); setLoading(false); return; }
    }

    if (!supabase) { setError('Supabase client not available'); setLoading(false); return; }

    try {
      const validOptions = type === 'multiple-choice' ? options.filter(opt => opt.trim() !== '') : [];
      const questionData = {
        text: text.trim(),
        type,
        options: validOptions,
        subject,
        correct_index: type === 'multiple-choice' ? correctIndex : 0,
        correct_answer: type === 'essay' ? correctAnswer.trim() : null
      };
      if (question) {
        const { error } = await supabase.from('questions').update(questionData).eq('id', question.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('questions').insert([questionData]);
        if (error) throw error;
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save question');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen pt-20 p-6 max-w-4xl mx-auto flex flex-col">
      <div className="glass-panel p-8 w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-400 to-gray-400 bg-clip-text text-transparent">
            {question ? 'Edit Question' : 'Add New Question'}
          </h2>
          <button onClick={onClose} className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {question && (
          <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <label className="text-white font-medium">Question ID (Auto-generated)</label>
            </div>
            <div className="font-mono text-gray-300 bg-gray-900/50 p-2 rounded border">{question.id}</div>
            <p className="text-gray-400 text-sm mt-1">ID ini di-generate otomatis dan tidak dapat diubah</p>
          </div>
        )}

        {!question && (
          <div className="mb-6 p-4 bg-green-800/20 rounded-lg border border-green-700/50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <label className="text-white font-medium">ID akan di-generate otomatis</label>
            </div>
            <p className="text-gray-300 text-sm">Setiap soal baru akan mendapat ID unik secara otomatis oleh sistem</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="bg-red-500/20 border border-red-500 text-red-200 p-4 rounded-lg">Error: {error}</div>}

          <div>
            <label className="block text-white font-medium mb-2">Subject</label>
            {subjects.length === 0 ? (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg py-3 px-4 text-yellow-200">
                Tambahkan mata kuliah terlebih dahulu di panel admin.
              </div>
            ) : (
              <select value={subject} onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {subjects.map((subj) => (
                  <option key={subj.code} value={subj.code} className="bg-gray-900">{subj.name}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Question Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as 'multiple-choice' | 'essay')}
              className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="multiple-choice" className="bg-gray-900">Pilihan Ganda (PG)</option>
              <option value="essay" className="bg-gray-900">Essay</option>
            </select>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Question Text</label>
            <textarea value={text} onChange={(e) => setText(e.target.value)} required
              className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-vertical"
              placeholder="Enter your question here..." />
          </div>

          {type === 'multiple-choice' && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-white font-medium">Answer Options</label>
                <button type="button" onClick={handleAddOption}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1">
                  <Plus size={14} /> Add Option
                </button>
              </div>
              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input type="radio" name="correct-answer" checked={correctIndex === index}
                      onChange={() => setCorrectIndex(index)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500" />
                    <input type="text" value={option} onChange={(e) => handleOptionChange(index, e.target.value)}
                      className="flex-1 bg-white/10 border border-white/20 rounded-lg py-2 px-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Option ${index + 1}`} />
                    {options.length > 2 && (
                      <button type="button" onClick={() => handleRemoveOption(index)}
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-gray-400 text-sm mt-2">Select the radio button next to the correct answer</p>
            </div>
          )}

          {type === 'essay' && (
            <div>
              <label className="block text-white font-medium mb-2">Reference Answer (for AI Scoring)</label>
              <textarea value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} required
                className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-vertical"
                placeholder="Enter the correct or reference answer here for AI grading..." />
              <p className="text-gray-400 text-sm mt-2">This answer will be used as a reference by the AI when grading student essays.</p>
            </div>
          )}

          <div className="flex gap-4 pt-6">
            <button type="submit" disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center gap-2 disabled:cursor-not-allowed">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
              ) : (
                <><Save size={16} />{question ? 'Update Question' : 'Save Question'}</>
              )}
            </button>
            <button type="button" onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
