import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Vote, BrainCircuit, Users, Trophy, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import PageHeader from '@/components/shared/PageHeader';
import StatCard from '@/components/shared/StatCard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';

const COLORS = ['hsl(217,91%,60%)', 'hsl(160,60%,45%)', 'hsl(280,65%,60%)', 'hsl(43,74%,66%)', 'hsl(340,75%,55%)'];

export default function Analytics() {
  const { data: polls = [] } = useQuery({
    queryKey: ['polls'],
    queryFn: () => base44.entities.Poll.list('-created_date', 200),
  });
  const { data: quizzes = [] } = useQuery({
    queryKey: ['quizzes'],
    queryFn: () => base44.entities.Quiz.list('-created_date', 200),
  });
  const { data: attempts = [] } = useQuery({
    queryKey: ['quiz-attempts-all'],
    queryFn: () => base44.entities.QuizAttempt.list('-created_date', 500),
  });

  const totalVotes = polls.reduce((sum, p) => sum + (p.total_votes || 0), 0);
  const avgAccuracy = attempts.length > 0 ? Math.round(attempts.reduce((s, a) => s + (a.accuracy || 0), 0) / attempts.length) : 0;

  // Popular polls by votes
  const popularPolls = [...polls]
    .sort((a, b) => (b.total_votes || 0) - (a.total_votes || 0))
    .slice(0, 6)
    .map(p => ({ name: p.title?.substring(0, 18) + (p.title?.length > 18 ? '...' : ''), votes: p.total_votes || 0 }));

  // Category breakdown (poll options count)
  const optionDistribution = polls.reduce((acc, p) => {
    const count = p.options?.length || 0;
    const key = `${count} options`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(optionDistribution).map(([name, value]) => ({ name, value }));

  // Score distribution
  const scoreRanges = { '0-20%': 0, '21-40%': 0, '41-60%': 0, '61-80%': 0, '81-100%': 0 };
  attempts.forEach(a => {
    const acc = a.accuracy || 0;
    if (acc <= 20) scoreRanges['0-20%']++;
    else if (acc <= 40) scoreRanges['21-40%']++;
    else if (acc <= 60) scoreRanges['41-60%']++;
    else if (acc <= 80) scoreRanges['61-80%']++;
    else scoreRanges['81-100%']++;
  });
  const scoreData = Object.entries(scoreRanges).map(([name, count]) => ({ name, count }));

  const tooltipStyle = {
    borderRadius: '12px',
    border: '1px solid hsl(var(--border))',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  };

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Insights into your platform" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Vote} label="Total Polls" value={polls.length} color="primary" delay={0} />
        <StatCard icon={BrainCircuit} label="Total Quizzes" value={quizzes.length} color="purple" delay={0.05} />
        <StatCard icon={Users} label="Total Votes" value={totalVotes} color="success" delay={0.1} />
        <StatCard icon={TrendingUp} label="Avg Accuracy" value={`${avgAccuracy}%`} color="warning" delay={0.15} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="p-6 border-0 shadow-sm h-full">
            <h3 className="font-semibold text-lg mb-4">Popular Polls</h3>
            {popularPolls.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={popularPolls}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="votes" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">No data</div>
            )}
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="p-6 border-0 shadow-sm h-full">
            <h3 className="font-semibold text-lg mb-4">Poll Options Distribution</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {pieData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">No data</div>
            )}
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="p-6 border-0 shadow-sm">
          <h3 className="font-semibold text-lg mb-4">Quiz Score Distribution</h3>
          {attempts.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scoreData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="hsl(280,65%,60%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">No quiz attempts yet</div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}