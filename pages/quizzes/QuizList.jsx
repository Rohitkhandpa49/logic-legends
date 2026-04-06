import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, BrainCircuit, Clock, HelpCircle, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import PageHeader from '@/components/shared/PageHeader';

export default function QuizList() {
  const { data: quizzes = [], isLoading } = useQuery({
    queryKey: ['quizzes'],
    queryFn: () => base44.entities.Quiz.list('-created_date', 100),
  });

  return (
    <div>
      <PageHeader
        title="Quizzes"
        subtitle="Create and manage your quizzes"
        action={
          <Link to="/quizzes/create">
            <Button className="rounded-xl gap-2 shadow-md shadow-primary/25">
              <Plus className="w-4 h-4" /> Create Quiz
            </Button>
          </Link>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Card key={i} className="h-44 animate-pulse bg-muted border-0" />)}
        </div>
      ) : quizzes.length === 0 ? (
        <Card className="p-12 text-center border-0 shadow-sm">
          <BrainCircuit className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold text-lg mb-2">No quizzes yet</h3>
          <p className="text-muted-foreground mb-4">Create your first quiz to get started</p>
          <Link to="/quizzes/create">
            <Button className="rounded-xl gap-2"><Plus className="w-4 h-4" /> Create Quiz</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.map((quiz, idx) => (
            <motion.div key={quiz.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
              <Link to={`/quizzes/${quiz.id}`}>
                <Card className="p-5 border-0 shadow-sm hover:shadow-lg transition-all duration-300 group cursor-pointer h-full">
                  <Badge variant={quiz.status === 'closed' ? 'secondary' : 'default'} className="rounded-lg mb-3">
                    {quiz.status === 'closed' ? 'Closed' : 'Active'}
                  </Badge>
                  <h3 className="font-semibold text-base mb-2 group-hover:text-primary transition-colors line-clamp-2">{quiz.title}</h3>
                  {quiz.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{quiz.description}</p>}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-auto pt-3 border-t border-border">
                    <span className="flex items-center gap-1"><HelpCircle className="w-3.5 h-3.5" /> {quiz.questions?.length || 0} questions</span>
                    {quiz.total_time_limit && (
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {Math.floor(quiz.total_time_limit / 60)}m</span>
                    )}
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {quiz.attempts_count || 0} attempts</span>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}