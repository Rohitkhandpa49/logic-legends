import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Vote, BrainCircuit, Copy, Loader2, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import PageHeader from '@/components/shared/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AIAssistant() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState('quiz');

  const generateMutation = useMutation({
    mutationFn: async ({ prompt, type }) => {
      if (type === 'quiz') {
        return base44.integrations.Core.InvokeLLM({
          prompt: `Generate a quiz based on this request: "${prompt}". Create 5-10 multiple choice questions. Each question should have 4 options with one correct answer. Also include a brief explanation for each correct answer.`,
          response_json_schema: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              questions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    question: { type: 'string' },
                    options: { type: 'array', items: { type: 'string' } },
                    correct_index: { type: 'number' },
                    explanation: { type: 'string' },
                  },
                },
              },
            },
          },
        });
      } else if (type === 'poll') {
        return base44.integrations.Core.InvokeLLM({
          prompt: `Generate creative poll ideas based on this topic: "${prompt}". Create 3 different poll questions, each with 3-5 options.`,
          response_json_schema: {
            type: 'object',
            properties: {
              polls: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    options: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
        });
      } else {
        return base44.integrations.Core.InvokeLLM({
          prompt: `Explain this topic in a clear, educational way: "${prompt}". Provide key points and examples.`,
        });
      }
    },
    onSuccess: (data) => setResult(data),
  });

  const handleGenerate = () => {
    if (!prompt.trim()) { toast.error('Please enter a prompt'); return; }
    generateMutation.mutate({ prompt, type: tab });
  };

  const createQuizFromAI = async () => {
    if (!result?.questions) return;
    const quiz = await base44.entities.Quiz.create({
      title: result.title || 'AI Generated Quiz',
      description: result.description || '',
      questions: result.questions.map(q => ({
        ...q,
        time_limit: 30,
      })),
      total_time_limit: result.questions.length * 30,
      status: 'active',
      share_code: Math.random().toString(36).substring(2, 10),
      attempts_count: 0,
    });
    toast.success('Quiz created!');
    window.location.href = `/quizzes/${quiz.id}`;
  };

  const createPollFromAI = async (poll) => {
    const created = await base44.entities.Poll.create({
      title: poll.title,
      description: poll.description || '',
      options: poll.options.map(text => ({ text, votes: 0 })),
      total_votes: 0,
      status: 'active',
      share_code: Math.random().toString(36).substring(2, 10),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
    toast.success('Poll created!');
    window.location.href = `/polls/${created.id}`;
  };

  return (
    <div>
      <PageHeader title="AI Assistant" subtitle="Generate quizzes, polls, and explanations with AI" />

      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="p-6 border-0 shadow-sm">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="mb-4 rounded-xl">
              <TabsTrigger value="quiz" className="gap-2 rounded-lg"><BrainCircuit className="w-4 h-4" /> Quiz</TabsTrigger>
              <TabsTrigger value="poll" className="gap-2 rounded-lg"><Vote className="w-4 h-4" /> Poll Ideas</TabsTrigger>
              <TabsTrigger value="explain" className="gap-2 rounded-lg"><Sparkles className="w-4 h-4" /> Explain</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2">
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={tab === 'quiz' ? 'e.g. Create a Class 6 Science Quiz' : tab === 'poll' ? 'e.g. Favorite programming language' : 'e.g. How does photosynthesis work?'}
              className="h-12 rounded-xl"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <Button onClick={handleGenerate} disabled={generateMutation.isPending} className="h-12 px-6 rounded-xl gap-2 shadow-md shadow-primary/25">
              {generateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Generate
            </Button>
          </div>
        </Card>

        <AnimatePresence mode="wait">
          {generateMutation.isPending && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card className="p-12 border-0 shadow-sm text-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-3" />
                <p className="text-muted-foreground">AI is generating content...</p>
              </Card>
            </motion.div>
          )}

          {result && !generateMutation.isPending && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {tab === 'quiz' && result.questions && (
                <Card className="p-6 border-0 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{result.title}</h3>
                      {result.description && <p className="text-sm text-muted-foreground">{result.description}</p>}
                    </div>
                    <Button onClick={createQuizFromAI} className="rounded-xl gap-2 shadow-md shadow-primary/25">
                      <BrainCircuit className="w-4 h-4" /> Create Quiz
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {result.questions.map((q, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-muted/50">
                        <p className="font-medium mb-2">Q{idx + 1}. {q.question}</p>
                        <div className="space-y-1.5 ml-4">
                          {q.options?.map((opt, oIdx) => (
                            <div key={oIdx} className={`text-sm px-3 py-1.5 rounded-lg ${oIdx === q.correct_index ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-muted-foreground'}`}>
                              {String.fromCharCode(65 + oIdx)}. {opt}
                            </div>
                          ))}
                        </div>
                        {q.explanation && <p className="text-xs text-muted-foreground mt-2 ml-4 italic">💡 {q.explanation}</p>}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {tab === 'poll' && result.polls && (
                <div className="space-y-4">
                  {result.polls.map((poll, idx) => (
                    <Card key={idx} className="p-5 border-0 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{poll.title}</h3>
                          {poll.description && <p className="text-sm text-muted-foreground mt-1">{poll.description}</p>}
                          <div className="flex flex-wrap gap-2 mt-3">
                            {poll.options?.map((opt, oIdx) => (
                              <Badge key={oIdx} variant="secondary" className="rounded-lg">{opt}</Badge>
                            ))}
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => createPollFromAI(poll)} className="rounded-lg gap-1 flex-shrink-0">
                          <Vote className="w-3.5 h-3.5" /> Create
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {tab === 'explain' && typeof result === 'string' && (
                <Card className="p-6 border-0 shadow-sm">
                  <div className="flex justify-between mb-3">
                    <Badge className="rounded-lg gap-1"><Sparkles className="w-3 h-3" /> AI Explanation</Badge>
                    <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(result); toast.success('Copied!'); }}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">{result}</div>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}