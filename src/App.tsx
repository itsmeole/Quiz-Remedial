import { useState, useEffect } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { QuizScreen } from './components/QuizScreen';
import { ReviewScreen } from './components/ReviewScreen';
import { ResultScreen } from './components/ResultScreen';
import { AdminScreen } from './components/AdminScreen';
import type { UserData, GameState } from './types';
import { questions } from './data/questions';
import { supabase } from './utils/supabaseClient';

function App() {
  const [gameState, setGameState] = useState<GameState>('WELCOME');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [score, setScore] = useState(0);

  // Hidden Admin Route Check
  useEffect(() => {
    if (window.location.pathname === '/data') {
      setGameState('ADMIN');
    }
  }, []);

  const handleStart = (data: UserData) => {
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
    // Calculate Score
    let correct = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correctIndex) {
        correct++;
      }
    });

    // Save to Supabase
    if (userData && supabase) {
      // Multiply by 100/30 to get scale of 100 approx? 
      // User logic says "score" which usually implies raw count or strict 100 scale? 
      // ResultScreen shows {score} / {totalQuestions}. 
      // Wait, update logic to save normalized score or raw? Let's save raw count and let UI handle display
      // actually let's save normalized 0-100 too if needed, but simple count is safer.

      const { error } = await supabase.from('quiz_results').insert([
        {
          name: userData.name,
          nim: userData.nim,
          class: userData.class,
          score: Math.round((correct / questions.length) * 100), // Standardize to 0-100 for DB
          passed: Math.round((correct / questions.length) * 100) >= 80
        }
      ]);

      if (error) console.error("Failed to save result:", error);
    }

    setScore(correct);
    setGameState('RESULT');
  };

  const handleRetry = () => {
    setAnswers({});
    setScore(0);
    setGameState('QUIZ');
  };

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center bg-fixed text-white font-inter">
      <div className="min-h-screen bg-gray-900/90 backdrop-blur-sm transition-all duration-500">
        {gameState === 'WELCOME' && <WelcomeScreen onStart={handleStart} />}

        {gameState === 'QUIZ' && (
          <QuizScreen
            answers={answers}
            onAnswer={handleAnswer}
            onFinish={handleQuizFinish}
            onAutoSubmit={handleSubmit}
          />
        )}

        {gameState === 'REVIEW' && (
          <ReviewScreen
            answers={answers}
            onBack={handleReviewBack}
            onSubmit={handleSubmit}
          />
        )}

        {gameState === 'RESULT' && userData && (
          <ResultScreen
            score={score}
            totalQuestions={questions.length}
            userData={userData}
            onRetry={handleRetry}
          />
        )}

        {gameState === 'ADMIN' && <AdminScreen />}
      </div>
    </div>
  );
}

export default App;
