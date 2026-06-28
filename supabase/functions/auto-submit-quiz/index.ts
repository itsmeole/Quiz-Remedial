import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.1-8b-instant';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function scoreEssayAnswers(questions, answers, correctAnswers, groqApiKey) {
  if (questions.length === 0) return { details: [], avgScore: 0 };
  const results = [];

  for (const q of questions) {
    const studentAnswer = (answers[q.id] || '').trim() || '(tidak dijawab)';
    const ref = correctAnswers[q.id];
    const hasRef = !!ref;

    const systemPrompt = hasRef
      ? 'Kamu adalah dosen yang menilai jawaban essay mahasiswa secara KETAT berdasarkan Jawaban Kunci. Balas HANYA dengan JSON, tanpa markdown, tanpa teks tambahan.'
      : 'Kamu adalah dosen yang menilai jawaban essay mahasiswa secara adil dan objektif. Balas HANYA dengan JSON, tanpa markdown, tanpa teks tambahan.';

    const userPrompt =
      `Soal: ${q.text}\n` +
      `Jawaban Mahasiswa: ${studentAnswer}\n` +
      (hasRef ? `Jawaban Kunci: ${ref}\n` : '') +
      `\nBerikan evaluasi dalam format JSON:\n` +
      `{\n  "score": <angka 0-100>,\n  "feedback": "<komentar 2-3 kalimat>",\n  "strengths": "<poin terpenuhi>",\n  "weaknesses": "<poin tidak terpenuhi atau '-'>",\n  "study_suggestions": ["<saran 1>", "<saran 2>", "<saran 3>"]\n}`;

    try {
      const resp = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
          temperature: 0.4,
          max_tokens: 600,
        }),
      });
      const data = await resp.json();
      const raw = data.choices?.[0]?.message?.content || '{}';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      results.push({
        questionId: q.id,
        score: Number(parsed.score) || 0,
        feedback: parsed.feedback || '',
        strengths: parsed.strengths || '-',
        weaknesses: parsed.weaknesses || '-',
        study_suggestions: Array.isArray(parsed.study_suggestions) ? parsed.study_suggestions : [],
      });
    } catch {
      results.push({ questionId: q.id, score: 0, feedback: 'Gagal menilai.', strengths: '-', weaknesses: '-', study_suggestions: [] });
    }
  }

  const avgScore = results.length > 0 ? results.reduce((s, r) => s + r.score, 0) / results.length : 0;
  return { details: results, avgScore };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { nim } = await req.json();
    if (!nim) return new Response(JSON.stringify({ error: 'nim is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: session, error: sessionError } = await supabase.from('quiz_sessions').select('*').eq('nim', nim).single();
    if (sessionError || !session) return new Response(JSON.stringify({ error: 'Session not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const answers = session.answers;
    const essayAnswers = session.essay_answers;
    const essayCorrectAnswers = session.essay_correct_answers;
    const questions = session.questions;
    const essayQuestions = questions.filter((q) => q.type === 'essay').map((q) => ({ id: q.id, text: q.text }));

    const { details: essayDetails, avgScore: essayScore } = groqApiKey
      ? await scoreEssayAnswers(essayQuestions, essayAnswers, essayCorrectAnswers, groqApiKey)
      : { details: [], avgScore: 0 };

    const { data: result, error: submitError } = await supabase.rpc('submit_quiz', {
      p_name: session.name, p_nim: session.nim, p_class: session.class, p_subject: session.subject,
      p_answers: answers, p_essay_answers: essayAnswers, p_essay_score: essayScore,
      p_pg_weight: 0.7, p_essay_weight: 0.3,
    });

    if (submitError) return new Response(JSON.stringify({ error: submitError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    if (result?.id) {
      await supabase.from('quiz_results').update({ ai_suggestion: JSON.stringify({ suggestions: [], essayDetails }) }).eq('id', result.id);
    }

    await supabase.from('quiz_sessions').delete().eq('nim', nim);

    return new Response(JSON.stringify({ success: true, result }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('auto-submit-quiz error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
