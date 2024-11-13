import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import CallRecordingPlayer from './CallRecordingPlayer';

interface RecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordingPath: string;
  callId: string;
}

const RecordingModal: React.FC<RecordingModalProps> = ({
  isOpen,
  onClose,
  recordingPath,
  callId,
}) => {
  const { toast } = useToast();

  const shinyBlackButtonStyle: React.CSSProperties = {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gray-900 text-white border-gray-700">
        <DialogHeader className="relative">
          <DialogTitle>Call Recording</DialogTitle>
          <Button
            onClick={onClose}
            variant="ghost"
            className="absolute right-2 top-2 h-8 w-8 p-0 text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <CallRecordingPlayer
            src={recordingPath}
            onError={(error) => {
              toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
              });
            }}
          />
          <Button
            onClick={onClose}
            style={shinyBlackButtonStyle}
          >
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
          <p className="text-sm text-gray-400 text-center">
            Recording ID: {callId}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecordingModal;