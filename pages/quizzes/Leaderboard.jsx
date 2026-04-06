import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Clock, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import PageHeader from '@/components/shared/PageHeader';

const podiumColors = ['text-amber-500', 'text-slate-400', 'text-amber-700'];
const podiumBg = ['bg-amber-50', 'bg-slate-50', 'bg-amber-50/50'];

export default function Leaderboard() {
  const { data: attempts = [], isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => base44.entities.QuizAttempt.list('-score', 100),
  });

  // Deduplicate: best score per user, then sort by score desc, time asc
  const leaderboard = useMemo(() => {
    const best = {};
    attempts.forEach(a => {
      const key = a.user_email;
      if (!best[key] || a.score > best[key].score || (a.score === best[key].score && a.time_taken < best[key].time_taken)) {
        best[key] = a;
      }
    });
    return Object.values(best).sort((a, b) => b.score - a.score || a.time_taken - b.time_taken);
  }, [attempts]);

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  const formatTime = (s) => s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : '--';

  return (
    <div>
      <PageHeader title="Leaderboard" subtitle="Top quiz performers" />

      {isLoading ? (
        <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>
      ) : leaderboard.length === 0 ? (
        <Card className="p-12 text-center border-0 shadow-sm">
          <Trophy className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold text-lg mb-2">No scores yet</h3>
          <p className="text-muted-foreground">Complete a quiz to appear on the leaderboard</p>
        </Card>
      ) : (
        <>
          {/* Top 3 podium */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {top3.map((entry, idx) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className={`p-6 border-0 shadow-sm text-center ${idx === 0 ? 'sm:order-2 ring-2 ring-amber-200' : idx === 1 ? 'sm:order-1' : 'sm:order-3'}`}>
                  <div className={`w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center ${podiumBg[idx]}`}>
                    {idx === 0 ? <Trophy className={`w-7 h-7 ${podiumColors[idx]}`} /> : <Medal className={`w-7 h-7 ${podiumColors[idx]}`} />}
                  </div>
                  <Badge className="mb-2">#{idx + 1}</Badge>
                  <h3 className="font-bold text-base truncate">{entry.user_name || entry.user_email}</h3>
                  <div className="flex justify-center gap-4 mt-3 text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground"><Target className="w-3.5 h-3.5" /> {entry.score} pts</span>
                    <span className="flex items-center gap-1 text-muted-foreground"><Clock className="w-3.5 h-3.5" /> {formatTime(entry.time_taken)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{entry.accuracy}% accuracy</p>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Full table */}
          {rest.length > 0 && (
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Rank</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Name</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Score</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Accuracy</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rest.map((entry, idx) => (
                      <motion.tr
                        key={entry.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-4 font-medium text-muted-foreground">#{idx + 4}</td>
                        <td className="p-4 font-medium">{entry.user_name || entry.user_email}</td>
                        <td className="p-4">{entry.score}</td>
                        <td className="p-4">{entry.accuracy}%</td>
                        <td className="p-4 text-muted-foreground">{formatTime(entry.time_taken)}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}