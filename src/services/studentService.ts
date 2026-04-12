import { supabase } from '../utils/supabaseClient';
import type { Student } from '../types';

export const studentService = {
    /**
     * Mencari mahasiswa berdasarkan nama (hint/autocomplete)
     * Minimal 3 karakter untuk meminimalkan beban database
     */
    async searchStudents(query: string): Promise<Student[]> {
        if (!supabase || query.length < 3) return [];

        const { data, error } = await supabase
            .from('students')
            .select('*')
            .ilike('name', `%${query}%`)
            .limit(5) // Batasi 5 hasil saja untuk dropdown
            .order('name', { ascending: true });

        if (error) {
            console.error('Error searching students:', error);
            return [];
        }

        return data || [];
    },

    /**
     * Mendapatkan data mahasiswa berdasarkan NIM
     */
    async getStudentByNim(nim: string): Promise<Student | null> {
        if (!supabase) return null;

        const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('nim', nim)
            .maybeSingle();

        if (error) {
            console.error('Error fetching student by NIM:', error);
            return null;
        }

        return data;
    }
};
