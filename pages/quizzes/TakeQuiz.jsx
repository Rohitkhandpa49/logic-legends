import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Clock, CheckCircle2, XCircle, Share2, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import PageHeader from '@/components/shared/PageHeader';
import QRShare from '@/components/polls/QRShare';

export default function TakeQuiz() {
  const quizId = window.location.pathname.split('/').pop();
  const queryClient = useQueryClient();
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [qTimeLeft, setQTimeLeft] = useState(0);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const startTimeRef = useRef(null);

  const { data: quiz, isLoading } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: async () => {
      const quizzes = await base44.entities.Quiz.filter({ id: quizId });
      return quizzes[0];
    },
    enabled: !!quizId,
  });

  const submitMutation = useMutation({
    mutationFn: async (attemptData) => {
      await base44.entities.QuizAttempt.create(attemptData);
      await base44.entities.Quiz.update(quizId, {
        attempts_count: (quiz.attempts_count || 0) + 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-attempts'] });
    },
  });

  const finishQuiz = useCallback(async () => {
    if (finished) return;
    setFinished(true);
    const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
    const questions = quiz.questions || [];
    let score = 0;
    const processedAnswers = answers.map((ans, idx) => {
      const isCorrect = ans === questions[idx]?.correct_index;
      if (isCorrect) score++;
      return { question_index: idx, selected_index: ans, is_correct: isCorrect };
    });

    const accuracy = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    const user = await base44.auth.me();

    const attemptData = {
      quiz_id: quizId,
      user_email: user.email,
      user_name: user.full_name || user.email,
      score,
      total_questions: questions.length,
      accuracy,
      time_taken: timeTaken,
      answers: processedAnswers,
    };

    setResult(attemptData);
    submitMutation.mutate(attemptData);
  }, [finished, quiz, answers, quizId, submitMutation]);

  // Total timer
  useEffect(() => {
    if (!started || finished || !quiz) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { finishQuiz(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [started, finished, quiz, finishQuiz]);

  // Per-question timer
  useEffect(() => {
    if (!started || finished || !quiz) return;
    const question = quiz.questions[currentQ];
    if (!question) return;
    setQTimeLeft(question.time_limit || 30);
    const interval = setInterval(() => {
      setQTimeLeft((prev) => {
        if (prev <= 1) {
          // Auto-skip
          if (currentQ < quiz.questions.length - 1) {
            setCurrentQ(c => c + 1);
            setAnswers(a => { const n = [...a]; if (n[currentQ] === undefined) n[currentQ] = -1; return n; });
          } else {
            finishQuiz();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [started, finished, currentQ, quiz, finishQuiz]);

  const startQuiz = () => {
    setStarted(true);
    startTimeRef.current = Date.now();
    setTimeLeft(quiz.total_time_limit || 300);
    setAnswers(new Array(quiz.questions.length).fill(undefined));
  };

  const selectAnswer = (optIdx) => {
    const newAnswers = [...answers];
    newAnswers[currentQ] = optIdx;
    setAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQ < quiz.questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      finishQuiz();
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  if (!quiz) return <div className="text-center py-20 text-muted-foreground">Quiz not found</div>;

  // Results screen
  if (finished && result) {
    return (
      <div>
        <PageHeader title="Quiz Results" action={
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-xl gap-2"><Share2 className="w-4 h-4" /> Share</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Share Quiz</DialogTitle></DialogHeader>
                <QRShare url={window.location.href} title={quiz.title} />
              </DialogContent>
            </Dialog>
            <Link to="/quizzes"><Button variant="ghost" className="rounded-xl gap-2"><ArrowLeft className="w-4 h-4" /> Back</Button></Link>
          </div>
        } />
        <div className="max-w-2xl mx-auto space-y-6">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="p-8 border-0 shadow-sm text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-3xl font-bold mb-2">{result.accuracy}%</h2>
              <p className="text-muted-foreground mb-6">
                {result.score}/{result.total_questions} correct • {formatTime(result.time_taken)}
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 rounded-xl bg-muted/50"><p className="text-2xl font-bold">{result.score}</p><p className="text-xs text-muted-foreground">Score</p></div>
                <div className="p-3 rounded-xl bg-muted/50"><p className="text-2xl font-bold">{result.accuracy}%</p><p className="text-xs text-muted-foreground">Accuracy</p></div>
                <div className="p-3 rounded-xl bg-muted/50"><p className="text-2xl font-bold">{formatTime(result.time_taken)}</p><p className="text-xs text-muted-foreground">Time</p></div>
              </div>
              <Button onClick={() => setShowAnswers(!showAnswers)} variant="outline" className="mt-6 rounded-xl">
                {showAnswers ? 'Hide Answers' : 'Show Answers'}
              </Button>
            </Card>
          </motion.div>

          {showAnswers && quiz.questions.map((q, idx) => {
            const userAns = result.answers[idx];
            return (
              <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <Card className="p-5 border-0 shadow-sm">
                  <div className="flex items-start gap-2 mb-3">
                    {userAns?.is_correct ? <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />}
                    <p className="font-medium">{q.question}</p>
                  </div>
                  <div className="space-y-2 ml-7">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className={`p-2.5 rounded-lg text-sm ${
                        oIdx === q.correct_index ? 'bg-emerald-50 text-emerald-700 font-medium' :
                        oIdx === userAns?.selected_index && !userAns?.is_correct ? 'bg-destructive/10 text-destructive' : 'bg-muted/50'
                      }`}>
                        {String.fromCharCode(65 + oIdx)}. {opt}
                      </div>
                    ))}
                    {q.explanation && <p className="text-sm text-muted-foreground mt-2 italic">💡 {q.explanation}</p>}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  // Start screen
  if (!started) {
    return (
      <div>
        <PageHeader title={quiz.title} action={
          <Link to="/quizzes"><Button variant="ghost" className="rounded-xl gap-2"><ArrowLeft className="w-4 h-4" /> Back</Button></Link>
        } />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
          <Card className="p-8 border-0 shadow-sm text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">{quiz.title}</h2>
            {quiz.description && <p className="text-muted-foreground mb-4">{quiz.description}</p>}
            <div className="flex justify-center gap-6 text-sm text-muted-foreground mb-6">
              <span>{quiz.questions?.length} questions</span>
              <span>{formatTime(quiz.total_time_limit || 300)} total</span>
            </div>
            <Button onClick={startQuiz} className="w-full h-12 rounded-xl font-semibold shadow-md shadow-primary/25">
              Start Quiz
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Quiz in progress
  const question = quiz.questions[currentQ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Badge variant="outline" className="rounded-lg gap-1"><Clock className="w-3.5 h-3.5" /> {formatTime(timeLeft)}</Badge>
        <span className="text-sm text-muted-foreground">{currentQ + 1} / {quiz.questions.length}</span>
        <Badge variant="outline" className="rounded-lg gap-1">Q: {formatTime(qTimeLeft)}</Badge>
      </div>

      <Progress value={((currentQ + 1) / quiz.questions.length) * 100} className="h-2 rounded-full mb-6" />

      <motion.div key={currentQ} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
        <Card className="p-6 md:p-8 border-0 shadow-sm">
          <h2 className="text-lg font-semibold mb-6">{question.question}</h2>
          <div className="space-y-3">
            {question.options.map((opt, oIdx) => (
              <motion.button
                key={oIdx}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => selectAnswer(oIdx)}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  answers[currentQ] === oIdx ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold ${
                    answers[currentQ] === oIdx ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {String.fromCharCode(65 + oIdx)}
                  </div>
                  <span className="font-medium">{opt}</span>
                </div>
              </motion.button>
            ))}
          </div>
          <Button
            onClick={nextQuestion}
            disabled={answers[currentQ] === undefined}
            className="w-full h-12 rounded-xl mt-6 font-semibold shadow-md shadow-primary/25"
          >
            {currentQ < quiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
          </Button>
        </Card>
      </motion.div>
    </div>
  );
}