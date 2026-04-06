import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Vote, BrainCircuit, Users, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import StatCard from '@/components/shared/StatCard';
import PageHeader from '@/components/shared/PageHeader';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { data: polls = [] } = useQuery({
    queryKey: ['polls'],
    queryFn: () => base44.entities.Poll.list('-created_date', 50),
  });

  const { data: quizzes = [] } = useQuery({
    queryKey: ['quizzes'],
    queryFn: () => base44.entities.Quiz.list('-created_date', 50),
  });

  const { data: attempts = [] } = useQuery({
    queryKey: ['quiz-attempts'],
    queryFn: () => base44.entities.QuizAttempt.list('-created_date', 50),
  });

  const totalVotes = polls.reduce((sum, p) => sum + (p.total_votes || 0), 0);

  const recentPolls = polls.slice(0, 5);
  const chartData = recentPolls.map(p => ({
    name: p.title?.substring(0, 15) + (p.title?.length > 15 ? '...' : ''),
    votes: p.total_votes || 0,
  }));

  return (
    <div>
      <PageHeader 
        title="Dashboard" 
        subtitle="Welcome back! Here's your overview."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Vote} label="Total Polls" value={polls.length} color="primary" delay={0} />
        <StatCard icon={BrainCircuit} label="Total Quizzes" value={quizzes.length} color="purple" delay={0.05} />
        <StatCard icon={Users} label="Total Votes" value={totalVotes} color="success" delay={0.1} />
        <StatCard icon={Trophy} label="Quiz Attempts" value={attempts.length} color="warning" delay={0.15} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
          <Card className="p-6 border-0 shadow-sm">
            <h3 className="font-semibold text-lg mb-4">Recent Poll Activity</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: '1px solid hsl(var(--border))',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    }} 
                  />
                  <Bar dataKey="votes" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-muted-foreground">
                No poll data yet. Create your first poll!
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="p-6 border-0 shadow-sm h-full">
            <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link to="/polls/create">
                <Button className="w-full justify-start gap-3 h-12 rounded-xl" variant="outline">
                  <Vote className="w-4 h-4 text-primary" />
                  Create New Poll
                </Button>
              </Link>
              <Link to="/quizzes/create">
                <Button className="w-full justify-start gap-3 h-12 rounded-xl" variant="outline">
                  <BrainCircuit className="w-4 h-4 text-violet-600" />
                  Create New Quiz
                </Button>
              </Link>
              <Link to="/ai-assistant">
                <Button className="w-full justify-start gap-3 h-12 rounded-xl" variant="outline">
                  <span className="text-amber-500">✨</span>
                  AI Assistant
                </Button>
              </Link>
              <Link to="/leaderboard">
                <Button className="w-full justify-start gap-3 h-12 rounded-xl" variant="outline">
                  <Trophy className="w-4 h-4 text-amber-600" />
                  View Leaderboard
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}