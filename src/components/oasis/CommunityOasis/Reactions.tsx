import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

interface ReactionsProps {
  reactions: Reaction[];
  onToggleReaction: (emoji: string) => void;
  currentUserId?: string;
}

const Reactions: React.FC<ReactionsProps> = ({
  reactions,
  onToggleReaction,
  currentUserId,
}) => {
  // Only render if there are reactions with counts greater than 0
  const activeReactions = reactions.filter(reaction => reaction.count > 0);
  if (activeReactions.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-1 mt-1"
    >
      {activeReactions.map((reaction) => (
        <Button
          key={reaction.emoji}
          variant="ghost"
          size="sm"
          onClick={() => onToggleReaction(reaction.emoji)}
          className={`
            h-6 px-1.5 rounded-full flex items-center space-x-1 text-xs
            ${reaction.users.includes(currentUserId || '') 
              ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30' 
              : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
            }
          `}
        >
          <span className="text-sm">{reaction.emoji}</span>
          <span className="font-medium">{reaction.count}</span>
        </Button>
      ))}
    </motion.div>
  );
};

export default Reactions;