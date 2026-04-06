import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Share2, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import PageHeader from '@/components/shared/PageHeader';
import PollResults from '@/components/polls/PollResults';
import QRShare from '@/components/polls/QRShare';

export default function PollView() {
  const pollId = new URLSearchParams(window.location.search).get('id') || window.location.pathname.split('/').pop();
  const queryClient = useQueryClient();
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);

  const { data: poll, isLoading } = useQuery({
    queryKey: ['poll', pollId],
    queryFn: async () => {
      const polls = await base44.entities.Poll.filter({ id: pollId });
      return polls[0];
    },
    enabled: !!pollId,
  });

  const { data: existingVotes = [] } = useQuery({
    queryKey: ['my-poll-votes', pollId],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.PollVote.filter({ poll_id: pollId, voter_email: user.email });
    },
    enabled: !!pollId,
  });

  useEffect(() => {
    if (existingVotes.length > 0) setHasVoted(true);
  }, [existingVotes]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = base44.entities.Poll.subscribe((event) => {
      if (event.id === pollId) {
        queryClient.invalidateQueries({ queryKey: ['poll', pollId] });
      }
    });
    return unsubscribe;
  }, [pollId, queryClient]);

  const voteMutation = useMutation({
    mutationFn: async (optionIndex) => {
      const user = await base44.auth.me();
      await base44.entities.PollVote.create({
        poll_id: pollId,
        option_index: optionIndex,
        voter_email: user.email,
      });
      const updatedOptions = poll.options.map((opt, i) => 
        i === optionIndex ? { ...opt, votes: (opt.votes || 0) + 1 } : opt
      );
      await base44.entities.Poll.update(pollId, {
        options: updatedOptions,
        total_votes: (poll.total_votes || 0) + 1,
      });
    },
    onSuccess: () => {
      setHasVoted(true);
      queryClient.invalidateQueries({ queryKey: ['poll', pollId] });
      toast.success('Vote recorded!');
    },
  });

  const isExpired = poll?.expires_at && new Date(poll.expires_at) < new Date();
  const shareUrl = window.location.href;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  if (!poll) {
    return <div className="text-center py-20 text-muted-foreground">Poll not found</div>;
  }

  return (
    <div>
      <PageHeader
        title={poll.title}
        action={
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-xl gap-2">
                  <Share2 className="w-4 h-4" /> Share
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Share Poll</DialogTitle>
                </DialogHeader>
                <QRShare url={shareUrl} title={poll.title} />
              </DialogContent>
            </Dialog>
            <Link to="/polls">
              <Button variant="ghost" className="rounded-xl gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
            </Link>
          </div>
        }
      />

      <div className="max-w-2xl mx-auto">
        <Card className="p-6 md:p-8 border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant={isExpired || poll.status === 'closed' ? 'secondary' : 'default'} className="rounded-lg">
              {isExpired || poll.status === 'closed' ? 'Closed' : 'Active'}
            </Badge>
            {poll.is_anonymous && <Badge variant="outline" className="rounded-lg">Anonymous</Badge>}
          </div>

          {poll.description && (
            <p className="text-muted-foreground mb-6">{poll.description}</p>
          )}

          {hasVoted || isExpired || poll.status === 'closed' ? (
            <PollResults options={poll.options || []} totalVotes={poll.total_votes || 0} />
          ) : (
            <div className="space-y-3">
              {(poll.options || []).map((opt, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSelectedOption(idx)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    selectedOption === idx 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold ${
                      selectedOption === idx ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="font-medium">{opt.text}</span>
                  </div>
                </motion.button>
              ))}
              <Button
                onClick={() => voteMutation.mutate(selectedOption)}
                disabled={selectedOption === null || voteMutation.isPending}
                className="w-full h-12 rounded-xl mt-4 font-semibold shadow-md shadow-primary/25"
              >
                {voteMutation.isPending ? 'Voting...' : 'Submit Vote'}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}