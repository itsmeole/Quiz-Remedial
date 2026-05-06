import React, { useEffect, useState } from 'react';
import { subjectService } from '../services/subjectService';
import type { Subject } from '../types';
import { Plus, Edit, Trash2, ArrowLeft } from 'lucide-react';

interface SubjectManagerProps {
  onBack?: () => void;
}

export const SubjectManager: React.FC<SubjectManagerProps> = ({ onBack }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const fetchSubjects = async () => {
    setLoading(true);
    setError(null);
    const data = await subjectService.getSubjects();
    setSubjects(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const resetForm = () => {
    setEditingSubject(null);
    setCode('');
    setName('');
    setDescription('');
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code.trim() || !name.trim()) {
      setError('Kode dan nama mata kuliah wajib diisi.');
      return;
    }

    const normalizedCode = code.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const subjectPayload = {
      code: normalizedCode,
      name: name.trim(),
      description: description.trim() || undefined,
    };

    const ok = editingSubject
      ? await subjectService.updateSubject(editingSubject.id, subjectPayload)
      : await subjectService.addSubject(subjectPayload);

    if (!ok) {
      setError('Gagal menyimpan mata kuliah. Pastikan kode belum dipakai.');
      return;
    }

    resetForm();
    setShowForm(false);
    fetchSubjects();
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setCode(subject.code);
    setName(subject.name);
    setDescription(subject.description || '');
    setShowForm(true);
  };

  const handleDelete = async (subjectId: number) => {
    if (!confirm('Hapus mata kuliah ini? Semua soal terkait tidak akan otomatis terhapus.')) return;
    const ok = await subjectService.deleteSubject(subjectId);
    if (!ok) {
      setError('Gagal menghapus mata kuliah.');
      return;
    }
    fetchSubjects();
  };

  return (
    <div className="min-h-screen pt-20 p-6 max-w-7xl mx-auto flex flex-col">
      <div className="glass-panel p-8 w-full">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-400 to-gray-400 bg-clip-text text-transparent mb-2">
              Subject Manager
            </h2>
            <p className="text-gray-300">Tambah, edit, dan hapus mata kuliah untuk ujian.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <ArrowLeft size={16} /> Kembali
              </button>
            )}
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus size={16} /> Tambah Subject
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {showForm && (
          <div className="mb-6 p-6 bg-gray-900/70 border border-gray-700 rounded-xl">
            <h3 className="text-xl font-semibold text-white mb-4">
              {editingSubject ? 'Edit Mata Kuliah' : 'Tambah Mata Kuliah Baru'}
            </h3>
            <form onSubmit={handleCreateOrUpdate} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300">Kode Matkul</label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-gray-900/80 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="contoh: linear-algebra"
                />
                <p className="text-xs text-gray-500 mt-1">Kode harus unik, huruf kecil dan tanpa spasi.</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300">Nama Matkul</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-900/80 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="contoh: Aljabar Linear"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300">Deskripsi (opsional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gray-900/80 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-none"
                  placeholder="Deskripsi singkat matkul"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold transition-colors"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-5 py-3 rounded-lg transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading subjects...</div>
        ) : subjects.length === 0 ? (
          <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 p-6 rounded-xl text-center">
            Belum ada mata kuliah terdaftar. Tambahkan mata kuliah terlebih dahulu.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-sm uppercase tracking-wider">
                  <th className="p-4">ID</th>
                  <th className="p-4">Kode</th>
                  <th className="p-4">Nama</th>
                  <th className="p-4">Deskripsi</th>
                  <th className="p-4">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject) => (
                  <tr key={subject.id} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                    <td className="p-4 font-mono text-gray-300">{subject.id}</td>
                    <td className="p-4 text-white font-semibold">{subject.code}</td>
                    <td className="p-4 text-gray-200">{subject.name}</td>
                    <td className="p-4 text-gray-400">{subject.description || '-'}</td>
                    <td className="p-4 space-x-2">
                      <button
                        onClick={() => handleEdit(subject)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(subject.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
