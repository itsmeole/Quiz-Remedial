
import { useState, useEffect } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { QuizScreen } from './components/QuizScreen';
import { ReviewScreen } from './components/ReviewScreen';
import { ResultScreen } from './components/ResultScreen';
import { AdminScreen } from './components/AdminScreen';
import type { UserData, GameState, Question } from './types';
// import { linearAlgebraQuestions, calculusQuestions } from './data/questions'; // REMOVED
import { quizService } from './services/quizService';
import { supabase } from './utils/supabaseClient';
import bgImage from './assets/bg.png'; // FORCE IMPORT

const MAX_STRIKES = 5;

function App() {
  const [gameState, setGameState] = useState<GameState>('WELCOME');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [score, setScore] = useState(0);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour in seconds, global state



  // Hidden Admin Route Check
  useEffect(() => {
    if (window.location.pathname === '/data') {
      setGameState('ADMIN');
    }
  }, []);

  const handleStart = async (data: UserData) => {
    setBlockedReason(null);
    setTimeLeft(3600); // Reset timer on start

    if (supabase) {
      // 1. Check if ALREADY PASSED
      const { data: passedData } = await supabase
        .from('quiz_results')
        .select('*')
        .eq('nim', data.nim)
        .eq('passed', true)
        .limit(1);

      if (passedData && passedData.length > 0) {
        setBlockedReason("Anda sudah lulus remedial ini sebelumnya. Tidak perlu mengerjakan lagi.");
        return;
      }

      // 2. Check for previous failures (3 Strikes Rule)
      const { count, error } = await supabase
        .from('quiz_results')
        .select('*', { count: 'exact', head: true })
        .eq('nim', data.nim)
        .eq('passed', false);

      if (error) {
        console.error("Error checking attempts:", error);
        setBlockedReason("Terjadi kesalahan saat memeriksa data. Silakan coba lagi.");
        return;
      }

      if (count !== null && count >= MAX_STRIKES) {
        setBlockedReason("Anda telah mencapai jumlah maksimum percobaan. Hubungi dosen pengampu atau asisten dosen untuk membuka akses.");
        return;
      }
    }

    // Fetch Questions from Supabase (Secure)
    const questions = await quizService.getQuestions(data.subject);

    if (!questions || questions.length === 0) {
      setBlockedReason("Gagal memuat soal. Periksa koneksi internet atau hubungi admin.");
      return;
    }

    // Shuffle Questions
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    setShuffledQuestions(shuffled);

    // Mark session as active and save UserData for auto-recovery
    localStorage.setItem('quiz_active', 'true');
    localStorage.setItem('quiz_userData', JSON.stringify(data));
    localStorage.setItem('quiz_answers', '{}');

    setUserData(data);
    setGameState('QUIZ');
  };

  const handleAnswer = (questionId: number, answerIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerIndex }));
  };

  const handleQuizFinish = () => {
    setGameState('REVIEW');
  };

  const handleReviewBack = () => {
    setGameState('QUIZ');
  };

  const handleSubmit = async () => {
    if (!userData) return;

    try {
      // Secure Server-Side Grading
      const result = await quizService.submitQuiz(userData, answers);

      if (result) {
        setScore(result.correct_count);
      }
    } catch (err) {
      console.error("Failed to submit:", err);
      // alert("Gagal menyimpan jawaban. Coba lagi."); // Optional: alert might be annoying if auto-submit
      // But let's keep it for now or just log.
      if (err instanceof Error && err.message !== 'Auto-submit') {
        alert("Gagal menyimpan jawaban. Coba lagi.");
        return;
      }
    }

    setGameState('RESULT');
  };

  // Timer Logic (Global)
  useEffect(() => {
    if ((gameState === 'QUIZ' || gameState === 'REVIEW') && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmit(); // Auto submit when time runs out
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
    setScore(0);
    setUserData(null);
    setShuffledQuestions([]);
    setTimeLeft(3600); // Reset timer on retry

    // Clear all session flags
    localStorage.removeItem('blocked_reason');
    localStorage.removeItem('quiz_active');
    localStorage.removeItem('quiz_userData');
    localStorage.removeItem('quiz_answers');
  };

  return (
    <div
      className="min-h-screen text-white font-sans antialiased"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {gameState === 'WELCOME' && <WelcomeScreen onStart={handleStart} />}

      {gameState === 'QUIZ' && (
        <QuizScreen
          questions={shuffledQuestions}
          answers={answers}
          onAnswer={handleAnswer}
          onFinish={handleQuizFinish}
          onAutoSubmit={handleSubmit}
          timeLeft={timeLeft} // Pass global timer
        />
      )}

      {gameState === 'REVIEW' && (
        <ReviewScreen
          questions={shuffledQuestions}
          answers={answers}
          onBack={handleReviewBack}
          onSubmit={handleSubmit}
        />
      )}

      {gameState === 'RESULT' && userData && (
        <ResultScreen
          score={score}
          totalQuestions={shuffledQuestions.length}
          userData={userData}
          onRetry={handleRetry}
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
            <p className="text-gray-300 mb-8 leading-relaxed">
              {blockedReason}
            </p>
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
