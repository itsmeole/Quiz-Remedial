
import { useState, useEffect } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { QuizScreen } from './components/QuizScreen';
import { ReviewScreen } from './components/ReviewScreen';
import { ResultScreen } from './components/ResultScreen';
import { AdminScreen } from './components/AdminScreen';
import type { UserData, GameState, Question, EssayScoreResult } from './types';
import { quizService } from './services/quizService';
import { groqService } from './services/groqService';
import { supabase } from './utils/supabaseClient';
import bgImage from './assets/bg.png';

const MAX_STRIKES = 5;

function App() {
  const [gameState, setGameState] = useState<GameState>('WELCOME');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [essayAnswers, setEssayAnswers] = useState<Record<number, string>>({});
  const [essayCorrectAnswers, setEssayCorrectAnswers] = useState<Record<number, string>>({});
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(3600);

  // Result states
  const [finalScore, setFinalScore] = useState(0);
  const [pgScore, setPgScore] = useState(0);
  const [essayScore, setEssayScore] = useState(0);
  const [pgCorrectCount, setPgCorrectCount] = useState(0);
  const [pgTotalQuestions, setPgTotalQuestions] = useState(0);
  const [essayTotalQuestions, setEssayTotalQuestions] = useState(0);
  const [essayScoreDetails, setEssayScoreDetails] = useState<EssayScoreResult[]>([]);
  const [pgAnswersDetail, setPgAnswersDetail] = useState<Array<{ question_id: number; question_text: string; is_correct: boolean }>>([]);
  const [aiSuggestion, setAiSuggestion] = useState<string[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [resultId, setResultId] = useState<string | null>(null);
  const [isPassed, setIsPassed] = useState(false);
  const [createdAt, setCreatedAt] = useState<string>('');

  // Weight config (hardcoded 70/30)
  const pgWeight = 70 / 100;
  const essayWeight = 30 / 100;

  // Route detection on load
  useEffect(() => {
    const path = window.location.pathname;

    if (path === '/data') {
      setGameState('ADMIN');
      return;
    }

    const resultMatch = path.match(/^\/result\/([0-9a-f-]{36})$/i);
    if (resultMatch) {
      const id = resultMatch[1];
      quizService.getResultById(id).then((result) => {
        if (result) {
          setFinalScore(result.score);
          setPgScore(result.pg_score ?? result.score);
          setEssayScore(result.essay_score ?? 0);
          setPgCorrectCount(result.pg_correct_count ?? result.correct_count ?? 0);
          setPgTotalQuestions(result.pg_total_questions ?? result.total_questions ?? 0);
          setPgAnswersDetail((result.pg_answers_detail as any) ?? []);
          
          const parsedAi = result.ai_suggestion ? JSON.parse(result.ai_suggestion) : null;
          if (Array.isArray(parsedAi)) {
            setAiSuggestion(parsedAi);
          } else if (parsedAi && parsedAi.suggestions) {
            setAiSuggestion(parsedAi.suggestions);
            setEssayScoreDetails(parsedAi.essayDetails || []);
          } else {
            setAiSuggestion([]);
          }

          setEssayAnswers((result.essay_answers as Record<number, string>) ?? {});
          const essayTotal = result.pg_total_questions != null
            ? (result.total_questions ?? 0) - result.pg_total_questions 
            : Object.keys((result.essay_answers as Record<number, string>) ?? {}).length;
          setEssayTotalQuestions(essayTotal);
          setResultId(id);
          setIsPassed(result.passed);
          setCreatedAt(result.created_at);
          setUserData({
            name: result.name,
            nim: result.nim,
            class: result.class,
            subject: result.subject as 'linear-algebra' | 'calculus',
          });
          setGameState('RESULT');
        } else {
          // Result not found — go to welcome
          window.history.replaceState({}, '', '/');
        }
      });
    }
  }, []);

  const handleStart = async (data: UserData) => {
    setBlockedReason(null);
    setTimeLeft(3600);

    if (supabase) {
      const { data: passedData } = await supabase
        .from('quiz_results')
        .select('*')
        .eq('nim', data.nim)
        .eq('passed', true)
        .limit(1);

      if (passedData && passedData.length > 0) {
        // Offer to view their result
        const existingResult = passedData[0];
        if (existingResult.id) {
          setBlockedReason(`Anda sudah lulus remedial ini sebelumnya. Tidak perlu mengerjakan lagi. Klik tutup dan akses nilai Anda di: ${window.location.origin}/result/${existingResult.id}`);
        } else {
          setBlockedReason('Anda sudah lulus remedial ini sebelumnya. Tidak perlu mengerjakan lagi.');
        }
        return;
      }

      const { count, error } = await supabase
        .from('quiz_results')
        .select('*', { count: 'exact', head: true })
        .eq('nim', data.nim)
        .eq('passed', false);

      if (error) {
        setBlockedReason('Terjadi kesalahan saat memeriksa data. Silakan coba lagi.');
        return;
      }

      if (count !== null && count >= MAX_STRIKES) {
        setBlockedReason('Anda telah mencapai jumlah maksimum percobaan. Silahkan hubungi dosen pengampu atau asisten dosen untuk membuka akses.');
        return;
      }
    }

    const questions = await quizService.getQuestions(data.subject);
    if (!questions || questions.length === 0) {
      setBlockedReason('Gagal memuat soal. Periksa koneksi internet atau hubungi admin.');
      return;
    }

    // Fetch essay correct answers (untuk referensi AI scoring)
    const essayRefAnswers = await quizService.getEssayCorrectAnswers(data.subject);

    // Shuffle: PG questions shuffled, essay appended at end
    const pgQuestions = questions.filter(q => q.type === 'multiple-choice').sort(() => Math.random() - 0.5);
    const essayQuestions = questions.filter(q => q.type === 'essay');
    setShuffledQuestions([...pgQuestions, ...essayQuestions]);
    setEssayCorrectAnswers(essayRefAnswers);

    localStorage.setItem('quiz_active', 'true');
    localStorage.setItem('quiz_userData', JSON.stringify(data));
    localStorage.setItem('quiz_answers', '{}');

    setUserData(data);
    setAnswers({});
    setEssayAnswers({});
    setGameState('QUIZ');
  };

  const handleAnswer = (questionId: number, answerIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerIndex }));
  };

  const handleEssayAnswer = (questionId: number, text: string) => {
    setEssayAnswers(prev => ({ ...prev, [questionId]: text }));
  };

  const handleQuizFinish = () => setGameState('REVIEW');
  const handleReviewBack = () => setGameState('QUIZ');

  const handleSubmit = async () => {
    if (!userData) return;

    try {
      const essayQuestions = shuffledQuestions
        .filter(q => q.type === 'essay')
        .map(q => ({ id: q.id, text: q.text }));

      // Step 1: Score essays with Groq (if any)
      let essayScoreVal = 0;
      let essayDetails: EssayScoreResult[] = [];

      if (essayQuestions.length > 0) {
        try {
          essayDetails = await groqService.scoreEssayAnswers(
            essayQuestions,
            essayAnswers,
            essayCorrectAnswers   // jawaban referensi dosen
          );
          if (essayDetails.length > 0) {
            essayScoreVal = essayDetails.reduce((sum, r) => sum + r.score, 0) / essayDetails.length;
          }
        } catch (e) {
          console.error('Essay scoring failed, continuing with 0:', e);
        }
      }

      // Step 2: Submit to Supabase (server-side PG grading)
      const result = await quizService.submitQuiz(
        userData,
        answers,
        essayAnswers,
        essayScoreVal,
        pgWeight,
        essayWeight
      );

      if (result) {
        setFinalScore(result.score);
        setPgScore(result.pg_score);
        setEssayScore(essayScoreVal);
        setPgCorrectCount(result.correct_count);
        setPgTotalQuestions(result.total_questions);
        setEssayTotalQuestions(essayQuestions.length);
        setEssayScoreDetails(essayDetails);
        setPgAnswersDetail(result.pg_answers_detail ?? []);
        setResultId(result.id);
        setIsPassed(result.passed);
        setCreatedAt(new Date().toISOString());
        window.history.pushState({}, '', `/result/${result.id}`);
      }

      // Clear session
      localStorage.removeItem('quiz_active');
      localStorage.removeItem('quiz_userData');
      localStorage.removeItem('quiz_answers');

      // Step 3: Show result immediately
      setGameState('RESULT');

      // Step 4: Generate AI suggestion in background
      if (result) {
        setIsLoadingAI(true);
        groqService
          .generateSuggestion(
            result.pg_score,
            essayScoreVal,
            result.score,
            userData.subject,
            result.passed,
            result.pg_answers_detail ?? [],
            essayDetails.flatMap(d => d.study_suggestions ?? [])
          )
          .then(async (suggestions) => {
            setAiSuggestion(suggestions);
            setIsLoadingAI(false);
            await quizService.updateAiSuggestion(result.id, JSON.stringify({
              suggestions: suggestions,
              essayDetails: essayDetails
            }));
          })
          .catch((e) => {
            console.error('AI suggestion failed:', e);
            setIsLoadingAI(false);
          });
      }
    } catch (err) {
      console.error('Failed to submit:', err);
      if (err instanceof Error && err.message !== 'Auto-submit') {
        alert('Gagal menyimpan jawaban. Coba lagi.');
        return;
      }
      setGameState('RESULT');
    }
  };

  // Timer Logic (Global)
  useEffect(() => {
    if ((gameState === 'QUIZ' || gameState === 'REVIEW') && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState, timeLeft]);

  const handleRetry = () => {
    setGameState('WELCOME');
    setAnswers({});
    setEssayAnswers({});
    setEssayCorrectAnswers({});
    setPgAnswersDetail([]);
    setAiSuggestion([]);
    setEssayTotalQuestions(0);
    setCreatedAt('');
    setFinalScore(0);
    setPgScore(0);
    setEssayScore(0);
    setEssayScoreDetails([]);
    setResultId(null);
    setIsPassed(false);
    setUserData(null);
    setShuffledQuestions([]);
    setTimeLeft(3600);
    localStorage.removeItem('quiz_active');
    localStorage.removeItem('quiz_userData');
    localStorage.removeItem('quiz_answers');
    window.history.replaceState({}, '', '/');
  };

  return (
    <div
      className="min-h-screen text-white font-sans antialiased"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {gameState === 'WELCOME' && <WelcomeScreen onStart={handleStart} />}

      {gameState === 'QUIZ' && (
        <QuizScreen
          questions={shuffledQuestions}
          answers={answers}
          essayAnswers={essayAnswers}
          onAnswer={handleAnswer}
          onEssayAnswer={handleEssayAnswer}
          onFinish={handleQuizFinish}
          onAutoSubmit={handleSubmit}
          timeLeft={timeLeft}
        />
      )}

      {gameState === 'REVIEW' && (
        <ReviewScreen
          questions={shuffledQuestions}
          answers={answers}
          essayAnswers={essayAnswers}
          onBack={handleReviewBack}
          onSubmit={handleSubmit}
        />
      )}

      {gameState === 'RESULT' && userData && (
        <ResultScreen
          finalScore={finalScore}
          pgScore={pgScore}
          essayScore={essayScore}
          pgCorrectCount={pgCorrectCount}
          pgTotalQuestions={pgTotalQuestions}
          essayTotalQuestions={essayTotalQuestions}
          essayScoreDetails={essayScoreDetails}
          pgAnswersDetail={pgAnswersDetail}
          essayAnswers={essayAnswers}
          isPassed={isPassed}
          createdAt={createdAt}
          userData={userData}
          onRetry={handleRetry}
          aiSuggestion={aiSuggestion}
          isLoadingAI={isLoadingAI}
          resultId={resultId}
          pgWeight={pgWeight}
          essayWeight={essayWeight}
        />
      )}

      {gameState === 'ADMIN' && <AdminScreen />}

      {/* Blocked / Error Modal */}
      {blockedReason && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel p-8 max-w-md w-full text-center border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Akses Diblokir</h3>
            <p className="text-gray-300 mb-8 leading-relaxed whitespace-pre-wrap">{blockedReason}</p>
            <button
              onClick={() => setBlockedReason(null)}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg active:scale-95"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
