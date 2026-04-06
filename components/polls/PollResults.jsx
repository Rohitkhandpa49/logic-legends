import React from 'react';
import { motion } from 'framer-motion';

const COLORS = [
  'hsl(217, 91%, 60%)', 'hsl(160, 60%, 45%)', 'hsl(280, 65%, 60%)',
  'hsl(43, 74%, 66%)', 'hsl(340, 75%, 55%)', 'hsl(190, 80%, 50%)',
];

export default function PollResults({ options, totalVotes }) {
  return (
    <div className="space-y-3">
      {options.map((opt, idx) => {
        const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
        return (
          <div key={idx}>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="font-medium">{opt.text}</span>
              <span className="text-muted-foreground">{opt.votes} votes ({pct}%)</span>
            </div>
            <div className="h-8 bg-muted rounded-lg overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: idx * 0.1 }}
                className="h-full rounded-lg flex items-center pl-3"
                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
              >
                {pct > 8 && (
                  <span className="text-xs font-semibold text-white">{pct}%</span>
                )}
              </motion.div>
            </div>
          </div>
        );
      })}
      <p className="text-center text-sm text-muted-foreground pt-2">
        {totalVotes} total vote{totalVotes !== 1 ? 's' : ''}
      </p>
    </div>
  );
}