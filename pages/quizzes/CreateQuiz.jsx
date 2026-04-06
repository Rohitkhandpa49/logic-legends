import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ArrowLeft, GripVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '@/components/shared/PageHeader';
import { toast } from 'sonner';

const emptyQuestion = () => ({
  question: '',
  options: ['', '', '', ''],
  correct_index: 0,
  time_limit: 30,
  explanation: '',
});

export default function CreateQuiz() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [totalTime, setTotalTime] = useState(300);
  const [questions, setQuestions] = useState([emptyQuestion()]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Quiz.create(data),
    onSuccess: (quiz) => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      toast.success('Quiz created!');
      navigate(`/quizzes/${quiz.id}`);
    },
  });

  const updateQuestion = (qIdx, field, value) => {
    const updated = [...questions];
    updated[qIdx] = { ...updated[qIdx], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (qIdx, oIdx, value) => {
    const updated = [...questions];
    updated[qIdx].options[oIdx] = value;
    setQuestions(updated);
  };

  const addQuestion = () => setQuestions([...questions, emptyQuestion()]);
  const removeQuestion = (idx) => {
    if (questions.length > 1) setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const valid = questions.every(q => q.question.trim() && q.options.filter(o => o.trim()).length >= 2);
    if (!valid) {
      toast.error('Each question needs text and at least 2 options');
      return;
    }
    createMutation.mutate({
      title,
      description,
      questions: questions.map(q => ({
        ...q,
        options: q.options.filter(o => o.trim()),
      })),
      total_time_limit: totalTime,
      status: 'active',
      share_code: Math.random().toString(36).substring(2, 10),
      attempts_count: 0,
    });
  };

  return (
    <div>
      <PageHeader
        title="Create Quiz"
        action={
          <Link to="/quizzes">
            <Button variant="ghost" className="gap-2 rounded-xl"><ArrowLeft className="w-4 h-4" /> Back</Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
        <Card className="p-6 border-0 shadow-sm">
          <div className="space-y-4">
            <div>
              <Label>Quiz Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter quiz title" className="mt-2 h-12 rounded-xl" required />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your quiz..." className="mt-2 rounded-xl" />
            </div>
            <div>
              <Label>Total Time Limit (seconds)</Label>
              <Input type="number" value={totalTime} onChange={(e) => setTotalTime(parseInt(e.target.value))} className="mt-2 h-11 rounded-xl w-40" min={30} />
            </div>
          </div>
        </Card>

        <AnimatePresence>
          {questions.map((q, qIdx) => (
            <motion.div key={qIdx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <Card className="p-6 border-0 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm text-muted-foreground">Question {qIdx + 1}</h3>
                  {questions.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeQuestion(qIdx)} className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <Input
                  value={q.question}
                  onChange={(e) => updateQuestion(qIdx, 'question', e.target.value)}
                  placeholder="Enter your question"
                  className="h-11 rounded-xl mb-4"
                />

                <div className="space-y-2 mb-4">
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuestion(qIdx, 'correct_index', oIdx)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold flex-shrink-0 transition-all ${
                          q.correct_index === oIdx ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {String.fromCharCode(65 + oIdx)}
                      </button>
                      <Input
                        value={opt}
                        onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                        placeholder={`Option ${oIdx + 1}`}
                        className="h-10 rounded-xl"
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Time per question (sec)</Label>
                    <Input type="number" value={q.time_limit} onChange={(e) => updateQuestion(qIdx, 'time_limit', parseInt(e.target.value))} className="mt-1 h-9 rounded-lg" min={5} />
                  </div>
                  <div>
                    <Label className="text-xs">Explanation (optional)</Label>
                    <Input value={q.explanation} onChange={(e) => updateQuestion(qIdx, 'explanation', e.target.value)} placeholder="Why is this correct?" className="mt-1 h-9 rounded-lg" />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        <Button type="button" variant="outline" onClick={addQuestion} className="w-full gap-2 rounded-xl border-dashed h-12">
          <Plus className="w-4 h-4" /> Add Question
        </Button>

        <Button type="submit" disabled={createMutation.isPending} className="w-full h-12 rounded-xl text-base font-semibold shadow-md shadow-primary/25">
          {createMutation.isPending ? 'Creating...' : `Create Quiz (${questions.length} question${questions.length > 1 ? 's' : ''})`}
        </Button>
      </form>
    </div>
  );
}