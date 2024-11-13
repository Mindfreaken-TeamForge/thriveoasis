import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Mic, MicOff } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ThemeColors } from '@/themes';

interface CallParticipant {
  userId: string;
  userName: string;
  role: 'host' | 'participant';
  joinedAt: Date;
}

interface CallParticipantsUIProps {
  participants: CallParticipant[];
  activeSpeakers: Record<string, number>;
  themeColors: ThemeColors;
  isCallActive: boolean;
}

const CallParticipantsUI: React.FC<CallParticipantsUIProps> = ({
  participants,
  activeSpeakers,
  themeColors,
  isCallActive,
}) => {
  // Helper function to determine speaking intensity
  const getSpeakingIntensity = (level: number) => {
    if (level > 0.75) return 'high';
    if (level > 0.3) return 'medium';
    if (level > 0) return 'low';
    return 'none';
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Phone className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">Voice Channel</h3>
        </div>
        <Badge 
          variant={isCallActive ? "default" : "secondary"}
          className={`${isCallActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}
        >
          {isCallActive ? 'Active Call' : 'No Active Call'}
        </Badge>
      </div>

      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-2">
          <AnimatePresence>
            {participants.map((participant) => {
              const speakingLevel = activeSpeakers[participant.userId] || 0;
              const intensity = getSpeakingIntensity(speakingLevel);
              const isActive = intensity !== 'none';
              
              return (
                <motion.div
                  key={participant.userId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    scale: isActive ? 1.02 : 1,
                    transition: {
                      scale: {
                        duration: 0.2,
                        ease: "easeOut"
                      }
                    }
                  }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex items-center p-3 rounded-lg transition-all duration-200 ${
                    isActive ? 'bg-green-500/10' : 'hover:bg-gray-700/30'
                  }`}
                  style={{
                    border: isActive ? `1px solid ${themeColors.accent}40` : '1px solid transparent',
                    boxShadow: isActive ? `0 0 10px ${themeColors.accent}20` : 'none',
                  }}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage 
                        src={`https://api.dicebear.com/6.x/initials/svg?seed=${participant.userName}`}
                        alt={participant.userName} 
                      />
                      <AvatarFallback>{participant.userName[0]}</AvatarFallback>
                    </Avatar>
                    <motion.div
                      className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${
                        isActive ? 'bg-green-500' : 'bg-gray-600'
                      }`}
                      animate={{
                        scale: isActive ? [1, 1.2, 1] : 1,
                        opacity: isActive ? 1 : 0.7,
                        boxShadow: isActive ? [
                          '0 0 0 0 rgba(34, 197, 94, 0)',
                          '0 0 0 4px rgba(34, 197, 94, 0.3)',
                          '0 0 0 0 rgba(34, 197, 94, 0)'
                        ] : 'none',
                      }}
                      transition={{
                        duration: 0.8,
                        repeat: isActive ? Infinity : 0,
                        repeatType: "reverse",
                      }}
                    >
                      {isActive ? (
                        <motion.div
                          animate={{
                            scale: [1, 1.2, 1],
                          }}
                          transition={{
                            duration: 0.3,
                            repeat: Infinity,
                            repeatType: "reverse",
                          }}
                        >
                          <Mic className="w-3 h-3 text-white" />
                        </motion.div>
                      ) : (
                        <MicOff className="w-3 h-3 text-gray-300" />
                      )}
                    </motion.div>
                  </div>

                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {participant.userName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {participant.role === 'host' ? 'Call Host' : 'Participant'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isActive && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                            className="flex space-x-1"
                          >
                            {[...Array(intensity === 'high' ? 3 : intensity === 'medium' ? 2 : 1)].map((_, i) => (
                              <motion.div
                                key={i}
                                className="w-1 bg-green-400"
                                animate={{
                                  height: [4, 12, 4],
                                }}
                                transition={{
                                  duration: 0.4,
                                  repeat: Infinity,
                                  repeatType: "reverse",
                                  delay: i * 0.1,
                                }}
                              />
                            ))}
                          </motion.div>
                        )}
                        {participant.role === 'host' && (
                          <Badge className="bg-blue-500/20 text-blue-400">
                            Host
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {participants.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No participants in the call
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CallParticipantsUI;