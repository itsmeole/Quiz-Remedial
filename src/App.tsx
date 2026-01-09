import { useState, useEffect } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { QuizScreen } from './components/QuizScreen';
import { ReviewScreen } from './components/ReviewScreen';
import { ResultScreen } from './components/ResultScreen';
import { AdminScreen } from './components/AdminScreen';
import type { UserData, GameState } from './types';
import { questions } from './data/questions';
import { supabase } from './utils/supabaseClient';
import bgImage from './assets/bg.png'; // FORCE IMPORT

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
      const scorePct = Math.round((correct / questions.length) * 100);
      const passed = scorePct >= 80;

      const { error } = await supabase.from('quiz_results').insert([
        {
          name: userData.name,
          nim: userData.nim,
          class: userData.class,
          score: scorePct,
          passed: passed
        }
      ]);

      if (error) console.error("Failed to save result:", error);
    }

    setScore(correct);
    setGameState('RESULT');
  };

  const handleRetry = () => {
    setGameState('WELCOME');
    setAnswers({});
    setScore(0);
    setUserData(null);
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
  );
}

export default App;
