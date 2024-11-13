import React from 'react';
import { Mic } from 'lucide-react';

interface AudioVisualizerProps {
  level: number;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ level }) => {
  const isActive = level > 0.1;

  return (
    <div className={`text-${isActive ? 'green' : 'gray'}-500 transition-colors duration-200`}>
      <Mic className="w-4 h-4" />
    </div>
  );
};

export default AudioVisualizer;