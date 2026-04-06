import React from 'react';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';

export default function StatCard({ icon: Icon, label, value, trend, color = 'primary', delay = 0 }) {
  const colorMap = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    purple: 'bg-violet-50 text-violet-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card className="p-5 hover:shadow-lg transition-shadow duration-300 border-0 shadow-sm bg-card">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{label}</p>
            <p className="text-3xl font-bold mt-1 tracking-tight">{value}</p>
            {trend && (
              <p className="text-xs text-emerald-600 font-medium mt-2">
                {trend}
              </p>
            )}
          </div>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}