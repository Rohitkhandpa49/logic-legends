import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Vote, Clock, Users, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import PageHeader from '@/components/shared/PageHeader';

export default function PollList() {
  const { data: polls = [], isLoading } = useQuery({
    queryKey: ['polls'],
    queryFn: () => base44.entities.Poll.list('-created_date', 100),
  });

  const isExpired = (poll) => poll.expires_at && new Date(poll.expires_at) < new Date();

  return (
    <div>
      <PageHeader 
        title="Polls" 
        subtitle="Create and manage your polls"
        action={
          <Link to="/polls/create">
            <Button className="rounded-xl gap-2 shadow-md shadow-primary/25">
              <Plus className="w-4 h-4" /> Create Poll
            </Button>
          </Link>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="h-44 animate-pulse bg-muted border-0" />
          ))}
        </div>
      ) : polls.length === 0 ? (
        <Card className="p-12 text-center border-0 shadow-sm">
          <Vote className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold text-lg mb-2">No polls yet</h3>
          <p className="text-muted-foreground mb-4">Create your first poll to get started</p>
          <Link to="/polls/create">
            <Button className="rounded-xl gap-2">
              <Plus className="w-4 h-4" /> Create Poll
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {polls.map((poll, idx) => (
            <motion.div
              key={poll.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <Link to={`/polls/${poll.id}`}>
                <Card className="p-5 border-0 shadow-sm hover:shadow-lg transition-all duration-300 group cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant={isExpired(poll) || poll.status === 'closed' ? 'secondary' : 'default'} className="rounded-lg">
                      {isExpired(poll) || poll.status === 'closed' ? 'Closed' : 'Active'}
                    </Badge>
                    {poll.is_anonymous && (
                      <Badge variant="outline" className="rounded-lg text-xs">Anonymous</Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-base mb-2 group-hover:text-primary transition-colors line-clamp-2">{poll.title}</h3>
                  {poll.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{poll.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-auto pt-3 border-t border-border">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {poll.total_votes || 0} votes
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> {poll.options?.length || 0} options
                    </span>
                    {poll.expires_at && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {format(new Date(poll.expires_at), 'MMM d')}
                      </span>
                    )}
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