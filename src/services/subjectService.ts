import { supabase } from '../utils/supabaseClient';
import type { Subject } from '../types';

export const subjectService = {
  async getSubjects(): Promise<Subject[]> {
    if (!supabase) {
      console.error('❌ Supabase client not initialized');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error('❌ Error fetching subjects:', error.message);
        return [];
      }

      console.log('✅ Subjects loaded:', data);
      return (data || []) as Subject[];
    } catch (err) {
      console.error('❌ Exception fetching subjects:', err);
      return [];
    }
  },

  async getSubjectByCode(code: string): Promise<Subject | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('code', code)
      .maybeSingle();

    if (error) {
      console.error('Error fetching subject by code:', error);
      return null;
    }

    return data as Subject | null;
  },

  async addSubject(subject: { code: string; name: string; description?: string }) {
    if (!supabase) return false;

    const { error } = await supabase
      .from('subjects')
      .insert([subject]);

    if (error) {
      console.error('Error creating subject:', error);
      return false;
    }

    return true;
  },

  async updateSubject(id: number, subject: { code: string; name: string; description?: string }) {
    if (!supabase) return false;

    const { error } = await supabase
      .from('subjects')
      .update(subject)
      .eq('id', id);

    if (error) {
      console.error('Error updating subject:', error);
      return false;
    }

    return true;
  },

  async deleteSubject(id: number) {
    if (!supabase) return false;

    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting subject:', error);
      return false;
    }

    return true;
  }
};
