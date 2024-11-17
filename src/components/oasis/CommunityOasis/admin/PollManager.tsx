import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart,
  Plus,
  CheckCircle,
  XCircle,
  Users,
  Clock,
  X,
  AlertTriangle,
} from 'lucide-react';
import { ThemeColors } from '@/themes';
import { auth, db } from '@/firebase';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Vote {
  userId: string;
  userName: string;
  timestamp: Date;
}

interface PollOption {
  text: string;
  votes: Vote[];
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  isActive: boolean;
  createdAt: Date;
  endAt: Date;
  endedAt?: Date;
}

interface PollManagerProps {
  themeColors: ThemeColors;
  oasisId: string;
}

const PollManager: React.FC<PollManagerProps> = ({ themeColors, oasisId }) => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptions, setNewPollOptions] = useState<string[]>(['', '']);
  const [showVoters, setShowVoters] = useState<Record<string, boolean>>({});
  const [duration, setDuration] = useState<'24' | '72'>('24');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [confirmVoteDialog, setConfirmVoteDialog] = useState<{
    isOpen: boolean;
    pollId: string;
    optionIndex: number;
  }>({ isOpen: false, pollId: '', optionIndex: -1 });
  const { toast } = useToast();

  const buttonStyle = {
    background: 'linear-gradient(145deg, #2c3e50, #1a2533)',
    color: '#fff',
    textShadow: '0 0 5px rgba(255,255,255,0.5)',
    boxShadow: '0 0 10px rgba(0,0,0,0.5), inset 0 0 5px rgba(255,255,255,0.2)',
    border: 'none',
    transition: 'all 0.1s ease',
    width: '100%',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.875rem',
    fontWeight: '500',
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to manage polls',
        variant: 'destructive',
      });
      return;
    }

    const pollsRef = collection(db, 'users', user.uid, 'oasis', oasisId, 'polls');
    const q = query(pollsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const pollsData: Poll[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          const createdAt = data.createdAt as Timestamp;
          const endAt = data.endAt as Timestamp;
          const endedAt = data.endedAt as Timestamp | undefined;

          if (createdAt) {
            pollsData.push({
              id: doc.id,
              question: data.question,
              options: data.options.map((opt: any) => ({
                ...opt,
                votes: opt.votes.map((vote: any) => ({
                  ...vote,
                  timestamp: vote.timestamp?.toDate() || new Date(),
                })),
              })),
              isActive: data.isActive,
              createdAt: createdAt.toDate(),
              endAt: endAt.toDate(),
              endedAt: endedAt?.toDate(),
            });
          }
        });
        setPolls(pollsData);
      },
      (error) => {
        console.error('Error fetching polls:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch polls. Please check your permissions.',
          variant: 'destructive',
        });
      }
    );

    return () => unsubscribe();
  }, [oasisId, toast]);

  useEffect(() => {
    const timer = setInterval(async () => {
      setCurrentTime(new Date());

      const user = auth.currentUser;
      if (!user) return;

      const pollsRef = collection(db, 'users', user.uid, 'oasis', oasisId, 'polls');
      const pollsSnapshot = await getDocs(pollsRef);

      pollsSnapshot.forEach(async (pollDoc) => {
        const pollData = pollDoc.data();
        if (pollData.isActive && pollData.endAt && new Date() >= pollData.endAt.toDate()) {
          await updateDoc(doc(pollsRef, pollDoc.id), {
            isActive: false,
            endedAt: serverTimestamp(),
          });
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [oasisId]);

  const handleCreatePoll = async () => {
    const user = auth.currentUser;
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create a poll',
        variant: 'destructive',
      });
      return;
    }

    if (!newPollQuestion.trim() || newPollOptions.some((opt) => !opt.trim())) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    if (newPollOptions.length > 10) {
      toast({
        title: 'Error',
        description: 'Maximum 10 options allowed per poll',
        variant: 'destructive',
      });
      return;
    }

    try {
      const endAt = new Date();
      endAt.setHours(endAt.getHours() + parseInt(duration));

      const pollData = {
        question: newPollQuestion,
        options: newPollOptions
          .filter((opt) => opt.trim())
          .map((opt) => ({ text: opt, votes: [] })),
        isActive: true,
        createdAt: serverTimestamp(),
        endAt: Timestamp.fromDate(endAt),
      };

      const pollsRef = collection(db, 'users', user.uid, 'oasis', oasisId, 'polls');
      await addDoc(pollsRef, pollData);

      setNewPollQuestion('');
      setNewPollOptions(['', '']);

      toast({
        title: 'Success',
        description: 'Poll created successfully',
      });
    } catch (error) {
      console.error('Error creating poll:', error);
      toast({
        title: 'Error',
        description: 'Failed to create poll',
        variant: 'destructive',
      });
    }
  };

  const handleAddOption = () => {
    if (newPollOptions.length >= 10) {
      toast({
        title: 'Error',
        description: 'Maximum 10 options allowed per poll',
        variant: 'destructive',
      });
      return;
    }
    setNewPollOptions([...newPollOptions, '']);
  };

  const handleRemoveOption = (indexToRemove: number) => {
    if (newPollOptions.length <= 2) {
      toast({
        title: 'Error',
        description: 'A poll must have at least 2 options',
        variant: 'destructive',
      });
      return;
    }
    setNewPollOptions(newPollOptions.filter((_, index) => index !== indexToRemove));
  };

  const handleVoteConfirm = async () => {
    const { pollId, optionIndex } = confirmVoteDialog;
    
    try {
      const user = auth.currentUser;
      if (!user) {
        toast({
          title: 'Error',
          description: 'You must be logged in to vote',
          variant: 'destructive',
        });
        return;
      }

      const pollRef = doc(db, 'users', user.uid, 'oasis', oasisId, 'polls', pollId);
      const poll = polls.find((p) => p.id === pollId);

      if (!poll) return;

      const updatedOptions = poll.options.map((opt) => ({
        ...opt,
        votes: opt.votes.filter((v) => v.userId !== user.uid),
      }));

      updatedOptions[optionIndex].votes.push({
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        timestamp: new Date(),
      });

      await updateDoc(pollRef, { options: updatedOptions });

      toast({
        title: 'Success',
        description: 'Vote recorded successfully',
      });
    } catch (error) {
      console.error('Error recording vote:', error);
      toast({
        title: 'Error',
        description: 'Failed to record vote',
        variant: 'destructive',
      });
    } finally {
      setConfirmVoteDialog({ isOpen: false, pollId: '', optionIndex: -1 });
    }
  };

  const toggleVotersList = (pollId: string, optionIndex: number) => {
    const key = `${pollId}-${optionIndex}`;
    setShowVoters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const calculatePercentage = (votes: Vote[], totalVotes: number) => {
    return totalVotes === 0 ? 0 : Math.round((votes.length / totalVotes) * 100);
  };

  const getTimeRemaining = (endAt: Date) => {
    const diff = endAt.getTime() - currentTime.getTime();
    if (diff <= 0) return 'Ended';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m remaining`;
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card
        className="h-fit"
        style={{
          background: 'rgb(17 24 39)',
          boxShadow: `0 0 20px ${themeColors.accent}`,
          border: `1px solid rgb(75 85 99)`,
        }}
      >
        <CardHeader>
          <CardTitle className="text-xl text-white flex items-center">
            <BarChart className="w-5 h-5 mr-2" />
            Create New Poll
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <textarea
                value={newPollQuestion}
                onChange={(e) => setNewPollQuestion(e.target.value)}
                placeholder="Enter poll question..."
                className="w-full h-32 px-4 py-3 text-lg bg-gray-800 border-gray-700 text-white rounded-lg resize-none"
              />
            </div>
            <div className="space-y-2">
              {newPollOptions.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...newPollOptions];
                      newOptions[index] = e.target.value;
                      setNewPollOptions(newOptions);
                    }}
                    placeholder={`Option ${index + 1}`}
                    className="h-12 px-4 text-lg bg-gray-800 border-gray-700 text-white"
                  />
                  {index >= 2 && (
                    <Button
                      onClick={() => handleRemoveOption(index)}
                      className="p-2 h-12 bg-red-500/20 hover:bg-red-500/30 text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-white">Duration:</span>
              <Button
                onClick={() => setDuration('24')}
                style={{
                  ...buttonStyle,
                  background: duration === '24'
                    ? 'linear-gradient(145deg, #38bdf8, #0284c7)' 
                    : buttonStyle.background,
                }}
              >
                <Clock className="w-4 h-4 mr-2" />
                24 Hours
              </Button>
              <Button
                onClick={() => setDuration('72')}
                style={{
                  ...buttonStyle,
                  background: duration === '72'
                    ? 'linear-gradient(145deg, #38bdf8, #0284c7)'
                    : buttonStyle.background,
                }}
              >
                <Clock className="w-4 h-4 mr-2" />
                72 Hours
              </Button>
            </div>
            <div className="flex justify-between space-x-4">
              <Button
                onClick={handleAddOption}
                style={buttonStyle}
                disabled={newPollOptions.length >= 10}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Option {newPollOptions.length}/10
              </Button>
              <Button
                onClick={handleCreatePoll}
                style={{
                  ...buttonStyle,
                  background: 'linear-gradient(145deg, #38bdf8, #0284c7)',
                }}
              >
                Create Poll
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card
        style={{
          background: 'rgb(17 24 39)',
          boxShadow: `0 0 20px ${themeColors.accent}`,
          border: `1px solid rgb(75 85 99)`,
        }}
      >
        <CardHeader>
          <CardTitle className="text-xl text-white">Active Polls</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {polls.map((poll) => {
                const totalVotes = poll.options.reduce(
                  (sum, opt) => sum + opt.votes.length,
                  0
                );
                const user = auth.currentUser;
                const hasVoted =
                  user &&
                  poll.options.some((opt) =>
                    opt.votes.some((vote) => vote.userId === user.uid)
                  );

                return (
                  <div
                    key={poll.id}
                    className="bg-gray-800/50 rounded-lg p-4 space-y-3"
                  >
                    <div className="flex flex-col space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0 pr-4">
                          <h3 className="text-lg font-semibold text-white break-words whitespace-pre-wrap">
                            {poll.question}
                          </h3>
                        </div>
                        <div className="flex-shrink-0 flex items-center ml-2">
                          {poll.isActive ? (
                            <div className="flex items-center text-green-500">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Active
                            </div>
                          ) : (
                            <div className="flex items-center text-red-500">
                              <XCircle className="w-4 h-4 mr-1" />
                              Ended
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <span>Created: {formatTimestamp(poll.createdAt)}</span>
                        <span>•</span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {getTimeRemaining(poll.endAt)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {poll.options.map((option, optionIndex) => {
                        const percentage = calculatePercentage(
                          option.votes,
                          totalVotes
                        );
                        const votersKey = `${poll.id}-${optionIndex}`;
                        const hasUserVoted =
                          user &&
                          option.votes.some((vote) => vote.userId === user.uid);

                        return (
                          <div key={optionIndex} className="space-y-1">
                            <div className="flex justify-between text-sm text-white">
                              <span className="break-words pr-2">
                                {option.text}
                              </span>
                              <span className="flex-shrink-0">
                                {option.votes.length} votes ({percentage}%)
                              </span>
                            </div>
                            <div className="relative flex items-center">
                              <Button
                                onClick={() => {
                                  if (poll.isActive && !hasVoted) {
                                    setConfirmVoteDialog({
                                      isOpen: true,
                                      pollId: poll.id,
                                      optionIndex,
                                    });
                                  }
                                }}
                                disabled={!poll.isActive || hasVoted}
                                style={hasUserVoted ? buttonStyle : {
                                  background: 'linear-gradient(145deg, #0ea5e9, #0284c7)',
                                  color: '#fff',
                                  textShadow: '0 0 5px rgba(255,255,255,0.5)',
                                  boxShadow: '0 0 10px rgba(0,0,0,0.5)',
                                  border: 'none',
                                  transition: 'all 0.1s ease',
                                }}
                                className="w-24 h-8 flex items-center justify-between px-3"
                              >
                                <span>Vote</span>
                                {hasUserVoted && (
                                  <CheckCircle className="w-3 h-3" />
                                )}
                              </Button>
                              <div
                                className="absolute top-0 left-0 h-full bg-blue-500/20 transition-all duration-300 -z-10"
                                style={{ width: `${percentage}%` }}
                              />
                              {option.votes.length > 0 && (
                                <Button
                                  onClick={() =>
                                    toggleVotersList(poll.id, optionIndex)
                                  }
                                  className="ml-2 p-1 bg-transparent hover:bg-gray-700/50 rounded-full"
                                >
                                  <Users className="w-4 h-4 text-gray-400" />
                                </Button>
                              )}
                            </div>
                            {showVoters[votersKey] &&
                              option.votes.length > 0 && (
                                <div className="ml-4 mt-1 p-2 bg-gray-900/50 rounded-lg">
                                  <div className="text-xs text-gray-400">
                                    Voters:
                                  </div>
                                  {option.votes.map((vote, voteIndex) => (
                                    <div
                                      key={voteIndex}
                                      className="text-sm text-gray-300 ml-2"
                                    >
                                      {vote.userName} -{' '}
                                      {formatTimestamp(vote.timestamp)}
                                    </div>
                                  ))}
                                </div>
                              )}
                          </div>
                        );
                      })}
                    </div>

                    {poll.endedAt && (
                      <p className="text-sm text-gray-400">
                        Ended: {formatTimestamp(poll.endedAt)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Vote Confirmation Dialog */}
      <Dialog
        open={confirmVoteDialog.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmVoteDialog({ isOpen: false, pollId: '', optionIndex: -1 });
          }
        }}
      >
        <DialogContent className="bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
              Confirm Vote
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p>Are you sure you want to cast your vote? This action cannot be undone.</p>
            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => setConfirmVoteDialog({ isOpen: false, pollId: '', optionIndex: -1 })}
                variant="outline"
                className="bg-gray-800 hover:bg-gray-700 text-white border-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleVoteConfirm}
                style={buttonStyle}
              >
                Confirm Vote
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PollManager;