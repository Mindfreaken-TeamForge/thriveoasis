import React from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlaybackControlsProps {
  isPlaying: boolean;
  isLoading: boolean;
  onPlayPause: () => void;
  disabled?: boolean;
}

const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  isLoading,
  onPlayPause,
  disabled = false
}) => {
  return (
    <Button
      onClick={onPlayPause}
      variant="ghost"
      size="sm"
      className="w-8 h-8 p-0"
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      ) : isPlaying ? (
        <Pause className="h-4 w-4" />
      ) : (
        <Play className="h-4 w-4" />
      )}
    </Button>
  );
};

export default PlaybackControls;