import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VolumeControlProps {
  isMuted: boolean;
  onToggleMute: () => void;
  disabled?: boolean;
}

const VolumeControl: React.FC<VolumeControlProps> = ({
  isMuted,
  onToggleMute,
  disabled = false
}) => {
  return (
    <Button
      onClick={onToggleMute}
      variant="ghost"
      size="sm"
      className="w-8 h-8 p-0"
      disabled={disabled}
    >
      {isMuted ? (
        <VolumeX className="h-4 w-4" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
    </Button>
  );
};

export default VolumeControl;