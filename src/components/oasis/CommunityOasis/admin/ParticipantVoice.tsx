import React, { useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mic } from 'lucide-react';

interface ParticipantVoiceProps {
  participant: {
    userId: string;
    userName: string;
    role: 'host' | 'participant';
    joinedAt: Date;
  };
  audioLevel: number;
  isActive: boolean;
}

const ParticipantVoice: React.FC<ParticipantVoiceProps> = ({
  participant,
  audioLevel,
  isActive
}) => {
  const controls = useAnimation();
  const lastUpdateTime = useRef(Date.now());
  const lastLevel = useRef(0);
  const activeTimeout = useRef<NodeJS.Timeout | null>(null);
  const deactivationTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const now = Date.now();
    const timeDiff = now - lastUpdateTime.current;
    
    // Smooth out rapid changes
    const smoothedLevel = timeDiff > 50 
      ? audioLevel 
      : audioLevel * 0.3 + lastLevel.current * 0.7;

    lastLevel.current = smoothedLevel;
    lastUpdateTime.current = now;

    // Clear existing timeouts
    if (activeTimeout.current) {
      clearTimeout(activeTimeout.current);
    }
    if (deactivationTimeout.current) {
      clearTimeout(deactivationTimeout.current);
    }

    if (isActive) {
      // Cancel any pending deactivation
      controls.stop();
      
      controls.start({
        scale: 1.02,
        opacity: 1,
        borderColor: 'rgba(34, 197, 94, 0.5)',
        transition: { duration: 0.3 }
      });

      // Set up deactivation after delay
      deactivationTimeout.current = setTimeout(() => {
        controls.start({
          scale: 1,
          opacity: 0.7,
          borderColor: 'transparent',
          transition: { duration: 0.3 }
        });
      }, 500);
    }

    return () => {
      if (activeTimeout.current) {
        clearTimeout(activeTimeout.current);
      }
      if (deactivationTimeout.current) {
        clearTimeout(deactivationTimeout.current);
      }
    };
  }, [audioLevel, isActive, controls]);

  return (
    <motion.div 
      className={`flex items-center p-2 rounded-lg transition-colors duration-300 ${
        isActive ? 'bg-green-500/10' : 'hover:bg-gray-700/30'
      }`}
      animate={controls}
    >
      <div className="relative">
        <Avatar className="h-8 w-8">
          <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${participant.userName}`} />
          <AvatarFallback>{participant.userName[0]}</AvatarFallback>
        </Avatar>
        <motion.div
          className="absolute -bottom-1 -right-1 flex items-center justify-center w-5 h-5 bg-gray-900 rounded-full"
          initial={{ scale: 0.8, opacity: 0.5 }}
          animate={{ 
            scale: isActive ? 1 : 0.8,
            opacity: isActive ? 1 : 0.5
          }}
          transition={{
            duration: 0.3,
            ease: "easeOut"
          }}
        >
          <Mic className={`w-3.5 h-3.5 ${isActive ? 'text-green-500' : 'text-gray-500'}`} />
        </motion.div>
      </div>
      
      <div className="ml-3 flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-white truncate">
            {participant.userName}
            <span className="ml-2 text-xs text-gray-400">
              {participant.role}
            </span>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default ParticipantVoice;