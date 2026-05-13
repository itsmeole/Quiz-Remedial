-- ============================================================
-- MIGRATION: RPC untuk update hasil ujian oleh admin
-- ============================================================
-- Fungsi ini diperlukan karena RLS memblokir UPDATE langsung
-- dari client. SECURITY DEFINER memungkinkan fungsi berjalan
-- dengan hak akses penuh tanpa terhambat RLS.
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_update_quiz_result(
    p_id UUID,
    p_name TEXT,
    p_nim TEXT,
    p_score DOUBLE PRECISION,
    p_essay_score DOUBLE PRECISION,
    p_passed BOOLEAN,
    p_ai_suggestion TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.quiz_results
    SET
        name          = p_name,
        nim           = p_nim,
        score         = p_score,
        essay_score   = p_essay_score,
        passed        = p_passed,
        ai_suggestion = p_ai_suggestion
    WHERE id = p_id;
END;
$$;

-- ============================================================
-- Fungsi untuk menghapus hasil ujian oleh admin
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_delete_quiz_result(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.quiz_results WHERE id = p_id;
END;
$$;
