import React from 'react';
import { Slider } from '@/components/ui/slider';

interface ProgressBarProps {
  progress: number;
  currentTime: number;
  duration: number;
  onSeek: (value: number[]) => void;
  disabled?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  currentTime,
  duration,
  onSeek,
  disabled = false
}) => {
  const formatTime = (time: number) => {
    if (!isFinite(time) || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1">
      <Slider
        value={[progress]}
        max={100}
        step={0.1}
        onValueChange={onSeek}
        className="w-full"
        disabled={disabled}
      />
      <div className="flex justify-between mt-1 text-xs text-gray-400">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
};

export default ProgressBar;